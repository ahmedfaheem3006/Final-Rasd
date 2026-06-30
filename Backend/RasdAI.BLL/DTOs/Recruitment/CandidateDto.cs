namespace RasdAI.BLL.DTOs.Recruitment;

public class CandidateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AppliedRole { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Stage { get; set; } = "applied";
    public int? JobVacancyId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCandidateDto
{
    public string Name { get; set; } = string.Empty;
    public string AppliedRole { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string Stage { get; set; } = "applied";
    public int? JobVacancyId { get; set; }
}

public class UpdateCandidateDto
{
    public string? Name { get; set; }
    public string? AppliedRole { get; set; }
    public int? Rating { get; set; }
    public string? Stage { get; set; }
}

public class MoveCandidateDto
{
    public string Stage { get; set; } = string.Empty;
}
