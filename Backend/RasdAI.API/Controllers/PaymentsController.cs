using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RasdAI.API.Hubs;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Payment;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly TenantContext _tenantContext;
    private readonly IHubContext<NotificationHub> _hubContext;

    public PaymentsController(IPaymentService paymentService, TenantContext tenantContext, IHubContext<NotificationHub> hubContext)
    {
        _paymentService = paymentService;
        _tenantContext = tenantContext;
        _hubContext = hubContext;
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet]
    public async Task<IActionResult> GetPayments([FromQuery] string? status, [FromQuery] string? search, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _paymentService.GetPaymentsAsync(_tenantContext.TenantId.Value, status, search, from, to, page, pageSize);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPayment(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _paymentService.GetPaymentByIdAsync(id, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "الدفعة غير موجودة" });
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _paymentService.GetPaymentDashboardAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("unpaid-invoices")]
    public async Task<IActionResult> GetUnpaidInvoices([FromQuery] string? search)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _paymentService.GetUnpaidInvoicesAsync(_tenantContext.TenantId.Value, search);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("{id}/receipt")]
    public async Task<IActionResult> GetPaymentReceipt(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _paymentService.GetPaymentReceiptAsync(id, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "الدفعة غير موجودة" });
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpPost]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });
        try
        {
            var result = await _paymentService.CreatePaymentAsync(dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);

            await _hubContext.Clients.Group(_tenantContext.TenantId.Value.ToString())
                .SendAsync("PaymentCreated", result);

            return Ok(new { success = true, message = "تم تسجيل الدفعة بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePayment(int id, [FromBody] UpdatePaymentDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });
        try
        {
            var result = await _paymentService.UpdatePaymentAsync(id, dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);

            await _hubContext.Clients.Group(_tenantContext.TenantId.Value.ToString())
                .SendAsync("PaymentUpdated", result);

            return Ok(new { success = true, message = "تم تحديث الدفعة بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePayment(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        try
        {
            await _paymentService.DeletePaymentAsync(id, _tenantContext.TenantId.Value);

            await _hubContext.Clients.Group(_tenantContext.TenantId.Value.ToString())
                .SendAsync("PaymentDeleted", new { id });

            return Ok(new { success = true, message = "تم حذف الدفعة بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
