using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Report;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly TenantContext _tenantContext;

    public ReportsController(IReportService reportService, TenantContext tenantContext)
    {
        _reportService = reportService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetReports()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _reportService.GetReportsAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Category))
            return BadRequest(new { success = false, message = "عنوان التقرير والفئة مطلوبان" });

        var result = await _reportService.CreateReportAsync(dto, _tenantContext.TenantId.Value);
        return Ok(new { success = true, message = "تم إنشاء التقرير بنجاح", data = result });
    }
}
