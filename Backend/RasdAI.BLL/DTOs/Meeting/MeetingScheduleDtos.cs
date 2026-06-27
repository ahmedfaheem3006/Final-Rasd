using System;

namespace RasdAI.BLL.DTOs.Meeting;

public class MeetingScheduleDto
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime MeetingDate { get; set; }
    public string MeetingTime { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string MeetingType { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Attendees { get; set; } = string.Empty;
    public string VirtualLink { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateMeetingScheduleDto
{
    public string Title { get; set; } = string.Empty;
    public DateTime MeetingDate { get; set; }
    public string MeetingTime { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string MeetingType { get; set; } = "internal";
    public string Location { get; set; } = string.Empty;
    public string Attendees { get; set; } = string.Empty;
    public string VirtualLink { get; set; } = string.Empty;
}
