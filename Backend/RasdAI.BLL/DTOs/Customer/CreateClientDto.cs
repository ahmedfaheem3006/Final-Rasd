using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Customer;

public class CreateClientDto
{
    [Required(ErrorMessage = "اسم العميل مطلوب")]
    [StringLength(200, ErrorMessage = "اسم العميل طويل جداً")]
    public string Name { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني للعميل غير صحيحة")]
    [StringLength(255, ErrorMessage = "البريد الإلكتروني للعميل طويل جداً")]
    public string? Email { get; set; }

    [StringLength(50, ErrorMessage = "رقم الهاتف طويل جداً")]
    public string? Phone { get; set; }
}
