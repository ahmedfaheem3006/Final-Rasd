using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Tenant;

public class SystemAdminStatsDto
{
    public double CpuUsage { get; set; }
    public double RamUsageGb { get; set; }
    public double RamTotalGb { get; set; } = 16.0;
    public string CpuStatus { get; set; } = "Normal";
    public string RamStatus { get; set; } = "Stable";
    public string HealthStatus { get; set; } = "Excellent";
    public string UptimePercent { get; set; } = "99.98% Uptime";
    public int TotalCompanies { get; set; }
    public int TotalAiRequests { get; set; }
    public int ChatAiRequests { get; set; }
    public int ContractAiRequests { get; set; }
    public int MeetingAiRequests { get; set; }
    public List<SystemLogDto> RecentLogs { get; set; } = new();
}

public class SystemLogDto
{
    public string Event { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Type { get; set; } = "info"; // info, warning, error
}
