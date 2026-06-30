using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;

namespace RasdAI.BLL.Services;

public class FinancialReportService : IFinancialReportService
{
    private readonly AppDbContext _context;

    public FinancialReportService(AppDbContext context) => _context = context;

    public async Task<RevenueReportDto> GetRevenueReportAsync(Guid tenantId, DateTime? from = null, DateTime? to = null)
    {
        var invoices = _context.Invoices.AsNoTracking().Where(i => i.TenantId == tenantId);
        var expenses = _context.Set<RasdAI.DAL.Entities.Expense>().AsNoTracking().Where(e => e.TenantId == tenantId && !e.IsDeleted);
        var clients = _context.Clients.AsNoTracking().Where(c => c.TenantId == tenantId);

        if (from.HasValue) { invoices = invoices.Where(i => i.CreatedAt >= from); expenses = expenses.Where(e => e.CreatedAt >= from); }
        if (to.HasValue) { invoices = invoices.Where(i => i.CreatedAt <= to); expenses = expenses.Where(e => e.CreatedAt <= to); }

        var invoiceList = await invoices.ToListAsync();
        var expenseTotal = await expenses.SumAsync(e => e.Amount);
        var clientCount = await clients.CountAsync();
        var activeClients = await clients.CountAsync(c => c.Status == "Active");

        var totalRevenue = invoiceList.Where(i => i.Status == "Paid").Sum(i => i.GrandTotal);
        var outstanding = invoiceList.Where(i => i.Status == "Unpaid" || i.Status == "Overdue").Sum(i => i.GrandTotal);

        return new RevenueReportDto
        {
            TotalRevenue = totalRevenue,
            TotalExpenses = expenseTotal,
            NetProfit = totalRevenue - expenseTotal,
            OutstandingAmount = outstanding,
            CollectionRate = (totalRevenue + outstanding) > 0 ? Math.Round(totalRevenue / (totalRevenue + outstanding) * 100, 1) : 0,
            PaidInvoices = invoiceList.Count(i => i.Status == "Paid"),
            PendingInvoices = invoiceList.Count(i => i.Status == "Pending" || i.Status == "Unpaid"),
            OverdueInvoices = invoiceList.Count(i => i.Status == "Overdue"),
            TotalClients = clientCount,
            ActiveClients = activeClients
        };
    }

    public async Task<ProfitLossDto> GetProfitLossAsync(Guid tenantId, DateTime? from = null, DateTime? to = null)
    {
        var invoices = _context.Invoices.AsNoTracking().Where(i => i.TenantId == tenantId && i.Status == "Paid");
        var expenses = _context.Set<RasdAI.DAL.Entities.Expense>().AsNoTracking().Where(e => e.TenantId == tenantId && !e.IsDeleted);

        if (from.HasValue) { invoices = invoices.Where(i => i.CreatedAt >= from); expenses = expenses.Where(e => e.CreatedAt >= from); }
        if (to.HasValue) { invoices = invoices.Where(i => i.CreatedAt <= to); expenses = expenses.Where(e => e.CreatedAt <= to); }

        var revenue = await invoices.SumAsync(i => i.GrandTotal);
        var expTotal = await expenses.SumAsync(e => e.Amount);
        var gross = revenue - expTotal;

        return new ProfitLossDto
        {
            Revenue = revenue,
            Expenses = expTotal,
            GrossProfit = gross,
            NetProfit = gross,
            ProfitMargin = revenue > 0 ? Math.Round(gross / revenue * 100, 1) : 0
        };
    }

    public async Task<CashFlowDto> GetCashFlowAsync(Guid tenantId, DateTime? from = null, DateTime? to = null)
    {
        var payments = _context.Set<RasdAI.DAL.Entities.Payment>().AsNoTracking()
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.Status == "Completed");
        var expenses = _context.Set<RasdAI.DAL.Entities.Expense>().AsNoTracking()
            .Where(e => e.TenantId == tenantId && !e.IsDeleted);

        if (from.HasValue) { payments = payments.Where(p => p.CreatedAt >= from); expenses = expenses.Where(e => e.CreatedAt >= from); }
        if (to.HasValue) { payments = payments.Where(p => p.CreatedAt <= to); expenses = expenses.Where(e => e.CreatedAt <= to); }

        var cashIn = await payments.SumAsync(p => p.Amount);
        var cashOut = await expenses.SumAsync(e => e.Amount);

        return new CashFlowDto
        {
            CashIn = cashIn,
            CashOut = cashOut,
            NetCash = cashIn - cashOut,
            OpeningBalance = 0,
            ClosingBalance = cashIn - cashOut
        };
    }

    public async Task<ClientStatementDto> GetClientStatementAsync(int clientId, Guid tenantId)
    {
        var client = await _context.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clientId && c.TenantId == tenantId);
        if (client == null) return new ClientStatementDto();

        var invoices = await _context.Invoices.AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.ClientId == clientId)
            .ToListAsync();

        return new ClientStatementDto
        {
            ClientId = client.Id,
            CompanyName = client.CompanyName ?? client.Name,
            TotalInvoiced = invoices.Sum(i => i.GrandTotal),
            TotalPaid = invoices.Where(i => i.Status == "Paid").Sum(i => i.GrandTotal),
            OutstandingBalance = invoices.Where(i => i.Status == "Unpaid" || i.Status == "Overdue").Sum(i => i.GrandTotal),
            InvoiceCount = invoices.Count,
            OverdueCount = invoices.Count(i => i.Status == "Overdue")
        };
    }
}
