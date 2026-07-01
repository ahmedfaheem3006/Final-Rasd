using System;

namespace RasdAI.BLL.DTOs.Auth;

public class UserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public int? ManagerId { get; set; }
    public string Status { get; set; } = "Active";
    public string? PhoneNumber { get; set; }
    public DateTime? ContractStart { get; set; }
    public DateTime? ContractEnd { get; set; }
    public decimal Salary { get; set; }
    public decimal Allowances { get; set; }
}

public class UpdateUserHRProfileDto
{
    public string? PhoneNumber { get; set; }
    public DateTime? ContractStart { get; set; }
    public DateTime? ContractEnd { get; set; }
    public decimal? Salary { get; set; }
    public decimal? Allowances { get; set; }
}
