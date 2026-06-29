using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Accountant;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountantController : ControllerBase
{
    private readonly IAccountantService _accountantService;
    private readonly TenantContext _tenantContext;

    public AccountantController(IAccountantService accountantService, TenantContext tenantContext)
    {
        _accountantService = accountantService;
        _tenantContext = tenantContext;
    }

    [Authorize(Roles = "Owner,SystemAdmin")]
    [HttpGet]
    public async Task<IActionResult> GetAccountants()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var result = await _accountantService.GetAccountantsAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Owner,SystemAdmin")]
    [HttpGet("dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var result = await _accountantService.GetAccountantDashboardStatsAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Owner,SystemAdmin")]
    [HttpPost]
    public async Task<IActionResult> CreateAccountant([FromBody] CreateAccountantDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });

        try
        {
            var result = await _accountantService.CreateAccountantAsync(dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            return Ok(new { success = true, message = "تم إنشاء المحاسب بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Owner,SystemAdmin")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        try
        {
            var result = await _accountantService.UpdateAccountantStatusAsync(id, status, _tenantContext.TenantId.Value);
            return Ok(new { success = true, message = "تم تحديث حالة المحاسب", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Owner,SystemAdmin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccountant(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        try
        {
            await _accountantService.DeleteAccountantAsync(id, _tenantContext.TenantId.Value);
            return Ok(new { success = true, message = "تم حذف المحاسب بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("my-dashboard")]
    public async Task<IActionResult> GetMyDashboard()
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });

        var result = await _accountantService.GetAccountantDashboardStatsAsync(_tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("full-dashboard")]
    public async Task<IActionResult> GetFullDashboard()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });

        var result = await _accountantService.GetFullDashboardAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }
}
