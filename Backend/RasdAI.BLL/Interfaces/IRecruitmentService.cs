using RasdAI.BLL.DTOs.Recruitment;

namespace RasdAI.BLL.Interfaces;

public interface IRecruitmentService
{
    // Job Vacancies
    Task<List<JobVacancyDto>> GetJobVacanciesAsync(Guid tenantId);
    Task<JobVacancyDto?> GetJobVacancyByIdAsync(int id, Guid tenantId);
    Task<JobVacancyDto> CreateJobVacancyAsync(CreateJobVacancyDto dto, Guid tenantId, int userId);
    Task<JobVacancyDto?> UpdateJobVacancyAsync(int id, UpdateJobVacancyDto dto, Guid tenantId);
    Task<bool> DeleteJobVacancyAsync(int id, Guid tenantId);
    Task<JobVacancyDto?> ToggleJobStatusAsync(int id, Guid tenantId);

    // Candidates
    Task<List<CandidateDto>> GetCandidatesAsync(Guid tenantId);
    Task<CandidateDto?> GetCandidateByIdAsync(int id, Guid tenantId);
    Task<CandidateDto> CreateCandidateAsync(CreateCandidateDto dto, Guid tenantId, int userId);
    Task<CandidateDto?> MoveCandidateAsync(int id, MoveCandidateDto dto, Guid tenantId);
    Task<bool> DeleteCandidateAsync(int id, Guid tenantId);
}
