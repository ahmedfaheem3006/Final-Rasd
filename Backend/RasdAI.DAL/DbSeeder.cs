using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using RasdAI.DAL.Entities;

namespace RasdAI.DAL;

public static class DbSeeder
{
    // SHA-256("123456")
    private const string PassHash = "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=";

    public static readonly Guid CompanyTenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    public static void SeedCompanyWithAllRoles(AppDbContext db)
    {
        var existing = db.Tenants.IgnoreQueryFilters()
                                  .FirstOrDefault(t => t.TenantId == CompanyTenantId);
        if (existing != null)
            return;

        var tenant = new Tenant
        {
            TenantId = CompanyTenantId,
            Name = "شركة رصد للتطوير",
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            Price = 299.99m,
            AiLimit = 1000,
            IsCrmEnabled = true,
            IsInvoicesEnabled = true,
            IsTasksEnabled = true,
            IsMeetingsEnabled = true,
            IsAiEnabled = true
        };

        db.Tenants.Add(tenant);
        db.SaveChanges();

        var users = new List<User>
        {
            new() { TenantId = CompanyTenantId, RoleId = 2, FullName = "مالك الشركة",       Email = "owner@company.rasd",      PasswordHash = PassHash },
            new() { TenantId = CompanyTenantId, RoleId = 3, FullName = "محاسب الشركة",      Email = "accountant@company.rasd", PasswordHash = PassHash },
            new() { TenantId = CompanyTenantId, RoleId = 4, FullName = "مدير المبيعات",      Email = "salesmgr@company.rasd",   PasswordHash = PassHash },
            new() { TenantId = CompanyTenantId, RoleId = 5, FullName = "مندوب المبيعات",     Email = "sales@company.rasd",      PasswordHash = PassHash },
            new() { TenantId = CompanyTenantId, RoleId = 6, FullName = "مدير الموظفين",      Email = "empmgr@company.rasd",     PasswordHash = PassHash },
            new() { TenantId = CompanyTenantId, RoleId = 7, FullName = "موظف",               Email = "employee@company.rasd",   PasswordHash = PassHash },
            new() { TenantId = CompanyTenantId, RoleId = 8, FullName = "مسؤول الموارد البشرية", Email = "hr@company.rasd",      PasswordHash = PassHash },
        };

        db.Users.AddRange(users);
        db.SaveChanges();
    }
}
