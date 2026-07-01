using System;
using System.Collections.Generic;

namespace RasdAI.DAL.Entities;

public class User : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int RoleId { get; set; }
    public int? ManagerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? OtpCode { get; set; }
    public DateTime? OtpExpiryTime { get; set; }
    public string? PhoneNumber { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ContractStart { get; set; }
    public DateTime? ContractEnd { get; set; }
    public decimal Salary { get; set; } = 0;
    public decimal Allowances { get; set; } = 0;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public Role Role { get; set; } = null!;
    public User? Manager { get; set; }
    public ICollection<User> Reportees { get; set; } = new List<User>();

    public ICollection<Client> ClientsCreated { get; set; } = new List<Client>();
    public ICollection<Deal> AssignedDeals { get; set; } = new List<Deal>();
    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
    public ICollection<Note> NotesCreated { get; set; } = new List<Note>();
}
