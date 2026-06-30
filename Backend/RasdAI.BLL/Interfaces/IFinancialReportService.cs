using System;
using System.Threading.Tasks;

namespace RasdAI.BLL.Interfaces;

public class RevenueReportDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit { get; set; }
    public decimal OutstandingAmount { get; set; }
    public decimal CollectionRate { get; set; }
    public int PaidInvoices { get; set; }
    public int PendingInvoices { get; set; }
    public int OverdueInvoices { get; set; }
    public int TotalClients { get; set; }
    public int ActiveClients { get; set; }
}

public class ProfitLossDto
{
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal NetProfit { get; set; }
    public decimal ProfitMargin { get; set; }
}

public class CashFlowDto
{
    public decimal CashIn { get; set; }
    public decimal CashOut { get; set; }
    public decimal NetCash { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal ClosingBalance { get; set; }
}

public class ClientStatementDto
{
    public int ClientId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal OutstandingBalance { get; set; }
    public int InvoiceCount { get; set; }
    public int OverdueCount { get; set; }
}

public interface IFinancialReportService
{
    Task<RevenueReportDto> GetRevenueReportAsync(Guid tenantId, DateTime? from = null, DateTime? to = null);
    Task<ProfitLossDto> GetProfitLossAsync(Guid tenantId, DateTime? from = null, DateTime? to = null);
    Task<CashFlowDto> GetCashFlowAsync(Guid tenantId, DateTime? from = null, DateTime? to = null);
    Task<ClientStatementDto> GetClientStatementAsync(int clientId, Guid tenantId);
}
