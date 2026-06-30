using System;
using System.Collections.Generic;

namespace RasdAI.DAL.Entities;

public class Contract : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int? ClientId { get; set; }

    public string? FileName { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string ContractTitle { get; set; } = string.Empty;
    public string ContractType { get; set; } = string.Empty; // Sales, Service, Maintenance, Subscription, Rental, Custom
    public string? Description { get; set; }
    public string? ReferenceNumber { get; set; }

    public string Currency { get; set; } = "SAR";
    public decimal ContractValue { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal Discount { get; set; }
    public decimal FinalAmount { get; set; }

    public string PaymentTerms { get; set; } = "Custom"; // Monthly, Quarterly, Semi Annual, Annual, Custom
    public decimal DepositAmount { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int ReminderDays { get; set; } = 30; // 7, 15, 30, 60

    public string Status { get; set; } = "Draft"; // Draft, Active, Pending Approval, Expired, Cancelled, Archived

    public string? AttachmentsJson { get; set; } // Array of file metadata

    public decimal PaidAmount { get; set; } = 0m;
    public decimal RemainingAmount { get; set; } = 0m;

    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }

    // Existing placeholder field
    public string? AIAnalysisResult { get; set; } 

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public Client? Client { get; set; }
    public User? CreatedByUser { get; set; }
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
