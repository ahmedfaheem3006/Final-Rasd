using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Meeting;

namespace RasdAI.BLL.Interfaces;

public interface IMeetingService
{
    Task<List<MeetingScheduleDto>> GetMeetingsAsync(Guid tenantId);
    Task<MeetingScheduleDto> CreateMeetingAsync(CreateMeetingScheduleDto dto, Guid tenantId);
    Task<MeetingScheduleDto?> UpdateMeetingAsync(int id, CreateMeetingScheduleDto dto, Guid tenantId);
    Task<bool> DeleteMeetingAsync(int id, Guid tenantId);
}
