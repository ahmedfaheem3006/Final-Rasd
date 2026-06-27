namespace RasdAI.DAL.Entities;

public class JobVacancy : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int ApplicantsCount { get; set; }
    public string Status { get; set; } = "Open"; // Open | Closed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public bool IsDeleted { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
