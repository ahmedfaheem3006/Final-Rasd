using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Customer;
using RasdAI.BLL.DTOs.Deal;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class CrmService : ICrmService
{
    private readonly AppDbContext _context;

    public CrmService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientDto>> GetClientsAsync(Guid tenantId)
    {
        return await _context.Clients
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId)
            .Include(c => c.CreatedByUser)
            .Select(c => new ClientDto
            {
                Id = c.Id,
                TenantId = c.TenantId,
                CreatedByUserId = c.CreatedByUserId,
                CreatedByUserName = c.CreatedByUser.FullName,
                Name = c.Name,
                CompanyName = c.CompanyName,
                Email = c.Email,
                Phone = c.Phone,
                Status = c.Status,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ClientDto?> UpdateClientAsync(int clientId, UpdateClientDto dto, Guid tenantId)
    {
        var client = await _context.Clients
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == clientId && c.TenantId == tenantId);

        if (client == null) return null;

        client.Name = dto.Name;
        client.Email = dto.Email ?? string.Empty;
        client.Phone = dto.Phone ?? string.Empty;
        client.CompanyName = dto.CompanyName;
        client.Status = dto.Status;

        await _context.SaveChangesAsync();

        return new ClientDto
        {
            Id = client.Id,
            TenantId = client.TenantId,
            CreatedByUserId = client.CreatedByUserId,
            CreatedByUserName = client.CreatedByUser?.FullName ?? string.Empty,
            Name = client.Name,
            CompanyName = client.CompanyName,
            Email = client.Email,
            Phone = client.Phone,
            Status = client.Status,
            CreatedAt = client.CreatedAt
        };
    }

    public async Task<bool> DeleteClientAsync(int clientId, Guid tenantId)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.Id == clientId && c.TenantId == tenantId);

        if (client == null) return false;

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ClientDto> CreateClientAsync(CreateClientDto createClientDto, Guid tenantId, int userId)
    {
        var client = new Client
        {
            TenantId = tenantId,
            CreatedByUserId = userId,
            Name = createClientDto.Name,
            Email = createClientDto.Email ?? string.Empty,
            Phone = createClientDto.Phone ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        // Get user name
        var user = await _context.Users.FindAsync(userId);

        return new ClientDto
        {
            Id = client.Id,
            TenantId = client.TenantId,
            CreatedByUserId = client.CreatedByUserId,
            CreatedByUserName = user?.FullName ?? string.Empty,
            Name = client.Name,
            Email = client.Email,
            Phone = client.Phone,
            CreatedAt = client.CreatedAt
        };
    }

    public async Task<List<DealDto>> GetDealsAsync(Guid tenantId)
    {
        return await _context.Deals
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId)
            .Include(d => d.Client)
            .Include(d => d.AssignedUser)
            .Select(d => new DealDto
            {
                Id = d.Id,
                TenantId = d.TenantId,
                ClientId = d.ClientId,
                ClientName = d.Client.Name,
                AssignedUserId = d.AssignedUserId,
                AssignedUserName = d.AssignedUser != null ? d.AssignedUser.FullName : string.Empty,
                Amount = d.Amount,
                Status = d.Status,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<DealDto> CreateDealAsync(CreateDealDto createDealDto, Guid tenantId)
    {
        var clientExists = await _context.Clients.AnyAsync(c => c.Id == createDealDto.ClientId && c.TenantId == tenantId);
        if (!clientExists)
        {
            throw new Exception("العميل غير موجود أو لا ينتمي لشركتك");
        }

        var deal = new Deal
        {
            TenantId = tenantId,
            ClientId = createDealDto.ClientId,
            AssignedUserId = createDealDto.AssignedUserId,
            Amount = createDealDto.Amount,
            Status = createDealDto.Status,
            CreatedAt = DateTime.UtcNow
        };

        _context.Deals.Add(deal);
        await _context.SaveChangesAsync();

        var client = await _context.Clients.FindAsync(createDealDto.ClientId);
        var user = await _context.Users.FindAsync(createDealDto.AssignedUserId);

        return new DealDto
        {
            Id = deal.Id,
            TenantId = deal.TenantId,
            ClientId = deal.ClientId,
            ClientName = client?.Name ?? string.Empty,
            AssignedUserId = deal.AssignedUserId,
            AssignedUserName = user?.FullName ?? string.Empty,
            Amount = deal.Amount,
            Status = deal.Status,
            CreatedAt = deal.CreatedAt
        };
    }

    public async Task<bool> UpdateDealStatusAsync(int dealId, string status, Guid tenantId)
    {
        var deal = await _context.Deals
            .FirstOrDefaultAsync(d => d.Id == dealId && d.TenantId == tenantId);

        if (deal == null) return false;

        deal.Status = status;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DealDto?> UpdateDealAsync(int dealId, UpdateDealDto dto, Guid tenantId)
    {
        var deal = await _context.Deals
            .Include(d => d.Client)
            .Include(d => d.AssignedUser)
            .FirstOrDefaultAsync(d => d.Id == dealId && d.TenantId == tenantId);

        if (deal == null) return null;

        var clientExists = await _context.Clients.AnyAsync(c => c.Id == dto.ClientId && c.TenantId == tenantId);
        if (!clientExists) throw new KeyNotFoundException("العميل غير موجود");

        deal.ClientId = dto.ClientId;
        deal.AssignedUserId = dto.AssignedUserId;
        deal.Amount = dto.Amount;
        deal.Status = dto.Status;
        await _context.SaveChangesAsync();

        await _context.Entry(deal).Reference(d => d.Client).LoadAsync();
        if (deal.AssignedUserId.HasValue)
            await _context.Entry(deal).Reference(d => d.AssignedUser).LoadAsync();

        return new DealDto
        {
            Id = deal.Id,
            TenantId = deal.TenantId,
            ClientId = deal.ClientId,
            ClientName = deal.Client?.Name ?? "",
            AssignedUserId = deal.AssignedUserId,
            AssignedUserName = deal.AssignedUser?.FullName ?? "",
            Amount = deal.Amount,
            Status = deal.Status,
            CreatedAt = deal.CreatedAt
        };
    }

    public async Task<bool> DeleteDealAsync(int dealId, Guid tenantId)
    {
        var deal = await _context.Deals
            .FirstOrDefaultAsync(d => d.Id == dealId && d.TenantId == tenantId);

        if (deal == null) return false;

        _context.Deals.Remove(deal);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Note>> GetNotesForClientAsync(int clientId, Guid tenantId)
    {
        return await _context.Notes
            .AsNoTracking()
            .Where(n => n.ClientId == clientId && n.TenantId == tenantId)
            .Include(n => n.CreatedByUser)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Note> AddNoteAsync(int clientId, string content, Guid tenantId, int userId)
    {
        var clientExists = await _context.Clients.AnyAsync(c => c.Id == clientId && c.TenantId == tenantId);
        if (!clientExists)
        {
            throw new Exception("العميل غير موجود أو لا ينتمي لشركتك");
        }

        var note = new Note
        {
            TenantId = tenantId,
            ClientId = clientId,
            CreatedByUserId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync();
        return note;
    }
}
