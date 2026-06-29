using System;

namespace RasdAI.DAL.Entities;

public class SupportIssue
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string IssueDescription { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public string AiActionDetails { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium"; // Critical, High, Medium, Low
}
