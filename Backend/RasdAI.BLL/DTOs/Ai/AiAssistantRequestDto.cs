using System;
using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Ai;

public class AiAssistantRequestDto
{
    [Required(ErrorMessage = "رسالة المستخدم مطلوبة")]
    public string Message { get; set; } = string.Empty;

    public string? ConversationId { get; set; }

    public string? ContractContext { get; set; }
}
