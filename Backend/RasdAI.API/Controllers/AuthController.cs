using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Auth;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly TenantContext _tenantContext;

    public AuthController(IAuthService authService, TenantContext tenantContext)
    {
        _authService = authService;
        _tenantContext = tenantContext;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            var result = await _authService.LoginAsync(loginDto);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Owner,SystemAdmin,HR,EmployeeManager")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق الحالي" });
        }

        try
        {
            var result = await _authService.RegisterUserAsync(registerDto, _tenantContext.TenantId.Value);
            return Ok(new { success = true, message = "تم تسجيل الموظف الجديد بنجاح في شركتك" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        if (_tenantContext.UserId == null)
        {
            return Unauthorized(new { success = false, message = "المستخدم غير مصرح له" });
        }

        var user = await _authService.GetUserByIdAsync(_tenantContext.UserId.Value);
        if (user == null)
        {
            return NotFound(new { success = false, message = "المستخدم غير موجود" });
        }

        return Ok(new 
        { 
            success = true, 
            data = new 
            { 
                user.Id, 
                user.FullName, 
                user.Email, 
                Role = user.Role.Name, 
                user.TenantId 
            } 
        });
    }

    [Authorize(Roles = "Owner,SystemAdmin,HR,EmployeeManager")]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var users = await _authService.GetTenantUsersAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = users });
    }

    [Authorize(Roles = "Owner,SystemAdmin,HR")]
    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleDto updateDto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });
        }

        try
        {
            var success = await _authService.UpdateUserRoleAsync(id, updateDto.RoleId, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            return Ok(new { success = true, message = "تم تحديث دور المستخدم بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Owner,SystemAdmin,HR")]
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
        {
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });
        }

        try
        {
            await _authService.DeleteUserAsync(id, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            return Ok(new { success = true, message = "تم حذف المستخدم بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Owner,SystemAdmin,HR")]
    [HttpGet("users/dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        try
        {
            var result = await _authService.GetUserDashboardStatsAsync(_tenantContext.TenantId.Value);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            await _authService.GeneratePasswordResetOtpAsync(dto.Email);
            return Ok(new { success = true, message = "تم إرسال رمز التحقق إلى بريدك الإلكتروني" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        try
        {
            await _authService.VerifyOtpAsync(dto.Email, dto.Otp);
            return Ok(new { success = true, message = "تم التحقق بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            await _authService.ResetPasswordAsync(dto.Email, dto.Otp, dto.NewPassword);
            return Ok(new { success = true, message = "تم تغيير كلمة المرور بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (_tenantContext.UserId == null)
        {
            return Unauthorized(new { success = false, message = "المستخدم غير مصرح له" });
        }

        try
        {
            await _authService.ChangePasswordAsync(_tenantContext.UserId.Value, dto.CurrentPassword, dto.NewPassword);
            return Ok(new { success = true, message = "تم تغيير كلمة المرور بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}

public class ChangePasswordDto
{
    [Required(ErrorMessage = "كلمة المرور الحالية مطلوبة")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "كلمة المرور الجديدة مطلوبة")]
    [MinLength(6, ErrorMessage = "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف")]
    public string NewPassword { get; set; } = string.Empty;
}
