using System;

namespace RasdAI.BLL.DTOs.Accountant;

public class AccountantDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public string? AvatarInitials { get; set; }
}
