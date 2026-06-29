using System;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Ai;

namespace RasdAI.BLL.Interfaces;

public interface IAiService
{
    Task<ContractAnalysisResultDto> AnalyzeContractAsync(string fileName, byte[] fileBytes, Guid tenantId);
    Task<MeetingTranscriptionResultDto> TranscribeMeetingAsync(string fileName, byte[] fileBytes, Guid tenantId, string language = "ar");
    Task<AiAssistantResponseDto> ChatWithAssistantAsync(AiAssistantRequestDto requestDto, Guid tenantId, int userId);
    Task<AiAssistantResponseDto> ChatAboutMeetingAsync(string question, string meetingTranscript, Guid tenantId, string language = "ar");

    // Smart Assistant History
    Task<List<AiConversationHistoryItemDto>> GetChatHistoryAsync(Guid tenantId, int userId);
    Task<AiConversationDetailsDto> GetChatHistoryDetailsAsync(int id, Guid tenantId, int userId);
    Task DeleteChatHistoryAsync(int id, Guid tenantId, int userId);

    // Contract History
    Task<List<ContractHistoryItemDto>> GetContractHistoryAsync(Guid tenantId);
    Task<ContractAnalysisResultDto> GetContractHistoryDetailsAsync(int id, Guid tenantId);
    Task DeleteContractHistoryAsync(int id, Guid tenantId);

    // Meeting History
    Task<List<MeetingHistoryItemDto>> GetMeetingHistoryAsync(Guid tenantId);
    Task<MeetingTranscriptionResultDto> GetMeetingHistoryDetailsAsync(int id, Guid tenantId);
    Task DeleteMeetingHistoryAsync(int id, Guid tenantId);

    // Support AI Scan
    Task<List<object>> RunSupportScanAsync(Guid? tenantId = null);
}
