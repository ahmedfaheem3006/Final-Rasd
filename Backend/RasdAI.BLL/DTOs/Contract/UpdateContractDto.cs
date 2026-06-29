using System;
using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Contract;

public class UpdateContractDto
{
    [Required]
    public int Id { get; set; }

    [Required]
    public string ContractTitle { get; set; } = string.Empty;

    public string ContractType { get; set; } = "Custom"; 
    public string? Description { get; set; }
    public string? ReferenceNumber { get; set; }

    public string Currency { get; set; } = "SAR";
    
    [Required]
    public decimal ContractValue { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal Discount { get; set; }
    public decimal FinalAmount { get; set; }

    public string PaymentTerms { get; set; } = "Custom"; 
    public decimal DepositAmount { get; set; }

    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
    
    public int ReminderDays { get; set; } = 30;
    
    public string Status { get; set; } = "Draft"; 

    public string? AttachmentsJson { get; set; } 
}
