using System;

namespace RasdAI.DAL.Entities;

public class Attendance : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int UserId { get; set; }
    public DateTime Date { get; set; }
    public string? CheckInTime { get; set; }
    public string? CheckOutTime { get; set; }
    public string Status { get; set; } = "Present"; // Present, Late, Absent, Remote
    public double HoursWorked { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public User User { get; set; } = null!;
}
