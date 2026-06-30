using System;

namespace RasdAI.BLL.DTOs.Client;

public class ClientOverviewDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public decimal OutstandingBalance { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
}
