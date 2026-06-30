using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.DAL;
using RasdAI.DAL.Entities;
using RasdAI.BLL.DTOs.Contract;
using RasdAI.BLL.Interfaces;

namespace RasdAI.BLL.Services;

public class ContractService : IContractService
{
    private readonly AppDbContext _context;

    public ContractService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ContractDto>> GetAllContractsAsync(Guid tenantId)
    {
        var contracts = await _context.Contracts
            .Include(c => c.Client)
            .Include(c => c.Invoices)
            .Include(c => c.CreatedByUser)
            .Where(c => c.TenantId == tenantId && !c.IsDeleted && c.ClientId != null)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return contracts.Select(MapToDto);
    }

    public async Task<ContractDto?> GetContractByIdAsync(int id, Guid tenantId)
    {
        var contract = await _context.Contracts
            .Include(c => c.Client)
            .Include(c => c.Invoices)
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted && c.ClientId != null);

        if (contract == null) return null;
        
        return MapToDto(contract);
    }

    public async Task<ContractDto> CreateContractAsync(CreateContractDto dto, Guid tenantId, int userId)
    {
        // Generate Contract Number
        var currentYear = DateTime.UtcNow.Year;
        var count = await _context.Contracts.CountAsync(c => c.TenantId == tenantId && c.CreatedAt.Year == currentYear);
        var contractNumber = $"CTR-{currentYear}-{(count + 1):D5}";

        var contract = new Contract
        {
            TenantId = tenantId,
            ClientId = dto.ClientId,
            ContractNumber = contractNumber,
            ContractTitle = dto.ContractTitle,
            ContractType = dto.ContractType,
            Description = dto.Description,
            ReferenceNumber = dto.ReferenceNumber,
            Currency = dto.Currency,
            ContractValue = dto.ContractValue,
            TaxPercentage = dto.TaxPercentage,
            Discount = dto.Discount,
            FinalAmount = dto.FinalAmount,
            PaymentTerms = dto.PaymentTerms,
            DepositAmount = dto.DepositAmount,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            ReminderDays = dto.ReminderDays,
            Status = dto.Status,
            AttachmentsJson = dto.AttachmentsJson,
            PaidAmount = 0m,
            RemainingAmount = dto.FinalAmount,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _context.Contracts.Add(contract);
        await _context.SaveChangesAsync();

        return await GetContractByIdAsync(contract.Id, tenantId) ?? MapToDto(contract);
    }

    public async Task<ContractDto> UpdateContractAsync(int id, UpdateContractDto dto, Guid tenantId, int userId)
    {
        var contract = await _context.Contracts
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

        if (contract == null)
            throw new KeyNotFoundException("Contract not found");

        contract.ContractTitle = dto.ContractTitle;
        contract.ContractType = dto.ContractType;
        contract.Description = dto.Description;
        contract.ReferenceNumber = dto.ReferenceNumber;
        contract.Currency = dto.Currency;
        contract.ContractValue = dto.ContractValue;
        contract.TaxPercentage = dto.TaxPercentage;
        contract.Discount = dto.Discount;
        contract.FinalAmount = dto.FinalAmount;
        contract.PaymentTerms = dto.PaymentTerms;
        contract.DepositAmount = dto.DepositAmount;
        contract.StartDate = dto.StartDate;
        contract.EndDate = dto.EndDate;
        contract.ReminderDays = dto.ReminderDays;
        contract.Status = dto.Status;
        contract.AttachmentsJson = dto.AttachmentsJson;

        // Recalculate remaining amount based on new FinalAmount
        contract.RemainingAmount = contract.FinalAmount - contract.PaidAmount;

        contract.UpdatedBy = userId;
        contract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetContractByIdAsync(contract.Id, tenantId) ?? MapToDto(contract);
    }

    public async Task<bool> DeleteContractAsync(int id, Guid tenantId)
    {
        var contract = await _context.Contracts
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

        if (contract == null) return false;

        contract.IsDeleted = true;
        contract.Status = "Cancelled";
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ArchiveContractAsync(int id, Guid tenantId)
    {
        var contract = await _context.Contracts
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

        if (contract == null) return false;

        contract.Status = "Archived";
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<object> GetContractStatsAsync(Guid tenantId)
    {
        var query = _context.Contracts.Where(c => c.TenantId == tenantId && !c.IsDeleted && c.ClientId != null);

        var totalCount = await query.CountAsync();
        var activeCount = await query.CountAsync(c => c.Status == "Active");
        var expiredCount = await query.CountAsync(c => c.Status == "Expired");
        
        var next30Days = DateTime.UtcNow.AddDays(30);
        var expiringSoon = await query.CountAsync(c => c.Status == "Active" && c.EndDate <= next30Days && c.EndDate >= DateTime.UtcNow);

        var totalValue = await query.SumAsync(c => c.FinalAmount);
        var remainingValue = await query.SumAsync(c => c.RemainingAmount);

        return new
        {
            TotalContracts = totalCount,
            ActiveContracts = activeCount,
            ExpiredContracts = expiredCount,
            ExpiringSoon = expiringSoon,
            TotalContractValue = totalValue,
            RemainingContractValue = remainingValue
        };
    }

    private ContractDto MapToDto(Contract contract)
    {
        return new ContractDto
        {
            Id = contract.Id,
            TenantId = contract.TenantId,
            ClientId = contract.ClientId,
            ClientName = contract.Client?.Name ?? "",
            ContractNumber = contract.ContractNumber,
            ContractTitle = contract.ContractTitle,
            ContractType = contract.ContractType,
            Description = contract.Description,
            ReferenceNumber = contract.ReferenceNumber,
            Currency = contract.Currency,
            ContractValue = contract.ContractValue,
            TaxPercentage = contract.TaxPercentage,
            Discount = contract.Discount,
            FinalAmount = contract.FinalAmount,
            PaymentTerms = contract.PaymentTerms,
            DepositAmount = contract.DepositAmount,
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            ReminderDays = contract.ReminderDays,
            Status = contract.Status,
            AttachmentsJson = contract.AttachmentsJson,
            PaidAmount = contract.PaidAmount,
            RemainingAmount = contract.RemainingAmount,
            InvoicesCount = contract.Invoices?.Count ?? 0,
            PaymentsCount = 0, // This needs to be calculated by querying payments linked to the contract's invoices
            CreatedByUserId = contract.CreatedByUserId,
            CreatedByUserName = contract.CreatedByUser?.FullName,
            CreatedAt = contract.CreatedAt,
            UpdatedAt = contract.UpdatedAt
        };
    }
}
