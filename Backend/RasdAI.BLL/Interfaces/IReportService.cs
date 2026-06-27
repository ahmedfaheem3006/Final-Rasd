using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Report;

namespace RasdAI.BLL.Interfaces;

public interface IReportService
{
    Task<List<ReportDto>> GetReportsAsync(Guid tenantId);
    Task<ReportDto> CreateReportAsync(CreateReportDto dto, Guid tenantId);
}
