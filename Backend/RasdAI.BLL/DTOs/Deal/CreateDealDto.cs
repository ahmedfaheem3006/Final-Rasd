using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Deal;

public class CreateDealDto
{
    [Required(ErrorMessage = "العميل مطلوب")]
    public int ClientId { get; set; }

    public int? AssignedUserId { get; set; }

    [Required(ErrorMessage = "قيمة الصفقة مطلوبة")]
    [Range(0.01, double.MaxValue, ErrorMessage = "قيمة الصفقة يجب أن تكون أكبر من صفر")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "حالة الصفقة مطلوبة")]
    [StringLength(50, ErrorMessage = "حالة الصفقة طويلة جداً")]
    public string Status { get; set; } = "Proposal"; // e.g. "Proposal", "Negotiation", "Won", "Lost"
}
