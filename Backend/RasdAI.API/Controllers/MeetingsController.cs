using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Meeting;
using RasdAI.BLL.Interfaces;
using RasdAI.API.Hubs;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly IMeetingService _meetingService;
    private readonly TenantContext _tenantContext;
    private readonly IHubContext<NotificationHub> _hubContext;

    public MeetingsController(IMeetingService meetingService, TenantContext tenantContext, IHubContext<NotificationHub> hubContext)
    {
        _meetingService = meetingService;
        _tenantContext = tenantContext;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetMeetings()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _meetingService.GetMeetingsAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> CreateMeeting([FromBody] CreateMeetingScheduleDto dto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new { success = false, message = "عنوان الاجتماع مطلوب" });

        var result = await _meetingService.CreateMeetingAsync(dto, _tenantContext.TenantId.Value);

        // Broadcast real-time notification to all connected clients in this tenant
        await _hubContext.Clients.Group(_tenantContext.TenantId.Value.ToString())
            .SendAsync("MeetingCreated", result);

        return Ok(new { success = true, message = "تم جدولة الاجتماع بنجاح", data = result });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMeeting(int id, [FromBody] CreateMeetingScheduleDto dto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new { success = false, message = "عنوان الاجتماع مطلوب" });

        var result = await _meetingService.UpdateMeetingAsync(id, dto, _tenantContext.TenantId.Value);
        if (result == null)
            return NotFound(new { success = false, message = "الاجتماع غير موجود" });

        // Broadcast real-time notification to all connected clients in this tenant
        await _hubContext.Clients.Group(_tenantContext.TenantId.Value.ToString())
            .SendAsync("MeetingUpdated", result);

        return Ok(new { success = true, message = "تم تحديث الاجتماع بنجاح", data = result });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMeeting(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var success = await _meetingService.DeleteMeetingAsync(id, _tenantContext.TenantId.Value);
        if (!success)
            return NotFound(new { success = false, message = "الاجتماع غير موجود" });

        // Broadcast real-time notification to all connected clients in this tenant
        await _hubContext.Clients.Group(_tenantContext.TenantId.Value.ToString())
            .SendAsync("MeetingDeleted", new { id });

        return Ok(new { success = true, message = "تم حذف الاجتماع بنجاح" });
    }
}
