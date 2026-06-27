using System;
using System.Collections.Generic;

namespace RasdAI.DAL.Entities;

public class Deal : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int ClientId { get; set; }
    public int? AssignedUserId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty; // e.g. New, Contacted, Proposal, Won, Lost
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public Client Client { get; set; } = null!;
    public User? AssignedUser { get; set; }
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
