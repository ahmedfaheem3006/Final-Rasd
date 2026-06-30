using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Accountant;
using RasdAI.BLL.Exceptions;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class AccountantService : IAccountantService
{
    private readonly AppDbContext _context;

    public AccountantService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AccountantDto>> GetAccountantsAsync(Guid tenantId)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.TenantId == tenantId && u.RoleId == 3)
            .Select(u => new AccountantDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.PhoneNumber ?? "",
                Status = u.Status,
                CreatedAt = u.CreatedAt,
                AvatarInitials = u.FullName.Length >= 2
                    ? u.FullName.Substring(0, 1) + u.FullName.Substring(u.FullName.Length - 1, 1)
                    : u.FullName.Substring(0, 1)
            })
            .ToListAsync();
    }

    public async Task<AccountantDto> CreateAccountantAsync(CreateAccountantDto dto, Guid tenantId, int createdByUserId)
    {
        var emailExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == dto.Email);
        if (emailExists)
            throw new ConflictException("البريد الإلكتروني مسجل بالفعل لمستخدم آخر");

        var fullName = $"{dto.FirstName} {dto.LastName}";

        var user = new User
        {
            TenantId = tenantId,
            RoleId = 3,
            FullName = fullName,
            Email = dto.Email,
            PhoneNumber = dto.Phone,
            PasswordHash = HashPassword(dto.Password),
            Status = dto.Status,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new AccountantDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = dto.Phone ?? "",
            Status = user.Status,
            CreatedAt = user.CreatedAt,
            AvatarInitials = fullName.Length >= 2
                ? fullName[0].ToString() + fullName[^1].ToString()
                : fullName[0].ToString()
        };
    }

    public async Task<AccountantDto> UpdateAccountantStatusAsync(int userId, string status, Guid tenantId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId && u.RoleId == 3);

        if (user == null)
            throw new NotFoundException("المحاسب غير موجود أو لا ينتمي لشركتك");

        user.Status = status;
        await _context.SaveChangesAsync();

        return new AccountantDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Status = user.Status,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<bool> DeleteAccountantAsync(int userId, Guid tenantId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId && u.RoleId == 3);

        if (user == null)
            throw new NotFoundException("المحاسب غير موجود أو لا ينتمي لشركتك");

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AccountantDashboardStatsDto> GetAccountantDashboardStatsAsync(Guid tenantId, int? accountantUserId = null)
    {
        var clientsQuery = _context.Clients.AsNoTracking().Where(c => c.TenantId == tenantId);
        var invoicesQuery = _context.Invoices.AsNoTracking().Where(i => i.TenantId == tenantId);
        var paymentsQuery = _context.Set<Payment>().AsNoTracking().Where(p => p.TenantId == tenantId && !p.IsDeleted);
        var expensesQuery = _context.Set<Expense>().AsNoTracking().Where(e => e.TenantId == tenantId && !e.IsDeleted);

        if (accountantUserId.HasValue)
        {
            clientsQuery = clientsQuery.Where(c => c.CreatedByUserId == accountantUserId.Value);
        }

        var clients = await clientsQuery.ToListAsync();
        var invoices = await invoicesQuery.ToListAsync();
        var payments = await paymentsQuery.ToListAsync();
        var expenses = await expensesQuery.ToListAsync();

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var prevMonthStart = monthStart.AddMonths(-1);

        var totalRevenue = invoices.Where(i => i.Status == "Paid").Sum(i => i.GrandTotal);
        var prevRevenue = invoices.Where(i => i.Status == "Paid" && i.CreatedAt >= prevMonthStart && i.CreatedAt < monthStart).Sum(i => i.GrandTotal);
        var currentRevenue = invoices.Where(i => i.Status == "Paid" && i.CreatedAt >= monthStart).Sum(i => i.GrandTotal);

        var growth = prevRevenue > 0 ? Math.Round((currentRevenue - prevRevenue) / prevRevenue * 100, 1) : 0;

        return new AccountantDashboardStatsDto
        {
            TotalClients = clients.Count,
            ActiveClients = clients.Count(c => c.Status == "Active"),
            TotalRevenue = totalRevenue,
            OutstandingBalance = invoices.Where(i => i.Status == "Unpaid" || i.Status == "Overdue").Sum(i => i.GrandTotal),
            PaidInvoices = invoices.Count(i => i.Status == "Paid"),
            PendingInvoices = invoices.Count(i => i.Status == "Pending" || i.Status == "Unpaid"),
            OverdueInvoices = invoices.Count(i => i.Status == "Overdue"),
            MonthlyRevenue = currentRevenue,
            MonthlyPayments = payments.Where(p => p.Status == "Completed" && p.CreatedAt >= monthStart).Sum(p => p.Amount),
            RevenueGrowth = growth,
            Currency = "SAR"
        };
    }

    public async Task<AccountantFullDashboardDto> GetFullDashboardAsync(Guid tenantId)
    {
        var stats = await GetAccountantDashboardStatsAsync(tenantId);
        var now = DateTime.UtcNow;

        var invoices = await _context.Invoices.AsNoTracking()
            .Where(i => i.TenantId == tenantId).ToListAsync();
        var expenses = await _context.Set<Expense>().AsNoTracking()
            .Where(e => e.TenantId == tenantId && !e.IsDeleted).ToListAsync();
        var payments = await _context.Set<Payment>().AsNoTracking()
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.Status == "Completed").ToListAsync();

        var revenueChart = new List<MonthlyFinanceDto>();
        for (int i = 5; i >= 0; i--)
        {
            var m = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            revenueChart.Add(new MonthlyFinanceDto
            {
                Year = m.Year,
                Month = m.Month,
                Revenue = invoices.Where(inv => inv.Status == "Paid" && inv.CreatedAt.Year == m.Year && inv.CreatedAt.Month == m.Month).Sum(inv => inv.GrandTotal),
                Expenses = expenses.Where(e => e.CreatedAt.Year == m.Year && e.CreatedAt.Month == m.Month).Sum(e => e.Amount),
                Profit = invoices.Where(inv => inv.Status == "Paid" && inv.CreatedAt.Year == m.Year && inv.CreatedAt.Month == m.Month).Sum(inv => inv.GrandTotal)
                    - expenses.Where(e => e.CreatedAt.Year == m.Year && e.CreatedAt.Month == m.Month).Sum(e => e.Amount)
            });
        }

        var totalInv = invoices.Count;
        var invStatusDist = new List<InvoiceStatusDto>
        {
            new() { Status = "Paid", Count = invoices.Count(i => i.Status == "Paid"), Percentage = totalInv > 0 ? (decimal)Math.Round((double)invoices.Count(i => i.Status == "Paid") / totalInv * 100, 1) : 0 },
            new() { Status = "Pending", Count = invoices.Count(i => i.Status == "Pending" || i.Status == "Unpaid"), Percentage = totalInv > 0 ? (decimal)Math.Round((double)invoices.Count(i => i.Status == "Pending" || i.Status == "Unpaid") / totalInv * 100, 1) : 0 },
            new() { Status = "Overdue", Count = invoices.Count(i => i.Status == "Overdue"), Percentage = totalInv > 0 ? (decimal)Math.Round((double)invoices.Count(i => i.Status == "Overdue") / totalInv * 100, 1) : 0 },
            new() { Status = "Cancelled", Count = invoices.Count(i => i.Status == "Cancelled"), Percentage = totalInv > 0 ? (decimal)Math.Round((double)invoices.Count(i => i.Status == "Cancelled") / totalInv * 100, 1) : 0 }
        };

        var cashIn = payments.Sum(p => p.Amount);
        var cashOut = expenses.Sum(e => e.Amount);

        return new AccountantFullDashboardDto
        {
            Stats = stats,
            RevenueChart = revenueChart,
            InvoiceStatusDistribution = invStatusDist,
            CashFlow = new CashFlowSummaryDto
            {
                CashIn = cashIn,
                CashOut = cashOut,
                NetCash = cashIn - cashOut
            }
        };
    }

    private string HashPassword(string password)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}
