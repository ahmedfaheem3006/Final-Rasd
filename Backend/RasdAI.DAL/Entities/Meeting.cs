using System;
using System.Collections.Generic;

namespace RasdAI.DAL.Entities;

public class Meeting : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string VideoFilePath { get; set; } = string.Empty;
    public string Transcript { get; set; } = string.Empty;
    public string AISummary { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
