using System;

namespace RasdAI.BLL.DTOs.Tenant;

public class ActivityDto
{
    public string Action { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Type { get; set; } = "info"; // info, warning, success
}
