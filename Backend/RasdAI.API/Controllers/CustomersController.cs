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
