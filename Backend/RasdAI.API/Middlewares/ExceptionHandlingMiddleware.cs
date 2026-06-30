using System;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.API.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ غير متوقع في النظام: {Message}", ex.Message);
            
            // Log to local file fallback
            try
            {
                var logPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "unhandled_exceptions.log");
                System.IO.File.AppendAllText(logPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] Unhandled Exception: {ex.Message}\nStack Trace: {ex.StackTrace}\n\n");
            }
            catch { }

            // Log directly to the SupportIssues DB table
            try
            {
                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var tenantId = Guid.Empty;
                    var tenantName = "نظام رصد العام";

                    var identity = context.User?.Identity;
                    if (identity != null && identity.IsAuthenticated)
                    {
                        var tenantIdClaim = context.User?.FindFirst("TenantId")?.Value;
                        if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var parsedTenantId))
                        {
                            tenantId = parsedTenantId;
                            var tenant = await dbContext.Tenants.FindAsync(tenantId);
                            if (tenant != null)
                            {
                                tenantName = tenant.Name;
                            }
                        }
                    }

                    var aiSuggestion = GenerateAiSuggestion(ex);

                    var issue = new SupportIssue
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        TenantName = tenantName,
                        IssueDescription = ex.Message,
                        Status = "Pending",
                        AiActionDetails = aiSuggestion,
                        CreatedAt = DateTime.UtcNow
                    };

                    dbContext.SupportIssues.Add(issue);
                    await dbContext.SaveChangesAsync();
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "Failed to log exception to SupportIssues DB table");
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private static string GenerateAiSuggestion(Exception ex)
    {
        var msg = ex.Message.ToLower();
        if (ex is NullReferenceException)
        {
            return "فحص الكود: تم رصد إشارة لمتغير فارغ (Null). تحقق من سلامة ربط البيانات (Data Binding) أو أضف معاملات التحقق من القيم الفارغة (Null checking).";
        }
        else if (msg.Contains("database") || msg.Contains("sql") || msg.Contains("entity") || msg.Contains("context"))
        {
            return "فحص قاعدة البيانات: تم رصد مشكلة في الوصول لقاعدة البيانات. تحقق من سلامة جملة الاتصال (Connection String) أو أضف فحصاً لحالة اتصال الخادم وسياق المعاملات الجارية (Active Transactions).";
        }
        else if (msg.Contains("unauthorized") || msg.Contains("auth") || msg.Contains("token") || msg.Contains("role"))
        {
            return "فحص الصلاحيات: تم رصد خطأ في التوثيق أو الصلاحيات. يرجى التحقق من توكن تسجيل الدخول (JWT Token) وصلاحية المستخدم لإتمام العملية.";
        }
        else if (msg.Contains("not found") || msg.Contains("key"))
        {
            return "فحص الموارد: العنصر المطلوب غير موجود بقاعدة البيانات. تأكد من أن المعرف المرسل (ID) صحيح ومطابق للمخزن بالخادم.";
        }
        else
        {
            return "فحص النظام العام: خطأ غير معروف في خط التنفيذ. نوصي بمراجعة مسار استدعاء الدالة (Stack Trace) والتحقق من حدود المدخلات وقيم المتغيرات.";
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var result = JsonSerializer.Serialize(new
        {
            success = false,
            message = exception.Message,
            detail = exception.InnerException?.Message
        });

        return context.Response.WriteAsync(result);
    }
}
