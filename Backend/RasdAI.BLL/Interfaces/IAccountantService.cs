using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Accountant;

namespace RasdAI.BLL.Interfaces;

public interface IAccountantService
{
    Task<List<AccountantDto>> GetAccountantsAsync(Guid tenantId);
    Task<AccountantDto> CreateAccountantAsync(CreateAccountantDto dto, Guid tenantId, int createdByUserId);
    Task<AccountantDto> UpdateAccountantStatusAsync(int userId, string status, Guid tenantId);
    Task<bool> DeleteAccountantAsync(int userId, Guid tenantId);
    Task<AccountantDashboardStatsDto> GetAccountantDashboardStatsAsync(Guid tenantId, int? accountantUserId = null);
    Task<AccountantFullDashboardDto> GetFullDashboardAsync(Guid tenantId);
}
