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
public class FinancialReportsController : ControllerBase
{
    private readonly IFinancialReportService _reportService;
    private readonly TenantContext _tenantContext;

    public FinancialReportsController(IFinancialReportService reportService, TenantContext tenantContext)
    {
        _reportService = reportService;
        _tenantContext = tenantContext;
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenueReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _reportService.GetRevenueReportAsync(_tenantContext.TenantId.Value, from, to);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("profit-loss")]
    public async Task<IActionResult> GetProfitLoss([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _reportService.GetProfitLossAsync(_tenantContext.TenantId.Value, from, to);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("cash-flow")]
    public async Task<IActionResult> GetCashFlow([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _reportService.GetCashFlowAsync(_tenantContext.TenantId.Value, from, to);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("client-statement/{clientId}")]
    public async Task<IActionResult> GetClientStatement(int clientId)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _reportService.GetClientStatementAsync(clientId, _tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }
}
