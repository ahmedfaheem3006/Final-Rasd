using System;
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

    public SystemAdminController(ITenantService tenantService, AppDbContext context)
    {
        _tenantService = tenantService;
        _context = context;
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
