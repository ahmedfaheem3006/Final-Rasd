using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Ai;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;
    private readonly TenantContext _tenantContext;

    public AiController(IAiService aiService, TenantContext tenantContext)
    {
        _aiService = aiService;
        _tenantContext = tenantContext;
    }

    [HttpPost("analyze-contract")]
    public async Task<IActionResult> AnalyzeContract(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "يرجى اختيار ملف عقد صالح بصيغة PDF أو Word" });
        }

        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();

        var result = await _aiService.AnalyzeContractAsync(file.FileName, fileBytes, _tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("transcribe-meeting")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> TranscribeMeeting([FromForm] IFormFile? file, [FromForm] string? driveLink, [FromForm] string? language)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        if ((file == null || file.Length == 0) && string.IsNullOrWhiteSpace(driveLink))
        {
            return BadRequest(new { success = false, message = "يرجى اختيار ملف تسجيل صوتي أو فيديو صالح أو إدخال رابط Google Drive" });
        }

        byte[] fileBytes = Array.Empty<byte>();
        string fileName = "GoogleDriveLink.mp4";

        if (file != null && file.Length > 0)
        {
            fileName = file.FileName;
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            fileBytes = memoryStream.ToArray();
        }
        else if (!string.IsNullOrWhiteSpace(driveLink))
        {
            fileName = $"GoogleDrive_{driveLink.Replace(":", "_").Replace("/", "_")}.mp4";
            fileBytes = System.Text.Encoding.UTF8.GetBytes(driveLink);
        }

        var lang = language ?? "ar";
        var result = await _aiService.TranscribeMeetingAsync(fileName, fileBytes, _tenantContext.TenantId.Value, lang);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("chat")]
    public async Task<IActionResult> ChatWithAssistant([FromBody] AiAssistantRequestDto requestDto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة في السياق" });
        }

        try
        {
            var result = await _aiService.ChatWithAssistantAsync(requestDto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("analyze-interview")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> AnalyzeInterview(
        [FromForm] IFormFile? file,
        [FromForm] string? candidateName,
        [FromForm] string? jobRole,
        [FromForm] string? language)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "يرجى رفع ملف مقابلة صالح (فيديو أو صوت)" });

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var fileBytes = ms.ToArray();

        try
        {
            var result = await _aiService.AnalyzeInterviewAsync(
                file.FileName, fileBytes,
                _tenantContext.TenantId.Value,
                candidateName ?? "المرشح",
                jobRole ?? "الوظيفة",
                language ?? "ar");
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("chat-interview")]
    public async Task<IActionResult> ChatAboutInterview([FromBody] InterviewChatRequestDto requestDto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });

        if (string.IsNullOrWhiteSpace(requestDto.Question))
            return BadRequest(new { success = false, message = "يرجى إدخال سؤال" });

        try
        {
            var lang = requestDto.Language ?? "ar";
            var result = await _aiService.ChatAboutInterviewAsync(
                requestDto.Question,
                requestDto.InterviewTranscript ?? "",
                requestDto.CandidateName ?? "المرشح",
                requestDto.JobRole ?? "الوظيفة",
                _tenantContext.TenantId.Value, lang);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("chat-meeting")]
    public async Task<IActionResult> ChatAboutMeeting([FromBody] MeetingChatRequestDto requestDto)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        if (string.IsNullOrWhiteSpace(requestDto.Question))
        {
            return BadRequest(new { success = false, message = "يرجى إدخال سؤال" });
        }

        try
        {
            var lang = requestDto.Language ?? "ar";
            var result = await _aiService.ChatAboutMeetingAsync(requestDto.Question, requestDto.MeetingTranscript ?? "", _tenantContext.TenantId.Value, lang);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    #region AI History Log Endpoints

    // ─── CHAT HISTORY ────────────────────────────────────────────────────────

    [HttpGet("chat/history")]
    public async Task<IActionResult> GetChatHistory()
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة" });
        }
        var history = await _aiService.GetChatHistoryAsync(_tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, data = history });
    }

    [HttpGet("chat/history/{id}")]
    public async Task<IActionResult> GetChatHistoryDetails(int id)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة" });
        }
        var details = await _aiService.GetChatHistoryDetailsAsync(id, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        if (details == null)
        {
            return NotFound(new { success = false, message = "المحادثة غير موجودة" });
        }
        return Ok(new { success = true, data = details });
    }

    [HttpDelete("chat/history/{id}")]
    public async Task<IActionResult> DeleteChatHistory(int id)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة" });
        }
        await _aiService.DeleteChatHistoryAsync(id, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, message = "تم حذف المحادثة بنجاح" });
    }

    // ─── CONTRACT HISTORY ────────────────────────────────────────────────────

    [HttpGet("contract/history")]
    public async Task<IActionResult> GetContractHistory()
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        }
        var history = await _aiService.GetContractHistoryAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = history });
    }

    [HttpGet("contract/history/{id}")]
    public async Task<IActionResult> GetContractHistoryDetails(int id)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        }
        var details = await _aiService.GetContractHistoryDetailsAsync(id, _tenantContext.TenantId.Value);
        if (details == null)
        {
            return NotFound(new { success = false, message = "تحليل العقد غير موجود" });
        }
        return Ok(new { success = true, data = details });
    }

    [HttpDelete("contract/history/{id}")]
    public async Task<IActionResult> DeleteContractHistory(int id)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        }
        await _aiService.DeleteContractHistoryAsync(id, _tenantContext.TenantId.Value);
        return Ok(new { success = true, message = "تم حذف تحليل العقد بنجاح" });
    }

    // ─── MEETING HISTORY ─────────────────────────────────────────────────────

    [HttpGet("meeting/history")]
    public async Task<IActionResult> GetMeetingHistory()
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        }
        var history = await _aiService.GetMeetingHistoryAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = history });
    }

    [HttpGet("meeting/history/{id}")]
    public async Task<IActionResult> GetMeetingHistoryDetails(int id)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        }
        var details = await _aiService.GetMeetingHistoryDetailsAsync(id, _tenantContext.TenantId.Value);
        if (details == null)
        {
            return NotFound(new { success = false, message = "تفريغ الاجتماع غير موجود" });
        }
        return Ok(new { success = true, data = details });
    }

    [HttpDelete("meeting/history/{id}")]
    public async Task<IActionResult> DeleteMeetingHistory(int id)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        }
        await _aiService.DeleteMeetingHistoryAsync(id, _tenantContext.TenantId.Value);
        return Ok(new { success = true, message = "تم حذف تفريغ الاجتماع بنجاح" });
    }

    #endregion
}

public class InterviewChatRequestDto
{
    public string Question { get; set; } = string.Empty;
    public string? InterviewTranscript { get; set; }
    public string? CandidateName { get; set; }
    public string? JobRole { get; set; }
    public string? Language { get; set; }
}

public class MeetingChatRequestDto
{
    public string Question { get; set; } = string.Empty;
    public string? MeetingTranscript { get; set; }
    public string? Language { get; set; }
}
