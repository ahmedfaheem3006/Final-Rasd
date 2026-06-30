using System;

namespace RasdAI.BLL.DTOs.Invoice;

public class InvoiceDto
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int? DealId { get; set; }
    public string? DealName { get; set; }
    public int? ContractId { get; set; }
    public string? ContractNumber { get; set; }
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
