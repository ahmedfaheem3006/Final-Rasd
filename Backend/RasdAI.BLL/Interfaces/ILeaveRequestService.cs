using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.LeaveRequest;

namespace RasdAI.BLL.Interfaces;

public interface ILeaveRequestService
{
    Task<List<LeaveRequestDto>> GetLeaveRequestsAsync(Guid tenantId, string? role, int? userId);
    Task<LeaveRequestDto?> GetLeaveRequestByIdAsync(int id, Guid tenantId);
    Task<LeaveRequestDto> CreateLeaveRequestAsync(CreateLeaveRequestDto dto, Guid tenantId, int userId);
    Task<LeaveRequestDto?> UpdateLeaveRequestAsync(int id, UpdateLeaveRequestDto dto, Guid tenantId, int userId);
    Task<bool> DeleteLeaveRequestAsync(int id, Guid tenantId);
    Task<LeaveRequestDto?> ApproveLeaveRequestAsync(int id, Guid tenantId, int userId);
    Task<LeaveRequestDto?> RejectLeaveRequestAsync(int id, ApproveRejectDto dto, Guid tenantId, int userId);
}
