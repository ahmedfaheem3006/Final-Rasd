using System;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Tenant;

using System.Collections.Generic;

namespace RasdAI.BLL.Interfaces;

public interface ITenantService
{
    Task<TenantDto> RegisterTenantAsync(CreateTenantDto createTenantDto);
    Task<TenantDto?> GetTenantByIdAsync(Guid id);
    Task<bool> CheckTenantExistsByNameAsync(string name);
    Task<List<TenantDto>> GetAllTenantsAsync();
    Task<TenantDto> CreateTenantByAdminAsync(CreateTenantAdminDto createTenantAdminDto);
    Task<bool> UpdateTenantStatusAsync(Guid tenantId, bool isActive);
    Task<bool> UpdateTenantPricingAsync(Guid tenantId, decimal price, int aiLimit, int maxUsers);
    Task<bool> UpdateTenantPermissionsAsync(Guid tenantId, TenantPermissionsDto permissionsDto);
    Task<bool> DeleteTenantAsync(Guid id);
}
