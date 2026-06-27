using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly TenantContext _tenantContext;

    public DashboardController(IDashboardService dashboardService, TenantContext tenantContext)
    {
        _dashboardService = dashboardService;
        _tenantContext = tenantContext;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var result = await _dashboardService.GetDashboardStatsAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }
}
