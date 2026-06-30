namespace RasdAI.DAL.Entities;

public class Candidate : ITenantEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AppliedRole { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string Stage { get; set; } = "applied"; // applied | interview | test | offer | hired
    public int? JobVacancyId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public bool IsDeleted { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public JobVacancy? JobVacancy { get; set; }
}
