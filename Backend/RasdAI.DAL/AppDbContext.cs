using System;
using Microsoft.EntityFrameworkCore;
using RasdAI.DAL.Entities;

namespace RasdAI.DAL;

public class AppDbContext : DbContext
{
    private readonly ITenantProvider? _tenantProvider;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider? tenantProvider = null) : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Client> Clients { get; set; } = null!;
    public DbSet<Deal> Deals { get; set; } = null!;
    public DbSet<Invoice> Invoices { get; set; } = null!;
    public DbSet<TaskItem> Tasks { get; set; } = null!;
    public DbSet<Meeting> Meetings { get; set; } = null!;
    public DbSet<MeetingSchedule> MeetingSchedules { get; set; } = null!;
    public DbSet<Report> Reports { get; set; } = null!;
    public DbSet<Contract> Contracts { get; set; } = null!;
    public DbSet<Note> Notes { get; set; } = null!;
    public DbSet<AIConversation> AIConversations { get; set; } = null!;
    public DbSet<SupportIssue> SupportIssues { get; set; } = null!;
    public DbSet<LeaveRequest> LeaveRequests { get; set; } = null!;
    public DbSet<ContactMessage> ContactMessages { get; set; } = null!;
    public DbSet<JobVacancy> JobVacancies { get; set; } = null!;
    public DbSet<Candidate> Candidates { get; set; } = null!;
    public DbSet<Attendance> Attendances { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Attendance configuration to prevent cascade cycles
        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Apply Global Query Filter for Multi-Tenancy
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
            }
        }

        // 1. Roles configuration
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
        });

        // 2. Tenants configuration
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.TenantId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasPrecision(18, 2);
        });

        // 3. Users configuration (Self-referential relation for Manager)
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(512);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Users)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Manager)
                .WithMany(m => m.Reportees)
                .HasForeignKey(e => e.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 4. Clients configuration
        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(50);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Clients)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany(u => u.ClientsCreated)
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 5. Deals configuration
        modelBuilder.Entity<Deal>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Amount).HasPrecision(18, 2);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Deals)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Client)
                .WithMany(c => c.Deals)
                .HasForeignKey(e => e.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.AssignedUser)
                .WithMany(u => u.AssignedDeals)
                .HasForeignKey(e => e.AssignedUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 6. Invoices configuration
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Invoices)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Deal)
                .WithMany(d => d.Invoices)
                .HasForeignKey(e => e.DealId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 7. Tasks configuration
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Tasks)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AssignedUser)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(e => e.AssignedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Meeting)
                .WithMany(m => m.Tasks)
                .HasForeignKey(e => e.MeetingId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 8. Meetings (AI Transcription) configuration
        modelBuilder.Entity<Meeting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VideoFilePath).HasMaxLength(500);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Meetings)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 8b. MeetingSchedules (Calendar Scheduling) configuration
        modelBuilder.Entity<MeetingSchedule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
            entity.Property(e => e.MeetingTime).HasMaxLength(20);
            entity.Property(e => e.Duration).HasMaxLength(50);
            entity.Property(e => e.MeetingType).HasMaxLength(30);
            entity.Property(e => e.Location).HasMaxLength(300);
            entity.Property(e => e.Attendees).HasMaxLength(500);
            entity.Property(e => e.VirtualLink).HasMaxLength(500);

            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 8c. Reports configuration
        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Period).HasMaxLength(150);
            entity.Property(e => e.SizeLabel).HasMaxLength(20);

            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 9. Contracts configuration
        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Contracts)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Client)
                .WithMany(c => c.Contracts)
                .HasForeignKey(e => e.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 10. Notes configuration
        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired();

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Notes)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Client)
                .WithMany(c => c.Notes)
                .HasForeignKey(e => e.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany(u => u.NotesCreated)
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 11. AIConversations configuration
        modelBuilder.Entity<AIConversation>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 12. LeaveRequests configuration
        modelBuilder.Entity<LeaveRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LeaveType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Reason).HasColumnType("nvarchar(max)");
            entity.Property(e => e.RejectionReason).HasColumnType("nvarchar(max)");

            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Employee)
                .WithMany()
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Role)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ApprovedByUser)
                .WithMany()
                .HasForeignKey(e => e.ApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ==========================================
        // DATA SEEDING (للتجربة والتهيئة الأولية)
        // ==========================================

        // Seed Roles
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "SystemAdmin" },
            new Role { Id = 2, Name = "Owner" },
            new Role { Id = 3, Name = "Accountant" },
            new Role { Id = 4, Name = "SalesManager" },
            new Role { Id = 5, Name = "Sales" },
            new Role { Id = 6, Name = "EmployeeManager" },
            new Role { Id = 7, Name = "Employee" },
            new Role { Id = 8, Name = "HR" }
        );

        // Seed SystemAdmin Tenant
        var adminTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        modelBuilder.Entity<Tenant>().HasData(
            new Tenant
            {
                TenantId = adminTenantId,
                Name = "System Administration",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true,
                Price = 0.0m,
                AiLimit = 99999,
                IsCrmEnabled = true,
                IsInvoicesEnabled = true,
                IsTasksEnabled = true,
                IsMeetingsEnabled = true,
                IsAiEnabled = true
            }
        );

        // Seed SystemAdmin User (Email: faheem.admin@gmail.com, Password: Faheem123@)
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                TenantId = adminTenantId,
                RoleId = 1, // SystemAdmin
                FullName = "مدير النظام العام",
                Email = "faheem.admin@gmail.com",
                PasswordHash = "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM="
            }
        );

        // ==========================================
        // DEMO SEED DATA للمعاينة والتجربة
        // ==========================================
        var demoTenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        modelBuilder.Entity<Tenant>().HasData(
            new Tenant
            {
                TenantId = demoTenantId,
                Name = "شركة رصد للتطوير والاستشارات",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true,
                Price = 499.99m,
                AiLimit = 1000,
                IsCrmEnabled = true,
                IsInvoicesEnabled = true,
                IsTasksEnabled = true,
                IsMeetingsEnabled = true,
                IsAiEnabled = true
            }
        );

        var demoPassHash = "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI="; // SHA256("123456")

        modelBuilder.Entity<User>().HasData(
            new User { Id = 100, TenantId = demoTenantId, RoleId = 2, FullName = "أحمد فهيم (المالك)", Email = "owner@rasd.com", PasswordHash = demoPassHash },
            new User { Id = 101, TenantId = demoTenantId, RoleId = 5, FullName = "عمر البائع (مندوب مبيعات)", Email = "sales@rasd.com", PasswordHash = demoPassHash },
            new User { Id = 102, TenantId = demoTenantId, RoleId = 3, FullName = "منى الحسابات (المحاسب)", Email = "accountant@rasd.com", PasswordHash = demoPassHash },
            new User { Id = 103, TenantId = demoTenantId, RoleId = 4, FullName = "محمد المبيعات (مدير المبيعات)", Email = "salesmgr@rasd.com", PasswordHash = demoPassHash }
        );

        modelBuilder.Entity<Client>().HasData(
            new Client { Id = 100, TenantId = demoTenantId, CreatedByUserId = 101, Name = "شركة المقاولات العربية", Email = "contact@arabian.com", Phone = "01099998888", CreatedAt = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Client { Id = 101, TenantId = demoTenantId, CreatedByUserId = 101, Name = "مجموعة الفتح التجارية", Email = "info@alfath.com", Phone = "01288887777", CreatedAt = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        modelBuilder.Entity<Deal>().HasData(
            new Deal { Id = 100, TenantId = demoTenantId, ClientId = 100, AssignedUserId = 101, Amount = 150000m, Status = "Won", CreatedAt = new DateTime(2026, 3, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Deal { Id = 101, TenantId = demoTenantId, ClientId = 101, AssignedUserId = 101, Amount = 75000m, Status = "Won", CreatedAt = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc) }
        );

        modelBuilder.Entity<Invoice>().HasData(
            new Invoice { Id = 100, TenantId = demoTenantId, DealId = 100, TotalAmount = 150000m, Status = "Paid", DueDate = new DateTime(2026, 4, 15, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 3, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Invoice { Id = 101, TenantId = demoTenantId, DealId = 101, TotalAmount = 75000m, Status = "Paid", DueDate = new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc) }
        );

        // ==========================================
        // JOE TENANT SEED DATA
        // ==========================================
        var joeTenantId = Guid.Parse("76E445E1-6232-431E-A152-15A18C36E1A9");
        var joePassHash = "0ocFH8CB123YXvwpHXdNY00CYOXsehVfYI7i3qOWcGY="; // SHA256("123456") placeholder

        modelBuilder.Entity<Tenant>().HasData(
            new Tenant
            {
                TenantId = joeTenantId,
                Name = "شركة جو للخدمات",
                CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true,
                Price = 199.99m,
                AiLimit = 2000,
                IsCrmEnabled = true,
                IsInvoicesEnabled = true,
                IsTasksEnabled = true,
                IsMeetingsEnabled = true,
                IsAiEnabled = true
            }
        );

        modelBuilder.Entity<User>().HasData(
            new User { Id = 7, TenantId = joeTenantId, RoleId = 2, FullName = "جو المالك", Email = "joe@rasd.com", PasswordHash = joePassHash, Status = "Active" },
            new User { Id = 19, TenantId = joeTenantId, RoleId = 5, FullName = "صالح مندوب جو", Email = "sales_joe@rasd.com", PasswordHash = joePassHash, Status = "Active" },
            new User { Id = 20, TenantId = joeTenantId, RoleId = 5, FullName = "عمر مندوب جو", Email = "sales2_joe@rasd.com", PasswordHash = joePassHash, Status = "Active" }
        );

        modelBuilder.Entity<Client>().HasData(
            new Client { Id = 102, TenantId = joeTenantId, CreatedByUserId = 7, Name = "شركة التقنية المتطورة", Email = "info@techco.com", Phone = "+966501234567", CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) },
            new Client { Id = 103, TenantId = joeTenantId, CreatedByUserId = 7, Name = "مؤسسة الخدمات اللوجستية", Email = "contact@logistics.com", Phone = "+966507654321", CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) }
        );

        modelBuilder.Entity<Deal>().HasData(
            new Deal { Id = 102, TenantId = joeTenantId, ClientId = 102, AssignedUserId = 19, Amount = 200000m, Status = "Won", CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) },
            new Deal { Id = 103, TenantId = joeTenantId, ClientId = 102, AssignedUserId = 20, Amount = 85000m, Status = "Proposal", CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) },
            new Deal { Id = 104, TenantId = joeTenantId, ClientId = 103, AssignedUserId = null, Amount = 120000m, Status = "Contacted", CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) }
        );

        modelBuilder.Entity<Invoice>().HasData(
            new Invoice { Id = 102, TenantId = joeTenantId, DealId = 102, TotalAmount = 200000m, Status = "Paid", DueDate = new DateTime(2026, 7, 25, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) },
            new Invoice { Id = 103, TenantId = joeTenantId, DealId = 102, TotalAmount = 50000m, Status = "Unpaid", DueDate = new DateTime(2026, 7, 10, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) },
            new Invoice { Id = 104, TenantId = joeTenantId, DealId = 103, TotalAmount = 85000m, Status = "Unpaid", DueDate = new DateTime(2026, 8, 9, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) },
            new Invoice { Id = 105, TenantId = joeTenantId, DealId = 104, TotalAmount = 120000m, Status = "Overdue", DueDate = new DateTime(2026, 6, 15, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed SupportIssues
        modelBuilder.Entity<SupportIssue>().HasData(
            new SupportIssue
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                TenantId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                TenantName = "رصد للتقنية",
                IssueDescription = "استهلاك مساحة القرص الصلب تجاوز 95% على الخادم الرئيسي للشركة.",
                CreatedAt = new DateTime(2026, 6, 21, 14, 30, 0, DateTimeKind.Utc),
                Status = "Pending",
                AiActionDetails = "اكتشف الذكاء الاصطناعي ملفات سجلات (logs) ضخمة غير مضغوطة. الإجراء المقترح: ضغط وحذف ملفات السجلات القديمة تلقائياً لتوفير 40GB من المساحة."
            },
            new SupportIssue
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                TenantName = "مؤسسة القمة",
                IssueDescription = "فشل متكرر في إرسال البريد الإلكتروني الخاص بالفواتير للعملاء.",
                CreatedAt = new DateTime(2026, 6, 22, 10, 0, 0, DateTimeKind.Utc),
                Status = "Pending",
                AiActionDetails = "اكتشف الذكاء الاصطناعي خطأ في الاتصال مع سيرفر SMTP بسبب انتهاء صلاحية الرمز المميز (Token). الإجراء المقترح: إعادة الاتصال وإصدار توكن جديد لإرسال الفواتير المعلقة."
            }
        );

        modelBuilder.Entity<ContactMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(2000);
        });
    }

    public Guid? CurrentTenantId => _tenantProvider?.TenantId;

    private System.Linq.Expressions.LambdaExpression ConvertFilterExpression(Type type)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(type, "e");
        var property = System.Linq.Expressions.Expression.Property(parameter, "TenantId");
        var tenantIdProperty = System.Linq.Expressions.Expression.Property(System.Linq.Expressions.Expression.Constant(this), nameof(CurrentTenantId));
        
        var converted = System.Linq.Expressions.Expression.Convert(property, typeof(Guid?));
        var body = System.Linq.Expressions.Expression.Equal(converted, tenantIdProperty);
        
        return System.Linq.Expressions.Expression.Lambda(body, parameter);
    }

    public override int SaveChanges()
    {
        ApplyTenantId();
        return base.SaveChanges();
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyTenantId();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyTenantId();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyTenantId();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyTenantId()
    {
        var tenantId = _tenantProvider?.TenantId;
        if (tenantId == null || tenantId == Guid.Empty)
            return;

        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added && e.Entity is ITenantEntity);

        foreach (var entry in entries)
        {
            var entity = (ITenantEntity)entry.Entity;
            if (entity.TenantId == Guid.Empty)
            {
                entity.TenantId = tenantId.Value;
            }
        }
    }
}
