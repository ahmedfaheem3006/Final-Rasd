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

    // Owner Details
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;

    // Feature Toggles
    public bool IsCrmEnabled { get; set; } = true;
    public bool IsInvoicesEnabled { get; set; } = true;
    public bool IsTasksEnabled { get; set; } = true;
    public bool IsMeetingsEnabled { get; set; } = true;
    public bool IsAiEnabled { get; set; } = true;

    public int AiUsageCount { get; set; }
    public System.Collections.Generic.List<ActivityDto> RecentActivities { get; set; } = new();
}
