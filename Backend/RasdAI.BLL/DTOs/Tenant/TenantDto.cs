using System;

namespace RasdAI.BLL.DTOs.Tenant;

public class TenantDto
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
    public decimal Price { get; set; }
    public int AiLimit { get; set; }
    public int MaxUsers { get; set; }
    public int CurrentUserCount { get; set; }

    // Owner Details
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerStatus { get; set; } = string.Empty;

    // Additional Registration Fields
    public string? Address { get; set; }
    public string? Phone { get; set; }

    // Feature Toggles
    public bool IsCrmEnabled { get; set; } = true;
    public bool IsInvoicesEnabled { get; set; } = true;
    public bool IsTasksEnabled { get; set; } = true;
    public bool IsMeetingsEnabled { get; set; } = true;
    public bool IsAiEnabled { get; set; } = true;

    public int AiUsageCount { get; set; }
    public System.Collections.Generic.List<ActivityDto> RecentActivities { get; set; } = new();
}
