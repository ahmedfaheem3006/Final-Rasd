using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RasdAI.BLL;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.API.Middlewares;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly Dictionary<string, Func<Tenant, bool>> ModuleRoutePrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["/api/customers"] = t => t.IsCrmEnabled,
        ["/api/invoices"]  = t => t.IsInvoicesEnabled,
        ["/api/tasks"]     = t => t.IsTasksEnabled,
        ["/api/meetings"]  = t => t.IsMeetingsEnabled,
        ["/api/ai"]        = t => t.IsAiEnabled,
    };

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext, ITenantProvider tenantProvider)
    {
        // 1. Try to get Tenant ID from request header
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdHeader))
        {
            if (Guid.TryParse(tenantIdHeader, out var parsedTenantId))
            {
                tenantContext.TenantId = parsedTenantId;
                tenantProvider.TenantId = parsedTenantId;
            }
        }

        // 2. If user is authenticated, parse claims from JWT Token
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                tenantContext.UserId = userId;
            }

            var roleClaim = context.User.FindFirst(ClaimTypes.Role);
            if (roleClaim != null)
            {
                tenantContext.Role = roleClaim.Value;
            }

            // JWT TenantId overrides header for security (prevents Tenant ID spoofing by authenticated users)
            var tenantClaim = context.User.FindFirst("TenantId");
            if (tenantClaim != null && Guid.TryParse(tenantClaim.Value, out var claimTenantId))
            {
                tenantContext.TenantId = claimTenantId;
                tenantProvider.TenantId = claimTenantId;
            }
        }

        // Check subscription state and module access (except for SystemAdmin)
        if (tenantContext.TenantId != null && tenantContext.Role != "SystemAdmin")
        {
            var dbContext = context.RequestServices.GetRequiredService<AppDbContext>();
            var tenant = await dbContext.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.TenantId == tenantContext.TenantId.Value);
            if (tenant != null)
            {
                // Enforce free trial expiry on every request, not just at login
                if (tenant.IsActive && tenant.Price == 0.0m && tenant.CreatedAt.AddDays(3) < DateTime.UtcNow)
                {
                    tenant.IsActive = false;
                    await dbContext.SaveChangesAsync();
                }

                if (!tenant.IsActive)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    var message = tenant.Price == 0.0m
                        ? "انتهت صلاحية الفترة التجريبية المجانية (3 أيام). يرجى الترقية إلى باقة مدفوعة."
                        : "تم إيقاف عمل هذه الشركة مؤقتاً. يرجى التواصل مع إدارة النظام.";
                    await context.Response.WriteAsJsonAsync(new { success = false, message });
                    return;
                }

                // Enforce module-level access based on the 5 feature toggles
                foreach (var (prefix, isEnabled) in ModuleRoutePrefixes)
                {
                    if (context.Request.Path.StartsWithSegments(prefix, StringComparison.OrdinalIgnoreCase) && !isEnabled(tenant))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsJsonAsync(new { success = false, message = "هذه الميزة غير متاحة في باقتك الحالية. يرجى التواصل مع إدارة النظام للترقية." });
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}
