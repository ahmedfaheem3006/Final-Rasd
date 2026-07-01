using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RasdAI.BLL;
using RasdAI.BLL.DTOs.Task;
using RasdAI.BLL.Interfaces;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly TenantContext _tenantContext;

    public TasksController(ITaskService taskService, TenantContext tenantContext)
    {
        _taskService = taskService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks()
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var result = await _taskService.GetTasksAsync(_tenantContext.TenantId.Value);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto createTaskDto)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var result = await _taskService.CreateTaskAsync(createTaskDto, _tenantContext.TenantId.Value);
        return Ok(new { success = true, message = "تم إنشاء المهمة بنجاح", data = result });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusDto updateDto)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var success = await _taskService.UpdateTaskStatusAsync(id, updateDto.Status, _tenantContext.TenantId.Value);
        if (!success)
        {
            return NotFound(new { success = false, message = "المهمة غير موجودة أو لا تنتمي لشركتك" });
        }

        return Ok(new { success = true, message = "تم تحديث حالة المهمة بنجاح" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        if (_tenantContext.TenantId == null)
        {
            return BadRequest(new { success = false, message = "معرف الشركة غير متوفر في السياق" });
        }

        var success = await _taskService.DeleteTaskAsync(id, _tenantContext.TenantId.Value);
        if (!success)
        {
            return NotFound(new { success = false, message = "المهمة غير موجودة أو لا تنتمي لشركتك" });
        }

        return Ok(new { success = true, message = "تم حذف المهمة بنجاح" });
    }
}
