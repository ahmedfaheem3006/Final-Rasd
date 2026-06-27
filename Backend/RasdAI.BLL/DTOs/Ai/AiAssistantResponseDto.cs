using System;

namespace RasdAI.BLL.DTOs.Ai;

public class AiAssistantResponseDto
{
    public string Response { get; set; } = string.Empty;
    public string ConversationId { get; set; } = string.Empty;
    public bool IsDemo { get; set; }
}
