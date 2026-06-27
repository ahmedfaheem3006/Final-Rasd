using System;

namespace RasdAI.BLL.DTOs.Deal;

public class DealDto
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int? AssignedUserId { get; set; }
    public string AssignedUserName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
