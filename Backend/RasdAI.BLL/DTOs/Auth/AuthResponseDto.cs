using System;

namespace RasdAI.BLL.DTOs.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string CompanyName { get; set; } = string.Empty;

    // Tenant Permissions
    public bool IsCrmEnabled { get; set; } = true;
    public bool IsInvoicesEnabled { get; set; } = true;
    public bool IsTasksEnabled { get; set; } = true;
    public bool IsMeetingsEnabled { get; set; } = true;
    public bool IsAiEnabled { get; set; } = true;
}
