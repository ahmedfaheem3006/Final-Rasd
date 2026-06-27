using System;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Dashboard;

namespace RasdAI.BLL.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync(Guid tenantId);
}
