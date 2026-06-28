using System;

namespace RasdAI.DAL.Entities;

public class Contract : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int? ClientId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string AIAnalysisResult { get; set; } = string.Empty; // JSON output (Dangers, Warnings, etc.)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public Client? Client { get; set; }
}
