using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Expense;
using RasdAI.BLL.Exceptions;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class ExpenseService : IExpenseService
{
    private readonly AppDbContext _context;

    public ExpenseService(AppDbContext context) => _context = context;

    public async Task<List<ExpenseDto>> GetExpensesAsync(Guid tenantId, string? category = null, string? search = null)
    {
        var query = _context.Set<Expense>()
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId && !e.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category) && category != "All")
            query = query.Where(e => e.Category == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(e =>
                e.Description!.Contains(search) ||
                e.VendorName!.Contains(search));

        return await query.OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExpenseDto
            {
                Id = e.Id,
                Category = e.Category,
                Amount = e.Amount,
                Description = e.Description,
                VendorName = e.VendorName,
                Status = e.Status,
                Currency = e.Currency,
                ExpenseDate = e.ExpenseDate,
                CreatedAt = e.CreatedAt
            }).ToListAsync();
    }

    public async Task<ExpenseDto?> GetExpenseByIdAsync(int id, Guid tenantId)
    {
        return await _context.Set<Expense>()
            .AsNoTracking()
            .Where(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted)
            .Select(e => new ExpenseDto
            {
                Id = e.Id,
                Category = e.Category,
                Amount = e.Amount,
                Description = e.Description,
                VendorName = e.VendorName,
                Status = e.Status,
                Currency = e.Currency,
                ExpenseDate = e.ExpenseDate,
                CreatedAt = e.CreatedAt
            }).FirstOrDefaultAsync();
    }

    public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto dto, Guid tenantId, int userId)
    {
        var expense = new Expense
        {
            TenantId = tenantId,
            CreatedByUserId = userId,
            Category = dto.Category,
            Amount = dto.Amount,
            Description = dto.Description,
            VendorName = dto.VendorName,
            Status = dto.Status,
            Currency = dto.Currency,
            ExpenseDate = dto.ExpenseDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<Expense>().Add(expense);
        await _context.SaveChangesAsync();

        return new ExpenseDto
        {
            Id = expense.Id,
            Category = expense.Category,
            Amount = expense.Amount,
            Description = expense.Description,
            VendorName = expense.VendorName,
            Status = expense.Status,
            Currency = expense.Currency,
            ExpenseDate = expense.ExpenseDate,
            CreatedAt = expense.CreatedAt
        };
    }

    public async Task<ExpenseDto> UpdateExpenseAsync(int id, CreateExpenseDto dto, Guid tenantId)
    {
        var expense = await _context.Set<Expense>()
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);
        if (expense == null)
            throw new NotFoundException("المصروف غير موجود");

        expense.Category = dto.Category;
        expense.Amount = dto.Amount;
        expense.Description = dto.Description;
        expense.VendorName = dto.VendorName;
        expense.Status = dto.Status;
        expense.Currency = dto.Currency;
        expense.ExpenseDate = dto.ExpenseDate;
        expense.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ExpenseDto
        {
            Id = expense.Id,
            Category = expense.Category,
            Amount = expense.Amount,
            Description = expense.Description,
            VendorName = expense.VendorName,
            Status = expense.Status,
            Currency = expense.Currency,
            ExpenseDate = expense.ExpenseDate,
            CreatedAt = expense.CreatedAt
        };
    }

    public async Task<bool> DeleteExpenseAsync(int id, Guid tenantId)
    {
        var expense = await _context.Set<Expense>()
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);
        if (expense == null)
            throw new NotFoundException("المصروف غير موجود");
        expense.IsDeleted = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ExpenseDashboardDto> GetExpenseDashboardAsync(Guid tenantId)
    {
        var expenses = await _context.Set<Expense>()
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId && !e.IsDeleted)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var total = expenses.Sum(e => e.Amount);

        var byCategory = expenses.GroupBy(e => e.Category)
            .Select(g => new ExpenseByCategoryDto
            {
                Category = g.Key,
                Amount = g.Sum(e => e.Amount),
                Count = g.Count(),
                Percentage = total > 0 ? Math.Round(g.Sum(e => e.Amount) / total * 100, 1) : 0
            }).OrderByDescending(x => x.Amount).ToList();

        const int monthsBack = 6;
        var monthly = new List<ExpenseMonthlyDto>();
        for (int i = monthsBack - 1; i >= 0; i--)
        {
            var m = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            monthly.Add(new ExpenseMonthlyDto
            {
                Year = m.Year,
                Month = m.Month,
                Amount = expenses.Where(e => e.CreatedAt.Year == m.Year && e.CreatedAt.Month == m.Month).Sum(e => e.Amount)
            });
        }

        return new ExpenseDashboardDto
        {
            TotalExpenses = total,
            ExpenseCount = expenses.Count,
            MonthExpenses = expenses.Where(e => e.CreatedAt >= monthStart).Sum(e => e.Amount),
            ByCategory = byCategory,
            MonthlyTrend = monthly
        };
    }
}
