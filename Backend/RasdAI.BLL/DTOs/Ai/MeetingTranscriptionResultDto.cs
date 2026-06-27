using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Ai;

public class MeetingTranscriptionResultDto
{
    public string Transcript { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<ProposedTaskDto> ProposedTasks { get; set; } = new();
    public bool IsDemo { get; set; }
}

public class ProposedTaskDto
{
    public string Title { get; set; } = string.Empty;
    public int? AssignedUserId { get; set; }
    public string AssignedUserName { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
}
