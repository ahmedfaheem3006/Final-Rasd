using System;
using System.Collections.Generic;

namespace RasdAI.DAL.Entities;

public class Client : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int CreatedByUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public ICollection<Deal> Deals { get; set; } = new List<Deal>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
