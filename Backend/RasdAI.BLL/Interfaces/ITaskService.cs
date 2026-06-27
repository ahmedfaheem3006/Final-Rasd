using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Task;

namespace RasdAI.BLL.Interfaces;

public interface ITaskService
{
    Task<List<TaskDto>> GetTasksAsync(Guid tenantId);
    Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto, Guid tenantId);
    Task<bool> UpdateTaskStatusAsync(int taskId, string status, Guid tenantId);
}
