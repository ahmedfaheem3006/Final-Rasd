using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Expense;

public class ExpenseDto
{
    public int Id { get; set; }
    public string Category { get; set; } = "Other";
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? VendorName { get; set; }
    public string Status { get; set; } = "Paid";
    public string Currency { get; set; } = "SAR";
    public DateTime ExpenseDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExpenseDto
{
    public string Category { get; set; } = "Other";
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? VendorName { get; set; }
    public string Status { get; set; } = "Paid";
    public string Currency { get; set; } = "SAR";
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
}

public class ExpenseDashboardDto
{
    public decimal TotalExpenses { get; set; }
    public int ExpenseCount { get; set; }
    public decimal MonthExpenses { get; set; }
    public List<ExpenseByCategoryDto> ByCategory { get; set; } = new();
    public List<ExpenseMonthlyDto> MonthlyTrend { get; set; } = new();
}

public class ExpenseByCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class ExpenseMonthlyDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Amount { get; set; }
}
