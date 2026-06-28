using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Ai;

public class MeetingTranscriptionResultDto
{
    public int Id { get; set; }
    public string Transcript { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<TranscriptChunkDto> TranscriptChunks { get; set; } = new();
    public List<ProposedTaskDto> ProposedTasks { get; set; } = new();
    public List<ProposedMeetingDto> ProposedMeetings { get; set; } = new();
    public bool IsDemo { get; set; }
}

public class TranscriptChunkDto
{
    public int Index { get; set; }
    public string StartTime { get; set; } = "00:00";
    public string EndTime { get; set; } = "00:00";
    public string Text { get; set; } = string.Empty;
}

public class ProposedTaskDto
{
    public string Title { get; set; } = string.Empty;
    public int? AssignedUserId { get; set; }
    public string AssignedUserName { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
}

public class ProposedMeetingDto
{
    public string Title { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string Attendees { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}
