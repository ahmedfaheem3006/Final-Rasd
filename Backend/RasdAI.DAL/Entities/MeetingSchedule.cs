using System;

namespace RasdAI.DAL.Entities;

public class MeetingSchedule : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime MeetingDate { get; set; }
    public string MeetingTime { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string MeetingType { get; set; } = "internal"; // internal | client | strategic
    public string Location { get; set; } = string.Empty;
    public string Attendees { get; set; } = string.Empty; // comma-separated initials
    public string VirtualLink { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
