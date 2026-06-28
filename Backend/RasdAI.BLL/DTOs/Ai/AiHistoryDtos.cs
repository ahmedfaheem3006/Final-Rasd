using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Ai;

public class AiConversationHistoryItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AiConversationDetailsDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<ChatMessageDto> Messages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class ChatMessageDto
{
    public string Role { get; set; } = string.Empty; // "user" | "assistant"
    public string Text { get; set; } = string.Empty;
    public string? Time { get; set; }
}

public class ContractHistoryItemDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class MeetingHistoryItemDto
{
    public int Id { get; set; }
    public string VideoFilePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
