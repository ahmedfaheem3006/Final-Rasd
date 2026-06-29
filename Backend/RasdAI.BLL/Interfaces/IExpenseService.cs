using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Expense;

namespace RasdAI.BLL.Interfaces;

public interface IExpenseService
{
    Task<List<ExpenseDto>> GetExpensesAsync(Guid tenantId, string? category = null, string? search = null);
    Task<ExpenseDto?> GetExpenseByIdAsync(int id, Guid tenantId);
    Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto dto, Guid tenantId, int userId);
    Task<ExpenseDto> UpdateExpenseAsync(int id, CreateExpenseDto dto, Guid tenantId);
    Task<bool> DeleteExpenseAsync(int id, Guid tenantId);
    Task<ExpenseDashboardDto> GetExpenseDashboardAsync(Guid tenantId);
}
