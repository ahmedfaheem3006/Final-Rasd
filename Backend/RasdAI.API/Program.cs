using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RasdAI.BLL;
using RasdAI.BLL.Interfaces;
using RasdAI.BLL.Services;
using RasdAI.DAL;
using RasdAI.API.Middlewares;
using RasdAI.API.Hubs;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("LABConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString)
           .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// Add HttpClient for LLM/Whisper API calls
builder.Services.AddHttpClient();

// Register Scoped TenantContext and BLL Services
builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<ICrmService, CrmService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IMeetingService, MeetingService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ILeaveRequestService, LeaveRequestService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IRecruitmentService, RecruitmentService>();
builder.Services.AddScoped<IPendingRegistrationService, PendingRegistrationService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyMustBe32CharsLong!";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "RasdAI_API",
        ValidAudience = jwtSettings["Audience"] ?? "RasdAI_Clients",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// Configure CORS for local development (allowing Angular Frontend on :4200)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add SignalR real-time services
builder.Services.AddSignalR();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Enable Database Auto-Migration on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        dbContext.Database.Migrate();

        // Seed development/testing data if not present
        var devTenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var devTenant = dbContext.Tenants.IgnoreQueryFilters().FirstOrDefault(t => t.TenantId == devTenantId);
        if (devTenant == null)
        {
            devTenant = new RasdAI.DAL.Entities.Tenant
            {
                TenantId = devTenantId,
                Name = "مؤسسة رصد لتقنية المعلومات",
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                Price = 100.0m,
                AiLimit = 5000,
                IsCrmEnabled = true,
                IsInvoicesEnabled = true,
                IsTasksEnabled = true,
                IsMeetingsEnabled = true,
                IsAiEnabled = true
            };
            dbContext.Tenants.Add(devTenant);
            dbContext.SaveChanges();
        }

        // Seed default users if they don't exist
        var usersToSeed = new List<RasdAI.DAL.Entities.User>
        {
            new RasdAI.DAL.Entities.User
            {
                TenantId = devTenantId,
                FullName = "أحمد فهيم",
                Email = "owner@rasd.com",
                RoleId = 2, // Owner
                PasswordHash = "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM="
            },
            new RasdAI.DAL.Entities.User
            {
                TenantId = devTenantId,
                FullName = "سارة محمود",
                Email = "accountant@rasd.com",
                RoleId = 3, // Accountant
                PasswordHash = "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM="
            },
            new RasdAI.DAL.Entities.User
            {
                TenantId = devTenantId,
                FullName = "خالد منصور",
                Email = "salesmgr@rasd.com",
                RoleId = 4, // SalesManager
                PasswordHash = "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM="
            },
            new RasdAI.DAL.Entities.User
            {
                TenantId = devTenantId,
                FullName = "عمر فاروق",
                Email = "empmgr@rasd.com",
                RoleId = 6, // EmployeeManager
                PasswordHash = "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM="
            },
            new RasdAI.DAL.Entities.User
            {
                TenantId = devTenantId,
                FullName = "يوسف حسن",
                Email = "employee@rasd.com",
                RoleId = 7, // Employee
                PasswordHash = "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM="
            },
            new RasdAI.DAL.Entities.User
            {
                TenantId = devTenantId,
                FullName = "رنا علي",
                Email = "sales@rasd.com",
                RoleId = 5, // Sales (rep)
                PasswordHash = "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM="
            },
            new RasdAI.DAL.Entities.User
            {
                TenantId = devTenantId,
                FullName = "منى السالم",
                Email = "hr@rasd.com",
                RoleId = 8, // HR
                PasswordHash = "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM=" // "123456"
            }
        };

        foreach (var u in usersToSeed)
        {
            var exists = dbContext.Users.IgnoreQueryFilters().Any(existingUser => existingUser.Email == u.Email);
            if (!exists)
            {
                dbContext.Users.Add(u);
            }
        }
        dbContext.SaveChanges();

        // Seed some sample meetings for owner if none exist
        var hasMeetings = dbContext.MeetingSchedules.IgnoreQueryFilters().Any(m => m.TenantId == devTenantId);
        if (!hasMeetings)
        {
            dbContext.MeetingSchedules.AddRange(
                new RasdAI.DAL.Entities.MeetingSchedule
                {
                    TenantId = devTenantId,
                    Title = "مراجعة المبيعات الأسبوعية",
                    MeetingDate = DateTime.UtcNow.AddDays(1).Date,
                    MeetingTime = "10:00 ص",
                    Duration = "45 دقيقة",
                    MeetingType = "internal",
                    Location = "غرفة الاجتماعات الرئيسية",
                    Attendees = "أف, خم, رع",
                    VirtualLink = "https://meet.google.com/abc-defg-hij"
                },
                new RasdAI.DAL.Entities.MeetingSchedule
                {
                    TenantId = devTenantId,
                    Title = "مناقشة العقد مع مجموعة الفوزان",
                    MeetingDate = DateTime.UtcNow.AddDays(2).Date,
                    MeetingTime = "01:30 م",
                    Duration = "60 دقيقة",
                    MeetingType = "client",
                    Location = "Zoom Link",
                    Attendees = "أف, رع",
                    VirtualLink = "https://zoom.us/j/9876543210"
                },
                new RasdAI.DAL.Entities.MeetingSchedule
                {
                    TenantId = devTenantId,
                    Title = "التخطيط الاستراتيجي للربع الثالث",
                    MeetingDate = DateTime.UtcNow.AddDays(5).Date,
                    MeetingTime = "11:00 ص",
                    Duration = "120 دقيقة",
                    MeetingType = "strategic",
                    Location = "قاعة المؤتمرات الكبرى",
                    Attendees = "أف, خم, سم, عف",
                    VirtualLink = "https://meet.google.com/xyz-uvwx-123"
                }
            );
            dbContext.SaveChanges();
        }

        // Seed recruitment data (Job Vacancies + Candidates)
        var hasVacancies = dbContext.JobVacancies.IgnoreQueryFilters().Any(j => j.TenantId == devTenantId);
        if (!hasVacancies)
        {
            var job1 = new RasdAI.DAL.Entities.JobVacancy { TenantId = devTenantId, Title = "Senior Angular Developer", Department = "القسم التقني", Status = "Open", CreatedBy = 1 };
            var job2 = new RasdAI.DAL.Entities.JobVacancy { TenantId = devTenantId, Title = "UI/UX Designer", Department = "التصميم والهوية", Status = "Open", CreatedBy = 1 };
            var job3 = new RasdAI.DAL.Entities.JobVacancy { TenantId = devTenantId, Title = "Sales Executive", Department = "إدارة المبيعات", Status = "Closed", CreatedBy = 1 };
            var job4 = new RasdAI.DAL.Entities.JobVacancy { TenantId = devTenantId, Title = "Senior .NET Developer", Department = "القسم التقني", Status = "Open", CreatedBy = 1 };
            var job5 = new RasdAI.DAL.Entities.JobVacancy { TenantId = devTenantId, Title = "HR Generalist", Department = "الموارد البشرية", Status = "Open", CreatedBy = 1 };

            dbContext.JobVacancies.AddRange(job1, job2, job3, job4, job5);
            dbContext.SaveChanges();

            dbContext.Candidates.AddRange(
                new RasdAI.DAL.Entities.Candidate { TenantId = devTenantId, Name = "أحمد الدوسري", AppliedRole = "Senior .NET Developer", Rating = 4, Stage = "applied", JobVacancyId = job4.Id, CreatedBy = 1 },
                new RasdAI.DAL.Entities.Candidate { TenantId = devTenantId, Name = "سارة خالد", AppliedRole = "UI/UX Designer", Rating = 5, Stage = "interview", JobVacancyId = job2.Id, CreatedBy = 1 },
                new RasdAI.DAL.Entities.Candidate { TenantId = devTenantId, Name = "سلطان العتيبي", AppliedRole = "Senior Angular Developer", Rating = 3, Stage = "test", JobVacancyId = job1.Id, CreatedBy = 1 },
                new RasdAI.DAL.Entities.Candidate { TenantId = devTenantId, Name = "مريم علي", AppliedRole = "HR Generalist", Rating = 4, Stage = "offer", JobVacancyId = job5.Id, CreatedBy = 1 },
                new RasdAI.DAL.Entities.Candidate { TenantId = devTenantId, Name = "عبدالله السعدون", AppliedRole = "Senior .NET Developer", Rating = 5, Stage = "hired", JobVacancyId = job4.Id, CreatedBy = 1 },
                new RasdAI.DAL.Entities.Candidate { TenantId = devTenantId, Name = "خالد الفهد", AppliedRole = "Senior .NET Developer", Rating = 5, Stage = "interview", JobVacancyId = job4.Id, CreatedBy = 1 },
                new RasdAI.DAL.Entities.Candidate { TenantId = devTenantId, Name = "منى العبدالله", AppliedRole = "UI/UX Designer", Rating = 4, Stage = "applied", JobVacancyId = job2.Id, CreatedBy = 1 },
                new RasdAI.DAL.Entities.Candidate { TenantId = devTenantId, Name = "فيصل النعيم", AppliedRole = "Senior Angular Developer", Rating = 4, Stage = "offer", JobVacancyId = job1.Id, CreatedBy = 1 }
            );
            dbContext.SaveChanges();
        }

        // Seed a company with one account per role
        RasdAI.DAL.DbSeeder.SeedCompanyWithAllRoles(dbContext);

        // Remove report seeding and clear existing reports for devTenantId so only user-created reports are shown
        var existingReports = dbContext.Reports.IgnoreQueryFilters().Where(r => r.TenantId == devTenantId).ToList();
        if (existingReports.Any())
        {
            dbContext.Reports.RemoveRange(existingReports);
            dbContext.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Auto-Migration/Seed Error]: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("Rasd AI API Reference")
           .WithTheme(ScalarTheme.Purple)
           .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});

// Apply CORS Policy (MUST be before HTTPS redirection to prevent CORS preflight redirect errors)
app.UseCors("AllowAll");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Use Global Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Use Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Use Tenant Extraction Middleware (Must be after UseAuthentication to read JWT Claims)
app.UseMiddleware<TenantMiddleware>();

// Redirect root URL to Scalar documentation page
app.MapGet("/", context =>
{
    context.Response.Redirect("/scalar/v1");
    return Task.CompletedTask;
});

app.MapControllers();

// Map SignalR Notification Hub
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
