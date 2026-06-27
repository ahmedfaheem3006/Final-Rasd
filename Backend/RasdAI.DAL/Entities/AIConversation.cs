using System;

namespace RasdAI.DAL.Entities;

public class AIConversation : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string MessagesJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public User User { get; set; } = null!;
}
