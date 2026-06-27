using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Dashboard;

public class DashboardStatsDto
{
    public decimal TotalSales { get; set; }
    public decimal OutstandingInvoices { get; set; }
    public decimal GrowthPercentage { get; set; }
    public List<MonthlyDataDto> SalesByMonth { get; set; } = new();
    public List<MonthlyDataDto> InvoicesByMonth { get; set; } = new();
}

public class MonthlyDataDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Total { get; set; }
}
