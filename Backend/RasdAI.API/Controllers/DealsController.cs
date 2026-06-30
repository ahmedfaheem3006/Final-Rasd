using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Deal;
using System.Collections.Generic;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DealsController : ControllerBase
{
    private readonly ICrmService _crmService;
    private readonly TenantContext _tenantContext;

    public DealsController(ICrmService crmService, TenantContext tenantContext)
    {
        _crmService = crmService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetDeals()
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var result = await _crmService.GetDealsAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> CreateDeal([FromBody] CreateDealDto createDealDto)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var result = await _crmService.CreateDealAsync(createDealDto, _tenantContext.TenantId.Value);
        return Ok(new { success = true, message = "تم إنشاء الصفقة بنجاح", data = result });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateDealStatus(int id, [FromBody] UpdateDealStatusDto updateDto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var success = await _crmService.UpdateDealStatusAsync(id, updateDto.Status, _tenantContext.TenantId.Value);
        if (!success)
            return NotFound(new { success = false, message = "الصفقة غير موجودة" });

        return Ok(new { success = true, message = "تم تحديث حالة الصفقة بنجاح" });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDeal(int id, [FromBody] UpdateDealDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        try
        {
            var result = await _crmService.UpdateDealAsync(id, dto, _tenantContext.TenantId.Value);
            if (result == null) return NotFound(new { success = false, message = "الصفقة غير موجودة" });
            return Ok(new { success = true, message = "تم تحديث الصفقة بنجاح", data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDeal(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var success = await _crmService.DeleteDealAsync(id, _tenantContext.TenantId.Value);
        if (!success) return NotFound(new { success = false, message = "الصفقة غير موجودة" });
        return NoContent();
    }
}
