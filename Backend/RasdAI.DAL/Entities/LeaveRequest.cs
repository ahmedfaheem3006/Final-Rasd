namespace RasdAI.DAL.Entities;

public class LeaveRequest : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int EmployeeId { get; set; }
    public int RoleId { get; set; }
    public string LeaveType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = "Pending";
    public int? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public User Employee { get; set; } = null!;
    public Role Role { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
}
