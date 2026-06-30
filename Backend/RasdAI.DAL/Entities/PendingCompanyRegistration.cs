using System;
using System.ComponentModel.DataAnnotations;

namespace RasdAI.DAL.Entities;

public class PendingCompanyRegistration
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string SubscriptionPlan { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int AiLimit { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [Required]
    [MaxLength(100)]
    public string OwnerFirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string OwnerLastName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OwnerEmail { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? OwnerPhone { get; set; }

    [Required]
    public string OwnerPasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ProcessedAt { get; set; }

    [MaxLength(500)]
    public string? RejectionReason { get; set; }
}
