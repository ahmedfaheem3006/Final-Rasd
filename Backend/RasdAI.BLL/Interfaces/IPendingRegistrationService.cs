using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Tenant;

namespace RasdAI.BLL.Interfaces;

public interface IPendingRegistrationService
{
    Task<PendingRegistrationDto> CreateAsync(CreatePendingRegistrationDto dto);
    Task<List<PendingRegistrationDto>> GetAllAsync();
    Task<PendingRegistrationDto> ApproveAsync(Guid id);
    Task<PendingRegistrationDto> RejectAsync(Guid id, string? reason = null);
}
