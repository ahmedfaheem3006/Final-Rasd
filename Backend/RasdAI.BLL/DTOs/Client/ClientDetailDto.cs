using System;

namespace RasdAI.BLL.DTOs.Client;

public class ClientDetailDto
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public string? CompanyName { get; set; }
    public string? CommercialRegistration { get; set; }
    public string? TaxNumber { get; set; }
    public string? Industry { get; set; }
    public string? Website { get; set; }
    public string? CompanySize { get; set; }
    public string? Description { get; set; }
    public string? Logo { get; set; }
    public string? OwnerName { get; set; }
    public string? JobTitle { get; set; }
    public string? Country { get; set; }
    public string? Governorate { get; set; }
    public string? City { get; set; }
    public string? Street { get; set; }
    public string? PostalCode { get; set; }
    public decimal? CreditLimit { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Currency { get; set; }
    public decimal? OpeningBalance { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string Status { get; set; } = "Active";

    public decimal TotalRevenue { get; set; }
    public decimal OutstandingBalance { get; set; }
    public int InvoicesCount { get; set; }
    public int PaymentsReceived { get; set; }
}
