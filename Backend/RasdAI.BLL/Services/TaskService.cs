using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Task;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;

    public TaskService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskDto>> GetTasksAsync(Guid tenantId)
    {
        return await _context.Tasks
            .AsNoTracking()
            .Where(t => t.TenantId == tenantId)
            .Include(t => t.AssignedUser)
            .Select(t => new TaskDto
            {
                Id = t.Id,
                TenantId = t.TenantId,
                AssignedUserId = t.AssignedUserId,
                AssignedUserName = t.AssignedUser != null ? t.AssignedUser.FullName : string.Empty,
                MeetingId = t.MeetingId,
                Title = t.Title,
                Status = t.Status,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto, Guid tenantId)
    {
        var task = new TaskItem
        {
            TenantId = tenantId,
            AssignedUserId = createTaskDto.AssignedUserId,
            MeetingId = createTaskDto.MeetingId,
            Title = createTaskDto.Title,
            Status = createTaskDto.Status,
            DueDate = createTaskDto.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(createTaskDto.AssignedUserId);

        return new TaskDto
        {
            Id = task.Id,
            TenantId = task.TenantId,
            AssignedUserId = task.AssignedUserId,
            AssignedUserName = user?.FullName ?? string.Empty,
            MeetingId = task.MeetingId,
            Title = task.Title,
            Status = task.Status,
            DueDate = task.DueDate,
            CreatedAt = task.CreatedAt
        };
    }

    public async Task<bool> UpdateTaskStatusAsync(int taskId, string status, Guid tenantId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.TenantId == tenantId);

        if (task == null) return false;

        task.Status = status;
        await _context.SaveChangesAsync();
        return true;
    }
}
