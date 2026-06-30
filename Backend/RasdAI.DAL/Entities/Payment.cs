using System;

namespace RasdAI.DAL.Entities;

public class Payment : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int InvoiceId { get; set; }
    public int ClientId { get; set; }
    public int? CreatedByUserId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string Status { get; set; } = "Completed";
    public string? ReferenceNumber { get; set; }
    public string? TransactionNumber { get; set; }
    public string? BankName { get; set; }
    public string? Notes { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public Invoice Invoice { get; set; } = null!;
    public Client Client { get; set; } = null!;
    public User? CreatedByUser { get; set; }
}
