using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Expense;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly TenantContext _tenantContext;

    public ExpensesController(IExpenseService expenseService, TenantContext tenantContext)
    {
        _expenseService = expenseService;
        _tenantContext = tenantContext;
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet]
    public async Task<IActionResult> GetExpenses([FromQuery] string? category, [FromQuery] string? search)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _expenseService.GetExpensesAsync(_tenantContext.TenantId.Value, category, search);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _expenseService.GetExpenseByIdAsync(id, _tenantContext.TenantId.Value);
        if (result == null) return NotFound(new { success = false, message = "المصروف غير موجود" });
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        var result = await _expenseService.GetExpenseDashboardAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
    {
        if (_tenantContext.TenantId == null || _tenantContext.UserId == null)
            return BadRequest(new { success = false, message = "بيانات السياق غير مكتملة" });
        try
        {
            var result = await _expenseService.CreateExpenseAsync(dto, _tenantContext.TenantId.Value, _tenantContext.UserId.Value);
            return Ok(new { success = true, message = "تم إضافة المصروف بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExpense(int id, [FromBody] CreateExpenseDto dto)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        try
        {
            var result = await _expenseService.UpdateExpenseAsync(id, dto, _tenantContext.TenantId.Value);
            return Ok(new { success = true, message = "تم تحديث المصروف بنجاح", data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [Authorize(Roles = "Accountant,Owner")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        if (_tenantContext.TenantId == null)
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر" });
        try
        {
            await _expenseService.DeleteExpenseAsync(id, _tenantContext.TenantId.Value);
            return Ok(new { success = true, message = "تم حذف المصروف بنجاح" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
