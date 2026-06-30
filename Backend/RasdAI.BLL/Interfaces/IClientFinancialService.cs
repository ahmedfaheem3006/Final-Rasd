using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Client;

namespace RasdAI.BLL.Interfaces;

public interface IClientFinancialService
{
    Task<List<ClientOverviewDto>> GetClientsAsync(Guid tenantId);
    Task<ClientDetailDto> GetClientByIdAsync(int id, Guid tenantId);
    Task<ClientDetailDto> CreateClientAsync(CreateClientDetailDto dto, Guid tenantId, int userId);
    Task<ClientDetailDto> UpdateClientAsync(int id, CreateClientDetailDto dto, Guid tenantId);
    Task<bool> DeleteClientAsync(int id, Guid tenantId);
}
