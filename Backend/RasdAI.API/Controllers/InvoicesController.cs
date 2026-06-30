using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Invoice;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly TenantContext _tenantContext;

    public InvoicesController(IInvoiceService invoiceService, TenantContext tenantContext)
    {
        _invoiceService = invoiceService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetInvoices()
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var result = await _invoiceService.GetInvoicesAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto createInvoiceDto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });
        }

        var result = await _invoiceService.CreateInvoiceAsync(createInvoiceDto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, message = "تم إنشاء الفاتورة بنجاح", data = result });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateInvoiceStatus(int id, [FromBody] string status)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var success = await _invoiceService.UpdateInvoiceStatusAsync(id, status, _tenantContext.TenantId.Value);
        if (!success)
        {
            return NotFound(new { success = false, message = "الفاتورة غير موجودة أو لا تنتمي لشركتك" });
        }

        return Ok(new { success = true, message = "تم تحديث حالة الفاتورة بنجاح" });
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadInvoicePdf(int id)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest("معرف الشركة غير متوفر في السياق");
        }

        var pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(id, _tenantContext.TenantId.Value);
        return File(pdfBytes, "application/pdf", $"invoice_{id}.pdf");
    }
}
