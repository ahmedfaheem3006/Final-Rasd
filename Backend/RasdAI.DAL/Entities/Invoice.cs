using System;

namespace RasdAI.DAL.Entities;

public class Invoice : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int? DealId { get; set; }
    public int? ContractId { get; set; }
    public int ClientId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingBalance { get; set; }
    public string Status { get; set; } = string.Empty; // Paid, Unpaid, Overdue
    public string Currency { get; set; } = "SAR";
    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Extended fields
    public int CreatedByUserId { get; set; }
    public decimal Discount { get; set; } = 0m;
    public decimal Subtotal { get; set; }
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public Deal? Deal { get; set; }
    public Contract? Contract { get; set; }
    public Client Client { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
