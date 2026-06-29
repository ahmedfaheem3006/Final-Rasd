using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Client;
using RasdAI.BLL.Exceptions;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class ClientFinancialService : IClientFinancialService
{
    private readonly AppDbContext _context;

    public ClientFinancialService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientOverviewDto>> GetClientsAsync(Guid tenantId)
    {
        var clients = await _context.Clients
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId)
            .ToListAsync();

        var invoiceData = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId)
            .GroupBy(i => i.ClientId)
            .Select(g => new { ClientId = g.Key, Outstanding = g.Where(i => i.Status == "Unpaid" || i.Status == "Overdue").Sum(i => i.GrandTotal) })
            .ToListAsync();

        var outstandingMap = invoiceData.ToDictionary(x => x.ClientId, x => x.Outstanding);

        return clients.Select(c => new ClientOverviewDto
        {
            Id = c.Id,
            CompanyName = c.CompanyName ?? c.Name,
            OwnerName = c.OwnerName ?? "",
            Email = c.Email,
            Phone = c.Phone,
            Industry = c.Industry,
            OutstandingBalance = outstandingMap.GetValueOrDefault(c.Id, 0),
            Status = c.Status,
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public async Task<ClientDetailDto> GetClientByIdAsync(int id, Guid tenantId)
    {
        var client = await _context.Clients
            .AsNoTracking()
            .Include(c => c.CreatedByUser)
            .Include(c => c.Deals)
                .ThenInclude(d => d.Invoices)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (client == null)
            throw new NotFoundException("العميل غير موجود");

        var invoices = client.Deals.SelectMany(d => d.Invoices).ToList();

        return new ClientDetailDto
        {
            Id = client.Id,
            TenantId = client.TenantId,
            CreatedByUserId = client.CreatedByUserId,
            CreatedByUserName = client.CreatedByUser?.FullName ?? "",
            Name = client.Name,
            Email = client.Email,
            Phone = client.Phone,
            CreatedAt = client.CreatedAt,
            CompanyName = client.CompanyName,
            CommercialRegistration = client.CommercialRegistration,
            TaxNumber = client.TaxNumber,
            Industry = client.Industry,
            Website = client.Website,
            CompanySize = client.CompanySize,
            Description = client.Description,
            Logo = client.Logo,
            OwnerName = client.OwnerName,
            JobTitle = client.JobTitle,
            Country = client.Country,
            Governorate = client.Governorate,
            City = client.City,
            Street = client.Street,
            PostalCode = client.PostalCode,
            CreditLimit = client.CreditLimit,
            PaymentTerms = client.PaymentTerms,
            Currency = client.Currency,
            OpeningBalance = client.OpeningBalance,
            TaxPercentage = client.TaxPercentage,
            Status = client.Status,
            TotalRevenue = invoices.Where(i => i.Status == "Paid").Sum(i => i.GrandTotal),
            OutstandingBalance = invoices.Where(i => i.Status == "Unpaid" || i.Status == "Overdue").Sum(i => i.GrandTotal),
            InvoicesCount = invoices.Count,
            PaymentsReceived = invoices.Count(i => i.Status == "Paid")
        };
    }

    public async Task<ClientDetailDto> CreateClientAsync(CreateClientDetailDto dto, Guid tenantId, int userId)
    {
        if (!string.IsNullOrEmpty(dto.CommercialRegistration))
        {
            var commExists = await _context.Clients.AnyAsync(c => c.TenantId == tenantId && c.CommercialRegistration == dto.CommercialRegistration);
            if (commExists)
                throw new ConflictException("السجل التجاري مسجل بالفعل لعميل آخر");
        }

        if (!string.IsNullOrEmpty(dto.TaxNumber))
        {
            var taxExists = await _context.Clients.AnyAsync(c => c.TenantId == tenantId && c.TaxNumber == dto.TaxNumber);
            if (taxExists)
                throw new ConflictException("الرقم الضريبي مسجل بالفعل لعميل آخر");
        }

        var client = new Client
        {
            TenantId = tenantId,
            CreatedByUserId = userId,
            Name = dto.CompanyName,
            CompanyName = dto.CompanyName,
            CommercialRegistration = dto.CommercialRegistration,
            TaxNumber = dto.TaxNumber,
            Industry = dto.Industry,
            Website = dto.Website,
            CompanySize = dto.CompanySize,
            Description = dto.Description,
            Logo = dto.Logo,
            OwnerName = dto.OwnerName,
            Email = dto.Email,
            Phone = dto.Phone,
            JobTitle = dto.JobTitle,
            Country = dto.Country,
            Governorate = dto.Governorate,
            City = dto.City,
            Street = dto.Street,
            PostalCode = dto.PostalCode,
            CreditLimit = dto.CreditLimit,
            PaymentTerms = dto.PaymentTerms,
            Currency = dto.Currency,
            OpeningBalance = dto.OpeningBalance,
            TaxPercentage = dto.TaxPercentage,
            Status = dto.Status,
            CreatedAt = DateTime.UtcNow
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        return new ClientDetailDto
        {
            Id = client.Id,
            TenantId = client.TenantId,
            CreatedByUserId = client.CreatedByUserId,
            CreatedByUserName = user?.FullName ?? "",
            Name = client.Name,
            Email = client.Email,
            Phone = client.Phone,
            CreatedAt = client.CreatedAt,
            CompanyName = client.CompanyName,
            Status = client.Status
        };
    }

    public async Task<ClientDetailDto> UpdateClientAsync(int id, CreateClientDetailDto dto, Guid tenantId)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (client == null)
            throw new NotFoundException("العميل غير موجود");

        if (!string.IsNullOrEmpty(dto.CommercialRegistration) && dto.CommercialRegistration != client.CommercialRegistration)
        {
            var commExists = await _context.Clients.AnyAsync(c => c.TenantId == tenantId && c.CommercialRegistration == dto.CommercialRegistration && c.Id != id);
            if (commExists)
                throw new ConflictException("السجل التجاري مسجل بالفعل لعميل آخر");
        }

        if (!string.IsNullOrEmpty(dto.TaxNumber) && dto.TaxNumber != client.TaxNumber)
        {
            var taxExists = await _context.Clients.AnyAsync(c => c.TenantId == tenantId && c.TaxNumber == dto.TaxNumber && c.Id != id);
            if (taxExists)
                throw new ConflictException("الرقم الضريبي مسجل بالفعل لعميل آخر");
        }

        client.CompanyName = dto.CompanyName;
        client.Name = dto.CompanyName;
        client.CommercialRegistration = dto.CommercialRegistration;
        client.TaxNumber = dto.TaxNumber;
        client.Industry = dto.Industry;
        client.Website = dto.Website;
        client.CompanySize = dto.CompanySize;
        client.Description = dto.Description;
        client.Logo = dto.Logo;
        client.OwnerName = dto.OwnerName;
        client.Email = dto.Email;
        client.Phone = dto.Phone;
        client.JobTitle = dto.JobTitle;
        client.Country = dto.Country;
        client.Governorate = dto.Governorate;
        client.City = dto.City;
        client.Street = dto.Street;
        client.PostalCode = dto.PostalCode;
        client.CreditLimit = dto.CreditLimit;
        client.PaymentTerms = dto.PaymentTerms;
        client.Currency = dto.Currency;
        client.OpeningBalance = dto.OpeningBalance;
        client.TaxPercentage = dto.TaxPercentage;
        client.Status = dto.Status;

        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(client.CreatedByUserId);

        return new ClientDetailDto
        {
            Id = client.Id,
            TenantId = client.TenantId,
            CreatedByUserId = client.CreatedByUserId,
            CreatedByUserName = user?.FullName ?? "",
            Name = client.Name,
            Email = client.Email,
            Phone = client.Phone,
            CreatedAt = client.CreatedAt,
            CompanyName = client.CompanyName,
            Status = client.Status
        };
    }

    public async Task<bool> DeleteClientAsync(int id, Guid tenantId)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (client == null)
            throw new NotFoundException("العميل غير موجود أو لا ينتمي لشركتك");

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();
        return true;
    }
}
