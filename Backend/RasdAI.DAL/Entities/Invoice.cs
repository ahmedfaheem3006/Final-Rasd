using System;

namespace RasdAI.DAL.Entities;

public class Invoice : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int DealId { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty; // Paid, Unpaid, Overdue
    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public Deal Deal { get; set; } = null!;
}
