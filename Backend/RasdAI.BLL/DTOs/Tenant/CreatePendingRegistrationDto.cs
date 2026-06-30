using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Tenant;

public class CreatePendingRegistrationDto
{
    [Required(ErrorMessage = "اسم الشركة مطلوب")]
    [StringLength(200, ErrorMessage = "اسم الشركة طويل جداً")]
    public string CompanyName { get; set; } = string.Empty;

    [Required(ErrorMessage = "الباقة مطلوبة")]
    public string SubscriptionPlan { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int AiLimit { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [Required(ErrorMessage = "الاسم الأول مطلوب")]
    [StringLength(100, ErrorMessage = "الاسم الأول طويل جداً")]
    public string OwnerFirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "الاسم الأخير مطلوب")]
    [StringLength(100, ErrorMessage = "الاسم الأخير طويل جداً")]
    public string OwnerLastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
    [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
    public string OwnerEmail { get; set; } = string.Empty;

    [StringLength(50)]
    public string? OwnerPhone { get; set; }

    [Required(ErrorMessage = "كلمة المرور مطلوبة")]
    [MinLength(6, ErrorMessage = "كلمة المرور يجب ألا تقل عن 6 أحرف")]
    public string OwnerPassword { get; set; } = string.Empty;
}
