using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Dashboard;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;

namespace RasdAI.BLL.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(Guid tenantId)
    {
        // 1. Total Sales — aggregate at DB level: sum of won deals
        var totalSales = await _context.Deals
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId && d.Status == "Won")
            .SumAsync(d => (decimal?)d.Amount) ?? 0m;

        // 2. Outstanding Invoices — sum of unpaid/pending invoices
        var outstandingInvoices = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.Status != "Paid")
            .SumAsync(i => (decimal?)i.TotalAmount) ?? 0m;

        // 3. Sales by Month — DB-level GROUP BY for won deals
        var salesByMonth = await _context.Deals
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId && d.Status == "Won")
            .GroupBy(d => new { d.CreatedAt.Year, d.CreatedAt.Month })
            .Select(g => new MonthlyDataDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Total = g.Sum(d => d.Amount)
            })
            .ToListAsync();

        // 4. Invoices by Month — DB-level GROUP BY for paid invoices (revenue comparison)
        var invoicesByMonth = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.Status == "Paid")
            .GroupBy(i => new { i.CreatedAt.Year, i.CreatedAt.Month })
            .Select(g => new MonthlyDataDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Total = g.Sum(i => i.TotalAmount)
            })
            .ToListAsync();

        // 5. Growth Percentage — compare last 2 months combined (sales + invoices)
        var growth = CalculateGrowth(salesByMonth, invoicesByMonth);

        return new DashboardStatsDto
        {
            TotalSales = totalSales,
            OutstandingInvoices = outstandingInvoices,
            GrowthPercentage = growth,
            SalesByMonth = salesByMonth,
            InvoicesByMonth = invoicesByMonth
        };
    }

    private static decimal CalculateGrowth(
        System.Collections.Generic.List<MonthlyDataDto> sales,
        System.Collections.Generic.List<MonthlyDataDto> invoices)
    {
        var now = DateTime.UtcNow;
        var currentMonth = new { now.Year, now.Month };
        var prevMonth = new { Year = now.AddMonths(-1).Year, Month = now.AddMonths(-1).Month };

        decimal currTotal = 0, prevTotal = 0;

        foreach (var s in sales)
        {
            if (s.Year == currentMonth.Year && s.Month == currentMonth.Month) currTotal += s.Total;
            if (s.Year == prevMonth.Year && s.Month == prevMonth.Month) prevTotal += s.Total;
        }
        foreach (var i in invoices)
        {
            if (i.Year == currentMonth.Year && i.Month == currentMonth.Month) currTotal += i.Total;
            if (i.Year == prevMonth.Year && i.Month == prevMonth.Month) prevTotal += i.Total;
        }

        if (prevTotal > 0) return Math.Round((currTotal - prevTotal) / prevTotal * 100m, 1);
        return currTotal > 0 ? 100m : 0m;
    }
}
