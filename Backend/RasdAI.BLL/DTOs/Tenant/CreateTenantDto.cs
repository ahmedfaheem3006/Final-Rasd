using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Tenant;

public class CreateTenantDto
{
    [Required(ErrorMessage = "اسم الشركة مطلوب")]
    [StringLength(200, ErrorMessage = "اسم الشركة طويل جداً")]
    public string CompanyName { get; set; } = string.Empty;

    [Required(ErrorMessage = "اسم المالك الكامل مطلوب")]
    [StringLength(200, ErrorMessage = "اسم المالك طويل جداً")]
    public string OwnerFullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "البريد الإلكتروني للمالك مطلوب")]
    [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
    public string OwnerEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "كلمة المرور للمالك مطلوبة")]
    [MinLength(6, ErrorMessage = "كلمة المرور يجب ألا تقل عن 6 أحرف")]
    public string OwnerPassword { get; set; } = string.Empty;

    public decimal Price { get; set; }
    public int AiLimit { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
}
