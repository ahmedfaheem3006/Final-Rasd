using System;

namespace RasdAI.DAL.Entities;

public class TaskItem : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int? AssignedUserId { get; set; }
    public int? MeetingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Todo, InProgress, Done
    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public User? AssignedUser { get; set; }
    public Meeting? Meeting { get; set; }
}
