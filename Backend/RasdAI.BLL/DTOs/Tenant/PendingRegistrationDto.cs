using System;

namespace RasdAI.BLL.DTOs.Tenant;

public class PendingRegistrationDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string SubscriptionPlan { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int AiLimit { get; set; }
    public string? Address { get; set; }
    public string OwnerFirstName { get; set; } = string.Empty;
    public string OwnerLastName { get; set; } = string.Empty;
    public string OwnerFullName => $"{OwnerFirstName} {OwnerLastName}";
    public string OwnerEmail { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? RejectionReason { get; set; }
}
