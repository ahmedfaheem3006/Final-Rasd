using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Tenant;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SystemAdmin")]
public class SystemAdminController : ControllerBase
{
    private readonly ITenantService _tenantService;
    private readonly AppDbContext _context;
    private readonly IAiService _aiService;

    public SystemAdminController(ITenantService tenantService, AppDbContext context, IAiService aiService)
    {
        _tenantService = tenantService;
        _context = context;
        _aiService = aiService;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetAllTenants()
    {
        try
        {
            var result = await _tenantService.GetAllTenantsAsync();
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantAdminDto createTenantAdminDto)
    {
        try
        {
            var result = await _tenantService.CreateTenantByAdminAsync(createTenantAdminDto);
            return Ok(new { success = true, message = "تم تسجيل الشركة والمالك بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("tenants/{id}/status")]
    public async Task<IActionResult> UpdateTenantStatus(Guid id, [FromBody] UpdateTenantStatusDto statusDto)
    {
        try
        {
            var success = await _tenantService.UpdateTenantStatusAsync(id, statusDto.IsActive);
            return Ok(new { success = true, message = "تم تحديث حالة الشركة بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("tenants/{id}/pricing")]
    public async Task<IActionResult> UpdateTenantPricing(Guid id, [FromBody] UpdateTenantPricingDto pricingDto)
    {
        try
        {
            var success = await _tenantService.UpdateTenantPricingAsync(id, pricingDto.Price, pricingDto.AiLimit);
            return Ok(new { success = true, message = "تم تحديث سعر الاشتراك والحد الأقصى للذكاء الاصطناعي بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("tenants/{id}/update-full")]
    public async Task<IActionResult> UpdateTenantFull(Guid id, [FromBody] UpdateTenantFullDto dto)
    {
        try
        {
            var tenant = await _context.Tenants
                .IgnoreQueryFilters()
                .Include(t => t.Users)
                .FirstOrDefaultAsync(t => t.TenantId == id);
                
            if (tenant == null)
                return NotFound(new { success = false, message = "الشركة غير موجودة" });

            tenant.Name = dto.Name;
            tenant.Price = dto.Price;
            tenant.AiLimit = dto.AiLimit;
            tenant.IsActive = dto.IsActive;
            tenant.IsCrmEnabled = dto.IsCrmEnabled;
            tenant.IsInvoicesEnabled = dto.IsInvoicesEnabled;
            tenant.IsTasksEnabled = dto.IsTasksEnabled;
            tenant.IsMeetingsEnabled = dto.IsMeetingsEnabled;
            tenant.IsAiEnabled = dto.IsAiEnabled;

            // Also update the manager user if exists (RoleId = 2)
            var owner = tenant.Users.FirstOrDefault(u => u.RoleId == 2);
            if (owner != null)
            {
                owner.FullName = dto.OwnerName;
                owner.Email = dto.OwnerEmail;
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "تم تحديث بيانات الشركة والمالك بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("tenants/{id}/permissions")]
    public async Task<IActionResult> UpdateTenantPermissions(Guid id, [FromBody] TenantPermissionsDto permissionsDto)
    {
        try
        {
            var success = await _tenantService.UpdateTenantPermissionsAsync(id, permissionsDto);
            return Ok(new { success = true, message = "تم تحديث صلاحيات الوصول للشركات بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("tenants/{id}")]
    public async Task<IActionResult> DeleteTenant(Guid id)
    {
        try
        {
            var success = await _tenantService.DeleteTenantAsync(id);
            return Ok(new { success = true, message = "تم حذف الشركة وكل بياناتها التابعة بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("issues")]
    public async Task<IActionResult> GetIssues()
    {
        try
        {
            var result = await _context.SupportIssues.OrderByDescending(i => i.CreatedAt).ToListAsync();
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("issues/{id}/action")]
    public async Task<IActionResult> ResolveIssue(Guid id, [FromBody] IssueActionDto actionDto)
    {
        try
        {
            var issue = await _context.SupportIssues.FindAsync(id);
            if (issue == null) return NotFound(new { success = false, message = "المشكلة غير موجودة" });

            issue.Status = actionDto.Action; // Approved or Rejected
            await _context.SaveChangesAsync();
            
            return Ok(new { success = true, message = $"تم إرسال قرار {actionDto.Action} بنجاح لصاحب النظام" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("issues/{id}")]
    public async Task<IActionResult> DeleteIssue(Guid id)
    {
        try
        {
            var issue = await _context.SupportIssues.FindAsync(id);
            if (issue == null) return NotFound(new { success = false, message = "المشكلة غير موجودة" });
            _context.SupportIssues.Remove(issue);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "تم حذف المشكلة بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("issues/bulk")]
    public async Task<IActionResult> BulkAction([FromBody] BulkIssueActionDto dto)
    {
        try
        {
            var pending = await _context.SupportIssues.Where(i => i.Status == "Pending").ToListAsync();
            foreach (var issue in pending) issue.Status = dto.Action;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"تم تطبيق الإجراء على {pending.Count} مشكلة.", count = pending.Count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("run-ai-scan")]
    public async Task<IActionResult> RunAiScan()
    {
        try
        {
            var newIssues = await _aiService.RunSupportScanAsync();
            var message = newIssues.Count > 0
                ? $"تم اكتشاف {newIssues.Count} مشكلة جديدة وإضافتها للمراجعة."
                : "لم يتم اكتشاف مشكلات جديدة. جميع الأنظمة تعمل بشكل طبيعي.";
            return Ok(new { success = true, message, data = newIssues, count = newIssues.Count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("run-ai-scan/{tenantId}")]
    public async Task<IActionResult> RunTenantScan(Guid tenantId)
    {
        try
        {
            var newIssues = await _aiService.RunSupportScanAsync(tenantId);
            var message = newIssues.Count > 0
                ? $"تم اكتشاف {newIssues.Count} مشكلة جديدة لهذه الشركة."
                : "لا توجد مشكلات مكتشفة لهذه الشركة حالياً.";
            return Ok(new { success = true, message, data = newIssues, count = newIssues.Count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        try
        {
            var totalCompanies = await _context.Tenants.CountAsync();
            var chatAiRequests = await _context.AIConversations.CountAsync();
            var contractAiRequests = await _context.Contracts.CountAsync();
            var meetingAiRequests = await _context.Meetings.CountAsync();
            var totalAiRequests = chatAiRequests + contractAiRequests + meetingAiRequests;

            // Simulated dynamic diagnostics
            var rand = new Random();
            var cpu = Math.Round(20.0 + rand.NextDouble() * 25.0, 2); // 20% to 45%
            var ram = Math.Round(7.5 + rand.NextDouble() * 1.5, 2);  // 7.5 GB to 9.0 GB

            var recentTenants = await _context.Tenants
                .OrderByDescending(t => t.CreatedAt)
                .Take(5)
                .ToListAsync();

            var logs = new List<SystemLogDto>();
            foreach (var t in recentTenants)
            {
                logs.Add(new SystemLogDto
                {
                    Event = $"تسجيل شركة جديدة: {t.Name}",
                    Time = t.CreatedAt.ToString("o"),
                    Type = "info"
                });
            }

            // Also check issues for error logs
            var pendingIssues = await _context.SupportIssues
                .Where(i => i.Status == "Pending")
                .Take(3)
                .ToListAsync();

            foreach (var issue in pendingIssues)
            {
                logs.Add(new SystemLogDto
                {
                    Event = $"خطأ تم رصده في شركة {issue.TenantName}: {issue.IssueDescription}",
                    Time = issue.CreatedAt.ToString("o"),
                    Type = "warning"
                });
            }

            if (logs.Count == 0)
            {
                logs.Add(new SystemLogDto
                {
                    Event = "النظام يعمل بشكل مستقر، لا توجد تنبيهات حديثة.",
                    Time = DateTime.UtcNow.ToString("o"),
                    Type = "info"
                });
            }

            // Sort logs by time descending
            logs = logs.OrderByDescending(l => l.Time).ToList();

            var dto = new SystemAdminStatsDto
            {
                CpuUsage = cpu,
                RamUsageGb = ram,
                RamTotalGb = 16.0,
                CpuStatus = cpu > 80 ? "High" : "Normal",
                RamStatus = ram > 14 ? "Critical" : "Stable",
                HealthStatus = (cpu > 80 || ram > 14) ? "Warning" : "Excellent",
                UptimePercent = "99.98% Uptime",
                TotalCompanies = totalCompanies,
                TotalAiRequests = totalAiRequests,
                ChatAiRequests = chatAiRequests,
                ContractAiRequests = contractAiRequests,
                MeetingAiRequests = meetingAiRequests,
                RecentLogs = logs
            };

            return Ok(new { success = true, data = dto });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("pricing-plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPricingPlans()
    {
        try
        {
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing_plans.json");
            if (!System.IO.File.Exists(path))
            {
                var srcPath = Path.Combine(Directory.GetCurrentDirectory(), "pricing_plans.json");
                if (System.IO.File.Exists(srcPath)) path = srcPath;
                else return NotFound(new { success = false, message = "ملف الأسعار غير موجود" });
            }
            var json = await System.IO.File.ReadAllTextAsync(path);
            var plans = JsonSerializer.Deserialize<object>(json);
            return Ok(new { success = true, data = plans });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("pricing-plans")]
    public async Task<IActionResult> UpdatePricingPlans([FromBody] object plans)
    {
        try
        {
            var json = JsonSerializer.Serialize(plans, new JsonSerializerOptions { WriteIndented = true });
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing_plans.json");
            await System.IO.File.WriteAllTextAsync(path, json);

            var srcPath = Path.Combine(Directory.GetCurrentDirectory(), "pricing_plans.json");
            if (Directory.Exists(Path.GetDirectoryName(srcPath)!))
            {
                await System.IO.File.WriteAllTextAsync(srcPath, json);
            }

            return Ok(new { success = true, message = "تم تحديث خطط الأسعار بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("settings-config")]
    public async Task<IActionResult> GetSettingsConfig()
    {
        try
        {
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "system_settings.json");
            if (!System.IO.File.Exists(path))
            {
                var srcPath = Path.Combine(Directory.GetCurrentDirectory(), "system_settings.json");
                if (System.IO.File.Exists(srcPath)) path = srcPath;
                else return Ok(new { success = true, data = new { enableGlobalNotifications = true, enableAiSupport = true } });
            }
            var json = await System.IO.File.ReadAllTextAsync(path);
            var config = JsonSerializer.Deserialize<object>(json);
            return Ok(new { success = true, data = config });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("settings-config")]
    public async Task<IActionResult> UpdateSettingsConfig([FromBody] object config)
    {
        try
        {
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "system_settings.json");
            await System.IO.File.WriteAllTextAsync(path, json);

            var srcPath = Path.Combine(Directory.GetCurrentDirectory(), "system_settings.json");
            if (Directory.Exists(Path.GetDirectoryName(srcPath)!))
            {
                await System.IO.File.WriteAllTextAsync(srcPath, json);
            }

            return Ok(new { success = true, message = "تم تحديث إعدادات النظام بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}

public class UpdateTenantStatusDto
{
    public bool IsActive { get; set; }
}

public class UpdateTenantPricingDto
{
    public decimal Price { get; set; }
    public int AiLimit { get; set; }
}

public class IssueActionDto
{
    public string Action { get; set; } = string.Empty; // Approved or Rejected
}

public class BulkIssueActionDto
{
    public string Action { get; set; } = string.Empty; // Approved or Rejected
}

public class UpdateTenantFullDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int AiLimit { get; set; }
    public bool IsActive { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public bool IsCrmEnabled { get; set; }
    public bool IsInvoicesEnabled { get; set; }
    public bool IsTasksEnabled { get; set; }
    public bool IsMeetingsEnabled { get; set; }
    public bool IsAiEnabled { get; set; }
}
