using System;

namespace RasdAI.DAL.Entities;

public class Expense : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string Category { get; set; } = "Other";
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? VendorName { get; set; }
    public string Status { get; set; } = "Paid";
    public string Currency { get; set; } = "SAR";
    public int? CreatedByUserId { get; set; }
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public User? CreatedByUser { get; set; }
}
