using System;

namespace RasdAI.BLL.DTOs.Tenant;

public class TenantPermissionsDto
{
    public bool IsCrmEnabled { get; set; }
    public bool IsInvoicesEnabled { get; set; }
    public bool IsTasksEnabled { get; set; }
    public bool IsMeetingsEnabled { get; set; }
    public bool IsAiEnabled { get; set; }
}
