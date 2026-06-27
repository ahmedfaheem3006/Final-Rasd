using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.LeaveRequest;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeaveRequestsController : ControllerBase
{
    private readonly ILeaveRequestService _leaveRequestService;
    private readonly TenantContext _tenantContext;

    public LeaveRequestsController(ILeaveRequestService leaveRequestService, TenantContext tenantContext)
    {
        _leaveRequestService = leaveRequestService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeaveRequests()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var result = await _leaveRequestService.GetLeaveRequestsAsync(
            _tenantContext.TenantId.Value, _tenantContext.Role, _tenantContext.UserId);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetLeaveRequestById(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var result = await _leaveRequestService.GetLeaveRequestByIdAsync(id, _tenantContext.TenantId.Value);
        if (result == null)
            return NotFound(new { success = false, message = "طلب الإجازة غير موجود" });

        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> CreateLeaveRequest([FromBody] CreateLeaveRequestDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة في السياق" });

        try
        {
            var result = await _leaveRequestService.CreateLeaveRequestAsync(
                dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            return Ok(new { success = true, message = "تم تقديم طلب الإجازة بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLeaveRequest(int id, [FromBody] UpdateLeaveRequestDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة في السياق" });

        try
        {
            var result = await _leaveRequestService.UpdateLeaveRequestAsync(
                id, dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            if (result == null)
                return NotFound(new { success = false, message = "طلب الإجازة غير موجود" });

            return Ok(new { success = true, message = "تم تحديث طلب الإجازة بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLeaveRequest(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        var result = await _leaveRequestService.DeleteLeaveRequestAsync(id, _tenantContext.TenantId.Value);
        if (!result)
            return NotFound(new { success = false, message = "طلب الإجازة غير موجود" });

        return Ok(new { success = true, message = "تم حذف طلب الإجازة بنجاح" });
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveLeaveRequest(int id)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة في السياق" });

        try
        {
            var result = await _leaveRequestService.ApproveLeaveRequestAsync(
                id, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            if (result == null)
                return NotFound(new { success = false, message = "طلب الإجازة غير موجود" });

            return Ok(new { success = true, message = "تم اعتماد طلب الإجازة بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectLeaveRequest(int id, [FromBody] ApproveRejectDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة في السياق" });

        try
        {
            var result = await _leaveRequestService.RejectLeaveRequestAsync(
                id, dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            if (result == null)
                return NotFound(new { success = false, message = "طلب الإجازة غير موجود" });

            return Ok(new { success = true, message = "تم رفض طلب الإجازة", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
