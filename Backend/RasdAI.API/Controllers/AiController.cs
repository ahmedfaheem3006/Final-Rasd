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
    public async Task<IActionResult> TranscribeMeeting(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "يرجى اختيار ملف تسجيل صوتي أو فيديو صالح" });
        }

        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();

        var result = await _aiService.TranscribeMeetingAsync(file.FileName, fileBytes, _tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("chat")]
    public async Task<IActionResult> ChatWithAssistant([FromBody] AiAssistantRequestDto requestDto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات المستخدم أو الشركة غير متوفرة في السياق" });
        }

        var result = await _aiService.ChatWithAssistantAsync(requestDto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, data = result });
    }
}
