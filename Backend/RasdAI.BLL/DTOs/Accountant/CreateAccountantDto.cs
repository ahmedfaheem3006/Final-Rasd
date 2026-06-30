using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Accountant;

public class CreateAccountantDto
{
    [Required(ErrorMessage = "الاسم الأول مطلوب")]
    [StringLength(100, ErrorMessage = "الاسم الأول طويل جداً")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "الاسم الأخير مطلوب")]
    [StringLength(100, ErrorMessage = "الاسم الأخير طويل جداً")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
    [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "رقم الهاتف مطلوب")]
    [StringLength(50, ErrorMessage = "رقم الهاتف طويل جداً")]
    [Phone(ErrorMessage = "رقم الهاتف غير صحيح")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "كلمة المرور مطلوبة")]
    [MinLength(8, ErrorMessage = "كلمة المرور يجب ألا تقل عن 8 أحرف")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "تأكيد كلمة المرور مطلوب")]
    [Compare("Password", ErrorMessage = "كلمة المرور وتأكيدها غير متطابقتين")]
    public string ConfirmPassword { get; set; } = string.Empty;

    public string Status { get; set; } = "Active";
}
