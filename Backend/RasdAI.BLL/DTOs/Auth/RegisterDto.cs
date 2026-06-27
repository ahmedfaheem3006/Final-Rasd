using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Auth;

public class RegisterDto
{
    [Required(ErrorMessage = "الاسم الكامل مطلوب")]
    [StringLength(200, ErrorMessage = "الاسم طويل جداً")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
    [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "كلمة المرور مطلوبة")]
    [MinLength(6, ErrorMessage = "كلمة المرور يجب ألا تقل عن 6 أحرف")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "رقم الدور (RoleId) مطلوب")]
    public int RoleId { get; set; }

    public int? ManagerId { get; set; }
}
