using System;
using System.Collections.Generic;

namespace RasdAI.DAL.Entities;

public class Client : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int CreatedByUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
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
    public string Currency { get; set; } = "SAR";
    public decimal? OpeningBalance { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public ICollection<Deal> Deals { get; set; } = new List<Deal>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    public ICollection<Note> Notes { get; set; } = new List<Note>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
