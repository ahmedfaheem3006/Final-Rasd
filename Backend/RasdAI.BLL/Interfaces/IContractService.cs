using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Contract;

namespace RasdAI.BLL.Interfaces;

public interface IContractService
{
    Task<IEnumerable<ContractDto>> GetAllContractsAsync(Guid tenantId);
    Task<ContractDto?> GetContractByIdAsync(int id, Guid tenantId);
    Task<ContractDto> CreateContractAsync(CreateContractDto dto, Guid tenantId, int userId);
    Task<ContractDto> UpdateContractAsync(int id, UpdateContractDto dto, Guid tenantId, int userId);
    Task<bool> DeleteContractAsync(int id, Guid tenantId);
    Task<bool> ArchiveContractAsync(int id, Guid tenantId);
    Task<object> GetContractStatsAsync(Guid tenantId);
}
