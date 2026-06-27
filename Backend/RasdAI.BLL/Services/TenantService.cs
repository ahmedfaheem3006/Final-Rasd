using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Tenant;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class TenantService : ITenantService
{
    private readonly AppDbContext _context;

    public TenantService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TenantDto> RegisterTenantAsync(CreateTenantDto createTenantDto)
    {
        // Check if company already exists
        var companyExists = await CheckTenantExistsByNameAsync(createTenantDto.CompanyName);
        if (companyExists)
        {
            throw new Exception("اسم الشركة مسجل بالفعل في النظام");
        }

        // Check if user already exists
        var emailExists = await _context.Users.AnyAsync(u => u.Email == createTenantDto.OwnerEmail);
        if (emailExists)
        {
            throw new Exception("البريد الإلكتروني مسجل بالفعل لمستخدم آخر");
        }

        // Create Tenant
        var tenant = new Tenant
        {
            TenantId = Guid.NewGuid(),
            Name = createTenantDto.CompanyName,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tenants.Add(tenant);

        // Hash owner password
        var passwordHash = HashPassword(createTenantDto.OwnerPassword);

        // Owner role has Id 2
        var ownerUser = new User
        {
            TenantId = tenant.TenantId,
            FullName = createTenantDto.OwnerFullName,
            Email = createTenantDto.OwnerEmail,
            PasswordHash = passwordHash,
            RoleId = 2 // Owner Role
        };

        _context.Users.Add(ownerUser);
        await _context.SaveChangesAsync();

        return new TenantDto
        {
            TenantId = tenant.TenantId,
            Name = tenant.Name,
            CreatedAt = tenant.CreatedAt
        };
    }

    public async Task<TenantDto?> GetTenantByIdAsync(Guid id)
    {
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.Users)
            .FirstOrDefaultAsync(t => t.TenantId == id);
        if (tenant == null) return null;

        var owner = tenant.Users.FirstOrDefault(u => u.RoleId == 2);

        return new TenantDto
        {
            TenantId = tenant.TenantId,
            Name = tenant.Name,
            CreatedAt = tenant.CreatedAt,
            IsActive = tenant.IsActive,
            Price = tenant.Price,
            AiLimit = tenant.AiLimit,
            OwnerName = owner?.FullName ?? "غير محدد",
            OwnerEmail = owner?.Email ?? "غير محدد",
            IsCrmEnabled = tenant.IsCrmEnabled,
            IsInvoicesEnabled = tenant.IsInvoicesEnabled,
            IsTasksEnabled = tenant.IsTasksEnabled,
            IsMeetingsEnabled = tenant.IsMeetingsEnabled,
            IsAiEnabled = tenant.IsAiEnabled
        };
    }

    public async Task<bool> CheckTenantExistsByNameAsync(string name)
    {
        return await _context.Tenants.AnyAsync(t => t.Name == name);
    }

    public async Task<List<TenantDto>> GetAllTenantsAsync()
    {
        var adminTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        
        var tenants = await _context.Tenants
            .IgnoreQueryFilters()
            .Where(t => t.TenantId != adminTenantId)
            .Include(t => t.Users)
            .ToListAsync();

        return tenants.Select(t => {
            var owner = t.Users.FirstOrDefault(u => u.RoleId == 2);
            return new TenantDto
            {
                TenantId = t.TenantId,
                Name = t.Name,
                CreatedAt = t.CreatedAt,
                IsActive = t.IsActive,
                Price = t.Price,
                AiLimit = t.AiLimit,
                OwnerName = owner?.FullName ?? "غير محدد",
                OwnerEmail = owner?.Email ?? "غير محدد",
                IsCrmEnabled = t.IsCrmEnabled,
                IsInvoicesEnabled = t.IsInvoicesEnabled,
                IsTasksEnabled = t.IsTasksEnabled,
                IsMeetingsEnabled = t.IsMeetingsEnabled,
                IsAiEnabled = t.IsAiEnabled
            };
        }).ToList();
    }

    public async Task<TenantDto> CreateTenantByAdminAsync(CreateTenantAdminDto createTenantAdminDto)
    {
        // Check if company already exists
        var companyExists = await CheckTenantExistsByNameAsync(createTenantAdminDto.CompanyName);
        if (companyExists)
        {
            throw new Exception("اسم الشركة مسجل بالفعل في النظام");
        }

        // Check if user already exists
        var emailExists = await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == createTenantAdminDto.OwnerEmail);
        if (emailExists)
        {
            throw new Exception("البريد الإلكتروني للمالك مسجل بالفعل لمستخدم آخر");
        }

        // Create Tenant
        var tenant = new Tenant
        {
            TenantId = Guid.NewGuid(),
            Name = createTenantAdminDto.CompanyName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            Price = createTenantAdminDto.Price,
            AiLimit = createTenantAdminDto.AiLimit,
            IsCrmEnabled = createTenantAdminDto.IsCrmEnabled,
            IsInvoicesEnabled = createTenantAdminDto.IsInvoicesEnabled,
            IsTasksEnabled = createTenantAdminDto.IsTasksEnabled,
            IsMeetingsEnabled = createTenantAdminDto.IsMeetingsEnabled,
            IsAiEnabled = createTenantAdminDto.IsAiEnabled
        };

        _context.Tenants.Add(tenant);

        // Hash owner password
        var passwordHash = HashPassword(createTenantAdminDto.OwnerPassword);

        // Owner role has Id 2
        var ownerUser = new User
        {
            TenantId = tenant.TenantId,
            FullName = createTenantAdminDto.OwnerFullName,
            Email = createTenantAdminDto.OwnerEmail,
            PasswordHash = passwordHash,
            RoleId = 2 // Owner Role
        };

        _context.Users.Add(ownerUser);
        await _context.SaveChangesAsync();

        return new TenantDto
        {
            TenantId = tenant.TenantId,
            Name = tenant.Name,
            CreatedAt = tenant.CreatedAt,
            IsActive = tenant.IsActive,
            Price = tenant.Price,
            AiLimit = tenant.AiLimit,
            OwnerName = ownerUser.FullName,
            OwnerEmail = ownerUser.Email,
            IsCrmEnabled = tenant.IsCrmEnabled,
            IsInvoicesEnabled = tenant.IsInvoicesEnabled,
            IsTasksEnabled = tenant.IsTasksEnabled,
            IsMeetingsEnabled = tenant.IsMeetingsEnabled,
            IsAiEnabled = tenant.IsAiEnabled
        };
    }

    public async Task<bool> UpdateTenantStatusAsync(Guid tenantId, bool isActive)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.TenantId == tenantId);
        if (tenant == null)
        {
            throw new Exception("الشركة المطلوبة غير موجودة");
        }

        tenant.IsActive = isActive;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateTenantPricingAsync(Guid tenantId, decimal price, int aiLimit)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.TenantId == tenantId);
        if (tenant == null)
        {
            throw new Exception("الشركة المطلوبة غير موجودة");
        }

        tenant.Price = price;
        tenant.AiLimit = aiLimit;
        await _context.SaveChangesAsync();
        return true;
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    public async Task<bool> UpdateTenantPermissionsAsync(Guid tenantId, TenantPermissionsDto permissionsDto)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.TenantId == tenantId);
        if (tenant == null)
        {
            throw new Exception("الشركة المطلوبة غير موجودة");
        }

        tenant.IsCrmEnabled = permissionsDto.IsCrmEnabled;
        tenant.IsInvoicesEnabled = permissionsDto.IsInvoicesEnabled;
        tenant.IsTasksEnabled = permissionsDto.IsTasksEnabled;
        tenant.IsMeetingsEnabled = permissionsDto.IsMeetingsEnabled;
        tenant.IsAiEnabled = permissionsDto.IsAiEnabled;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteTenantAsync(Guid id)
    {
        // 1. Delete associated data first due to ON DELETE RESTRICT constraints
        var users = await _context.Users.IgnoreQueryFilters().Where(u => u.TenantId == id).ToListAsync();
        var tasks = await _context.Tasks.IgnoreQueryFilters().Where(t => t.TenantId == id).ToListAsync();
        var invoices = await _context.Invoices.IgnoreQueryFilters().Where(i => i.TenantId == id).ToListAsync();
        var deals = await _context.Deals.IgnoreQueryFilters().Where(d => d.TenantId == id).ToListAsync();
        var clients = await _context.Clients.IgnoreQueryFilters().Where(c => c.TenantId == id).ToListAsync();
        var meetings = await _context.Meetings.IgnoreQueryFilters().Where(m => m.TenantId == id).ToListAsync();
        var contracts = await _context.Contracts.IgnoreQueryFilters().Where(co => co.TenantId == id).ToListAsync();
        var notes = await _context.Notes.IgnoreQueryFilters().Where(n => n.TenantId == id).ToListAsync();
        var aiConvs = await _context.AIConversations.IgnoreQueryFilters().Where(ac => ac.TenantId == id).ToListAsync();

        _context.Users.RemoveRange(users);
        _context.Tasks.RemoveRange(tasks);
        _context.Invoices.RemoveRange(invoices);
        _context.Deals.RemoveRange(deals);
        _context.Clients.RemoveRange(clients);
        _context.Meetings.RemoveRange(meetings);
        _context.Contracts.RemoveRange(contracts);
        _context.Notes.RemoveRange(notes);
        _context.AIConversations.RemoveRange(aiConvs);

        // 2. Remove Tenant
        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.TenantId == id);
        if (tenant != null)
        {
            _context.Tenants.Remove(tenant);
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
