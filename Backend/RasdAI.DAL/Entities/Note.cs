using System;

namespace RasdAI.DAL.Entities;

public class Note : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int ClientId { get; set; }
    public int CreatedByUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public Client Client { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}
