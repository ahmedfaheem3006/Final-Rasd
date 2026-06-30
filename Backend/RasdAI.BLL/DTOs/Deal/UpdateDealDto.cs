using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Deal;

public class UpdateDealDto
{
    [Required]
    public int ClientId { get; set; }

    public int? AssignedUserId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Proposal";
}
