using System;

namespace RasdAI.BLL.DTOs.Report;

public class ReportDto
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string SizeLabel { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateReportDto
{
    public string Category { get; set; } = string.Empty; // sales | financial | hr
    public string Title { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string SizeLabel { get; set; } = string.Empty;
}
