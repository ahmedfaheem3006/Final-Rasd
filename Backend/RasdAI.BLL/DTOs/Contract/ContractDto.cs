using System;

namespace RasdAI.BLL.DTOs.Contract;

public class ContractDto
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int? ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;

    public string ContractNumber { get; set; } = string.Empty;
    public string ContractTitle { get; set; } = string.Empty;
    public string ContractType { get; set; } = string.Empty; 
    public string? Description { get; set; }
    public string? ReferenceNumber { get; set; }

    public string Currency { get; set; } = "SAR";
    public decimal ContractValue { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal Discount { get; set; }
    public decimal FinalAmount { get; set; }

    public string PaymentTerms { get; set; } = "Custom"; 
    public decimal DepositAmount { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int ReminderDays { get; set; } = 30;

    public string Status { get; set; } = "Draft"; 

    public string? AttachmentsJson { get; set; } 

    public decimal PaidAmount { get; set; } = 0m;
    public decimal RemainingAmount { get; set; } = 0m;
    
    // Derived values
    public int DaysRemaining => (EndDate - DateTime.UtcNow).Days;
    public int InvoicesCount { get; set; }
    public int PaymentsCount { get; set; }

    public int? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
