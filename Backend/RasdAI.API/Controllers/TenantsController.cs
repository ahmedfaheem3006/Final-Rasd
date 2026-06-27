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

    public TenantsController(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterTenant([FromBody] CreateTenantDto createTenantDto)
    {
        var result = await _tenantService.RegisterTenantAsync(createTenantDto);
        return Ok(new { success = true, message = "تم تسجيل الشركة وحساب المالك بنجاح", data = result });
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
