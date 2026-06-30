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

public class PendingRegistrationService : IPendingRegistrationService
{
    private readonly AppDbContext _context;

    public PendingRegistrationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PendingRegistrationDto> CreateAsync(CreatePendingRegistrationDto dto)
    {
        var companyExists = await _context.Tenants.AnyAsync(t => t.Name == dto.CompanyName);
        if (companyExists)
        {
            throw new Exception("اسم الشركة مسجل بالفعل في النظام");
        }

        var pendingExists = await _context.PendingCompanyRegistrations
            .AnyAsync(p => p.CompanyName == dto.CompanyName && p.Status == "Pending");
        if (pendingExists)
        {
            throw new Exception("يوجد طلب معلق لهذه الشركة بالفعل");
        }

        var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.OwnerEmail);
        if (emailExists)
        {
            throw new Exception("البريد الإلكتروني مسجل بالفعل لمستخدم آخر");
        }

        var passwordHash = HashPassword(dto.OwnerPassword);

        var entity = new PendingCompanyRegistration
        {
            Id = Guid.NewGuid(),
            CompanyName = dto.CompanyName,
            SubscriptionPlan = dto.SubscriptionPlan,
            Price = dto.Price,
            AiLimit = dto.AiLimit,
            Address = dto.Address,
            OwnerFirstName = dto.OwnerFirstName,
            OwnerLastName = dto.OwnerLastName,
            OwnerEmail = dto.OwnerEmail,
            OwnerPhone = dto.OwnerPhone,
            OwnerPasswordHash = passwordHash,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.PendingCompanyRegistrations.Add(entity);
        await _context.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<List<PendingRegistrationDto>> GetAllAsync()
    {
        var registrations = await _context.PendingCompanyRegistrations
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return registrations.Select(MapToDto).ToList();
    }

    public async Task<PendingRegistrationDto> ApproveAsync(Guid id)
    {
        var pending = await _context.PendingCompanyRegistrations.FindAsync(id);
        if (pending == null)
        {
            throw new Exception("طلب التسجيل غير موجود");
        }

        if (pending.Status != "Pending")
        {
            throw new Exception($"لا يمكن الموافقة على طلب بحالة: {pending.Status}");
        }

        var tenant = new Tenant
        {
            TenantId = Guid.NewGuid(),
            Name = pending.CompanyName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            Price = pending.Price,
            AiLimit = pending.AiLimit,
            Address = pending.Address,
            Phone = pending.OwnerPhone
        };

        _context.Tenants.Add(tenant);

        var ownerUser = new User
        {
            TenantId = tenant.TenantId,
            FullName = $"{pending.OwnerFirstName} {pending.OwnerLastName}",
            Email = pending.OwnerEmail,
            PasswordHash = pending.OwnerPasswordHash,
            RoleId = 2,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(ownerUser);

        pending.Status = "Approved";
        pending.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(pending);
    }

    public async Task<PendingRegistrationDto> RejectAsync(Guid id, string? reason = null)
    {
        var pending = await _context.PendingCompanyRegistrations.FindAsync(id);
        if (pending == null)
        {
            throw new Exception("طلب التسجيل غير موجود");
        }

        if (pending.Status != "Pending")
        {
            throw new Exception($"لا يمكن رفض طلب بحالة: {pending.Status}");
        }

        pending.Status = "Rejected";
        pending.ProcessedAt = DateTime.UtcNow;
        pending.RejectionReason = reason;

        await _context.SaveChangesAsync();

        return MapToDto(pending);
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private static PendingRegistrationDto MapToDto(PendingCompanyRegistration entity)
    {
        return new PendingRegistrationDto
        {
            Id = entity.Id,
            CompanyName = entity.CompanyName,
            SubscriptionPlan = entity.SubscriptionPlan,
            Price = entity.Price,
            AiLimit = entity.AiLimit,
            Address = entity.Address,
            OwnerFirstName = entity.OwnerFirstName,
            OwnerLastName = entity.OwnerLastName,
            OwnerEmail = entity.OwnerEmail,
            OwnerPhone = entity.OwnerPhone,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt,
            ProcessedAt = entity.ProcessedAt,
            RejectionReason = entity.RejectionReason
        };
    }
}
