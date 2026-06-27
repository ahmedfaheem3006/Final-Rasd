using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Customer;
using RasdAI.BLL.DTOs.Deal;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Interfaces;

public interface ICrmService
{
    // Clients
    Task<List<ClientDto>> GetClientsAsync(Guid tenantId);
    Task<ClientDto> CreateClientAsync(CreateClientDto createClientDto, Guid tenantId, int userId);
    
    // Deals
    Task<List<DealDto>> GetDealsAsync(Guid tenantId);
    Task<DealDto> CreateDealAsync(CreateDealDto createDealDto, Guid tenantId);
    Task<bool> UpdateDealStatusAsync(int dealId, string status, Guid tenantId);
    
    // Notes
    Task<List<Note>> GetNotesForClientAsync(int clientId, Guid tenantId);
    Task<Note> AddNoteAsync(int clientId, string content, Guid tenantId, int userId);
}
