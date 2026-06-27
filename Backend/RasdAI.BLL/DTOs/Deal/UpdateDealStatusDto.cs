using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Deal;

public class UpdateDealStatusDto
{
    [Required(ErrorMessage = "الحالة الجديدة مطلوبة")]
    [StringLength(50, ErrorMessage = "الحالة طويلة جداً")]
    public string Status { get; set; } = string.Empty;
}
