using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Customer;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICrmService _crmService;
    private readonly TenantContext _tenantContext;

    public CustomersController(ICrmService crmService, TenantContext tenantContext)
    {
        _crmService = crmService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetClients()
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var result = await _crmService.GetClientsAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> CreateClient([FromBody] CreateClientDto createClientDto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة في السياق" });
        }

        var result = await _crmService.CreateClientAsync(createClientDto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, message = "تمت إضافة العميل بنجاح", data = result });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClient(int id, [FromBody] UpdateClientDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var result = await _crmService.UpdateClientAsync(id, dto, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "العميل غير موجود" });
        return Ok(new { success = true, message = "تم تحديث بيانات العميل بنجاح", data = result });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClient(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var success = await _crmService.DeleteClientAsync(id, _tenantContext.TenantId.Value);
        if (!success) return NotFound(new { success = false, message = "العميل غير موجود" });
        return NoContent();
    }

    [HttpGet("{id}/notes")]
    public async Task<IActionResult> GetNotes(int id)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var result = await _crmService.GetNotesForClientAsync(id, _tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("{id}/notes")]
    public async Task<IActionResult> AddNote(int id, [FromBody] string content)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة في السياق" });
        }

        var result = await _crmService.AddNoteAsync(id, content, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, message = "تمت إضافة الملاحظة بنجاح", data = result });
    }
}
