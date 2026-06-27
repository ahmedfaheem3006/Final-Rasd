using System;

namespace RasdAI.DAL.Entities;

public class Report : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string Category { get; set; } = string.Empty; // sales | financial | hr
    public string Title { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;   // e.g. "من يوليو إلى أكتوبر 2026"
    public string SizeLabel { get; set; } = string.Empty; // e.g. "1.4 MB"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
