using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Report;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReportDto>> GetReportsAsync(Guid tenantId)
    {
        return await _context.Reports
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReportDto
            {
                Id = r.Id,
                TenantId = r.TenantId,
                Category = r.Category,
                Title = r.Title,
                Period = r.Period,
                SizeLabel = r.SizeLabel,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ReportDto> CreateReportAsync(CreateReportDto dto, Guid tenantId)
    {
        var report = new Report
        {
            TenantId = tenantId,
            Category = dto.Category,
            Title = dto.Title,
            Period = dto.Period,
            SizeLabel = dto.SizeLabel,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        return new ReportDto
        {
            Id = report.Id,
            TenantId = report.TenantId,
            Category = report.Category,
            Title = report.Title,
            Period = report.Period,
            SizeLabel = report.SizeLabel,
            CreatedAt = report.CreatedAt
        };
    }
}
