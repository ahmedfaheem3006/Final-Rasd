using System;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Ai;

namespace RasdAI.BLL.Interfaces;

public interface IAiService
{
    Task<ContractAnalysisResultDto> AnalyzeContractAsync(string fileName, byte[] fileBytes, Guid tenantId);
    Task<MeetingTranscriptionResultDto> TranscribeMeetingAsync(string fileName, byte[] fileBytes, Guid tenantId);
    Task<AiAssistantResponseDto> ChatWithAssistantAsync(AiAssistantRequestDto requestDto, Guid tenantId, int userId);
}
