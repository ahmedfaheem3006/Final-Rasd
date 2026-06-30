using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL.DTOs.Tenant;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;
    private readonly IPendingRegistrationService _pendingRegistrationService;

    public TenantsController(ITenantService tenantService, IPendingRegistrationService pendingRegistrationService)
    {
        _tenantService = tenantService;
        _pendingRegistrationService = pendingRegistrationService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterTenant([FromBody] CreatePendingRegistrationDto dto)
    {
        try
        {
            var result = await _pendingRegistrationService.CreateAsync(dto);
            return Ok(new { success = true, message = "تم تقديم طلب تسجيل الشركة بنجاح. ينتظر موافقة الإدارة.", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet("check-exists")]
    public async Task<IActionResult> CheckTenantExists([FromQuery] string companyName)
    {
        var exists = await _tenantService.CheckTenantExistsByNameAsync(companyName);
        return Ok(new { exists });
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "SystemAdmin")]
    public async Task<IActionResult> GetTenant(Guid id)
    {
        var tenant = await _tenantService.GetTenantByIdAsync(id);
        if (tenant == null) return NotFound(new { success = false, message = "الشركة غير موجودة" });

        return Ok(new { success = true, data = tenant });
    }
}
