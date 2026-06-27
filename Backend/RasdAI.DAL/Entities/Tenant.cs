using System;
using System.Collections.Generic;

namespace RasdAI.DAL.Entities;

public class Tenant
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public decimal Price { get; set; } = 0.0m;
    public int AiLimit { get; set; } = 100;

    // Feature toggles for Tenant Access Control
    public bool IsCrmEnabled { get; set; } = true;
    public bool IsInvoicesEnabled { get; set; } = true;
    public bool IsTasksEnabled { get; set; } = true;
    public bool IsMeetingsEnabled { get; set; } = true;
    public bool IsAiEnabled { get; set; } = true;

    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Client> Clients { get; set; } = new List<Client>();
    public ICollection<Deal> Deals { get; set; } = new List<Deal>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
