namespace RasdAI.BLL.DTOs.Recruitment;

public class JobVacancyDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int ApplicantsCount { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; }
}

public class CreateJobVacancyDto
{
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
}

public class UpdateJobVacancyDto
{
    public string? Title { get; set; }
    public string? Department { get; set; }
    public string? Status { get; set; }
}
