using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Client;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientsFinancialController : ControllerBase
{
    private readonly IClientFinancialService _clientService;
    private readonly TenantContext _tenantContext;

    public ClientsFinancialController(IClientFinancialService clientService, TenantContext tenantContext)
    {
        _clientService = clientService;
        _tenantContext = tenantContext;
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet]
    public async Task<IActionResult> GetClients()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var result = await _clientService.GetClientsAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetClient(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        try
        {
            var result = await _clientService.GetClientByIdAsync(id, _tenantContext.TenantId.Value);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpPost]
    public async Task<IActionResult> CreateClient([FromBody] CreateClientDetailDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });

        try
        {
            var result = await _clientService.CreateClientAsync(dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            return Ok(new { success = true, message = "تم إضافة العميل بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClient(int id, [FromBody] CreateClientDetailDto dto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        try
        {
            var result = await _clientService.UpdateClientAsync(id, dto, _tenantContext.TenantId.Value);
            return Ok(new { success = true, message = "تم تحديث بيانات العميل بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClient(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        try
        {
            await _clientService.DeleteClientAsync(id, _tenantContext.TenantId.Value);
            return Ok(new { success = true, message = "تم حذف العميل بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
