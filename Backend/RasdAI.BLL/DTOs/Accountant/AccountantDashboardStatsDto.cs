using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Accountant;

public class AccountantDashboardStatsDto
{
    public int TotalClients { get; set; }
    public int ActiveClients { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal OutstandingBalance { get; set; }
    public int PaidInvoices { get; set; }
    public int PendingInvoices { get; set; }
    public int OverdueInvoices { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public decimal MonthlyPayments { get; set; }
    public decimal RevenueGrowth { get; set; }
    public string Currency { get; set; } = "SAR";
}

public class AccountantFullDashboardDto
{
    public AccountantDashboardStatsDto Stats { get; set; } = new();
    public List<MonthlyFinanceDto> RevenueChart { get; set; } = new();
    public List<InvoiceStatusDto> InvoiceStatusDistribution { get; set; } = new();
    public CashFlowSummaryDto CashFlow { get; set; } = new();
}

public class MonthlyFinanceDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
    public decimal Profit { get; set; }
}

public class InvoiceStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class CashFlowSummaryDto
{
    public decimal CashIn { get; set; }
    public decimal CashOut { get; set; }
    public decimal NetCash { get; set; }
}
