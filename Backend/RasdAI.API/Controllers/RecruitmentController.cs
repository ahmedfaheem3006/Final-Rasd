using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Recruitment;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner,SystemAdmin,HR")]
public class RecruitmentController : ControllerBase
{
    private readonly IRecruitmentService _recruitmentService;
    private readonly TenantContext _tenantContext;

    public RecruitmentController(IRecruitmentService recruitmentService, TenantContext tenantContext)
    {
        _recruitmentService = recruitmentService;
        _tenantContext = tenantContext;
    }

    // ───── Job Vacancies ─────

    [HttpGet("vacancies")]
    public async Task<IActionResult> GetVacancies()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.GetJobVacanciesAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("vacancies/{id}")]
    public async Task<IActionResult> GetVacancyById(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.GetJobVacancyByIdAsync(id, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "الوظيفة غير موجودة" });

        return Ok(new { success = true, data = result });
    }

    [HttpPost("vacancies")]
    public async Task<IActionResult> CreateVacancy([FromBody] CreateJobVacancyDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير متوفرة" });

        var result = await _recruitmentService.CreateJobVacancyAsync(dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, message = "تم إنشاء الوظيفة بنجاح", data = result });
    }

    [HttpPut("vacancies/{id}")]
    public async Task<IActionResult> UpdateVacancy(int id, [FromBody] UpdateJobVacancyDto dto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.UpdateJobVacancyAsync(id, dto, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "الوظيفة غير موجودة" });

        return Ok(new { success = true, data = result });
    }

    [HttpDelete("vacancies/{id}")]
    public async Task<IActionResult> DeleteVacancy(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.DeleteJobVacancyAsync(id, _tenantContext.TenantId.Value);
        if (!result) return NotFound(new { success = false, message = "الوظيفة غير موجودة" });

        return Ok(new { success = true, message = "تم حذف الوظيفة بنجاح" });
    }

    [HttpPost("vacancies/{id}/toggle-status")]
    public async Task<IActionResult> ToggleVacancyStatus(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.ToggleJobStatusAsync(id, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "الوظيفة غير موجودة" });

        return Ok(new { success = true, message = "تم تحديث حالة الوظيفة", data = result });
    }

    // ───── Candidates ─────

    [HttpGet("candidates")]
    public async Task<IActionResult> GetCandidates()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.GetCandidatesAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("candidates/{id}")]
    public async Task<IActionResult> GetCandidateById(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.GetCandidateByIdAsync(id, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "المرشح غير موجود" });

        return Ok(new { success = true, data = result });
    }

    [HttpPost("candidates")]
    public async Task<IActionResult> CreateCandidate([FromBody] CreateCandidateDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير متوفرة" });

        var result = await _recruitmentService.CreateCandidateAsync(dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
        return Ok(new { success = true, message = "تم إضافة المرشح بنجاح", data = result });
    }

    [HttpPut("candidates/{id}/move")]
    public async Task<IActionResult> MoveCandidate(int id, [FromBody] MoveCandidateDto dto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.MoveCandidateAsync(id, dto, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "المرشح غير موجود أو المرحلة غير صالحة" });

        return Ok(new { success = true, message = "تم نقل المرشح بنجاح", data = result });
    }

    [HttpDelete("candidates/{id}")]
    public async Task<IActionResult> DeleteCandidate(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });

        var result = await _recruitmentService.DeleteCandidateAsync(id, _tenantContext.TenantId.Value);
        if (!result) return NotFound(new { success = false, message = "المرشح غير موجود" });

        return Ok(new { success = true, message = "تم استبعاد المرشح بنجاح" });
    }
}
