using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Recruitment;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class RecruitmentService : IRecruitmentService
{
    private readonly AppDbContext _context;

    public RecruitmentService(AppDbContext context)
    {
        _context = context;
    }

    // ───── Job Vacancies ─────

    public async Task<List<JobVacancyDto>> GetJobVacanciesAsync(Guid tenantId)
    {
        return await _context.JobVacancies
            .AsNoTracking()
            .Where(j => j.TenantId == tenantId && !j.IsDeleted)
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new JobVacancyDto
            {
                Id = j.Id,
                Title = j.Title,
                Department = j.Department,
                ApplicantsCount = _context.Candidates.Count(c => c.JobVacancyId == j.Id && !c.IsDeleted && c.TenantId == tenantId),
                Status = j.Status,
                CreatedAt = j.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<JobVacancyDto?> GetJobVacancyByIdAsync(int id, Guid tenantId)
    {
        var job = await _context.JobVacancies
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId && !j.IsDeleted);

        if (job == null) return null;

        return new JobVacancyDto
        {
            Id = job.Id,
            Title = job.Title,
            Department = job.Department,
            ApplicantsCount = await _context.Candidates.CountAsync(c => c.JobVacancyId == job.Id && !c.IsDeleted && c.TenantId == tenantId),
            Status = job.Status,
            CreatedAt = job.CreatedAt
        };
    }

    public async Task<JobVacancyDto> CreateJobVacancyAsync(CreateJobVacancyDto dto, Guid tenantId, int userId)
    {
        var entity = new JobVacancy
        {
            TenantId = tenantId,
            Title = dto.Title,
            Department = dto.Department,
            Status = "Open",
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.JobVacancies.Add(entity);
        await _context.SaveChangesAsync();

        return new JobVacancyDto
        {
            Id = entity.Id,
            Title = entity.Title,
            Department = entity.Department,
            ApplicantsCount = 0,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };
    }

    public async Task<JobVacancyDto?> UpdateJobVacancyAsync(int id, UpdateJobVacancyDto dto, Guid tenantId)
    {
        var entity = await _context.JobVacancies
            .FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId && !j.IsDeleted);

        if (entity == null) return null;

        if (dto.Title != null) entity.Title = dto.Title;
        if (dto.Department != null) entity.Department = dto.Department;
        if (dto.Status != null) entity.Status = dto.Status;

        await _context.SaveChangesAsync();

        return new JobVacancyDto
        {
            Id = entity.Id,
            Title = entity.Title,
            Department = entity.Department,
            ApplicantsCount = await _context.Candidates.CountAsync(c => c.JobVacancyId == entity.Id && !c.IsDeleted && c.TenantId == tenantId),
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };
    }

    public async Task<bool> DeleteJobVacancyAsync(int id, Guid tenantId)
    {
        var entity = await _context.JobVacancies
            .FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId && !j.IsDeleted);

        if (entity == null) return false;

        entity.IsDeleted = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<JobVacancyDto?> ToggleJobStatusAsync(int id, Guid tenantId)
    {
        var entity = await _context.JobVacancies
            .FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId && !j.IsDeleted);

        if (entity == null) return null;

        entity.Status = entity.Status == "Open" ? "Closed" : "Open";
        await _context.SaveChangesAsync();

        return new JobVacancyDto
        {
            Id = entity.Id,
            Title = entity.Title,
            Department = entity.Department,
            ApplicantsCount = await _context.Candidates.CountAsync(c => c.JobVacancyId == entity.Id && !c.IsDeleted && c.TenantId == tenantId),
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };
    }

    // ───── Candidates ─────

    public async Task<List<CandidateDto>> GetCandidatesAsync(Guid tenantId)
    {
        return await _context.Candidates
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CandidateDto
            {
                Id = c.Id,
                Name = c.Name,
                AppliedRole = c.AppliedRole,
                Rating = c.Rating,
                Stage = c.Stage,
                JobVacancyId = c.JobVacancyId,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<CandidateDto?> GetCandidateByIdAsync(int id, Guid tenantId)
    {
        var c = await _context.Candidates
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId && !x.IsDeleted);

        if (c == null) return null;

        return new CandidateDto
        {
            Id = c.Id,
            Name = c.Name,
            AppliedRole = c.AppliedRole,
            Rating = c.Rating,
            Stage = c.Stage,
            JobVacancyId = c.JobVacancyId,
            CreatedAt = c.CreatedAt
        };
    }

    public async Task<CandidateDto> CreateCandidateAsync(CreateCandidateDto dto, Guid tenantId, int userId)
    {
        // Try to find matching job vacancy
        int? jobVacancyId = dto.JobVacancyId;
        if (jobVacancyId == null)
        {
            var matchingJob = await _context.JobVacancies
                .FirstOrDefaultAsync(j => j.Title.ToLower() == dto.AppliedRole.ToLower() && j.TenantId == tenantId && !j.IsDeleted);
            jobVacancyId = matchingJob?.Id;
        }

        var entity = new Candidate
        {
            TenantId = tenantId,
            Name = dto.Name,
            AppliedRole = dto.AppliedRole,
            Rating = dto.Rating,
            Stage = dto.Stage,
            JobVacancyId = jobVacancyId,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Candidates.Add(entity);
        await _context.SaveChangesAsync();

        return new CandidateDto
        {
            Id = entity.Id,
            Name = entity.Name,
            AppliedRole = entity.AppliedRole,
            Rating = entity.Rating,
            Stage = entity.Stage,
            JobVacancyId = entity.JobVacancyId,
            CreatedAt = entity.CreatedAt
        };
    }

    public async Task<CandidateDto?> MoveCandidateAsync(int id, MoveCandidateDto dto, Guid tenantId)
    {
        var validStages = new[] { "applied", "interview", "test", "offer", "hired" };
        if (!validStages.Contains(dto.Stage))
            return null;

        var entity = await _context.Candidates
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

        if (entity == null) return null;

        entity.Stage = dto.Stage;
        await _context.SaveChangesAsync();

        return new CandidateDto
        {
            Id = entity.Id,
            Name = entity.Name,
            AppliedRole = entity.AppliedRole,
            Rating = entity.Rating,
            Stage = entity.Stage,
            JobVacancyId = entity.JobVacancyId,
            CreatedAt = entity.CreatedAt
        };
    }

    public async Task<bool> DeleteCandidateAsync(int id, Guid tenantId)
    {
        var entity = await _context.Candidates
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

        if (entity == null) return false;

        entity.IsDeleted = true;
        await _context.SaveChangesAsync();
        return true;
    }
}
