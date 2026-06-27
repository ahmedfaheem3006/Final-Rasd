using System;

namespace RasdAI.BLL.DTOs.Task;

public class TaskDto
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int? AssignedUserId { get; set; }
    public string AssignedUserName { get; set; } = string.Empty;
    public int? MeetingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
