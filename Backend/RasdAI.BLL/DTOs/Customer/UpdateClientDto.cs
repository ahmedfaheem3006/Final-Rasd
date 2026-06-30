using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Customer;

public class UpdateClientDto
{
    [Required(ErrorMessage = "اسم العميل مطلوب")]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; set; }

    [StringLength(50)]
    public string? Phone { get; set; }

    [StringLength(200)]
    public string? CompanyName { get; set; }

    public string Status { get; set; } = "Active";
}
