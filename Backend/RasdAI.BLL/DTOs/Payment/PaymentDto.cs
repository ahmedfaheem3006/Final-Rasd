using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Payment;

public class PaymentDto
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public decimal Amount { get; set; }
    public decimal RemainingBalance { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string Status { get; set; } = "Completed";
    public string? ReferenceNumber { get; set; }
    public string? TransactionNumber { get; set; }
    public string? BankName { get; set; }
    public string? Notes { get; set; }
    public DateTime PaymentDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public List<PaymentAuditLogDto> AuditLogs { get; set; } = new();
}

public class CreatePaymentDto
{
    public int InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string Status { get; set; } = "Completed";
    public string? ReferenceNumber { get; set; }
    public string? TransactionNumber { get; set; }
    public string? BankName { get; set; }
    public string? Notes { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
}

public class UpdatePaymentDto
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string Status { get; set; } = "Completed";
    public string? ReferenceNumber { get; set; }
    public string? TransactionNumber { get; set; }
    public string? BankName { get; set; }
    public string? Notes { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
}

public class PaymentDashboardDto
{
    public decimal TotalCollected { get; set; }
    public decimal PendingAmount { get; set; }
    public decimal OverdueAmount { get; set; }
    public decimal ThisMonthRevenue { get; set; }
    public decimal TodayCollections { get; set; }
    public int TotalPayments { get; set; }
}

public class PaymentReceiptDto
{
    public string ReceiptNumber { get; set; } = string.Empty;
    public int PaymentId { get; set; }
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public decimal Amount { get; set; }
    public decimal RemainingBalance { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? CreatedByName { get; set; }
    public string? TenantName { get; set; }
    public string? TenantLogo { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class PaymentAuditLogDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public DateTime Timestamp { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
}

public class PaymentListResponseDto
{
    public List<PaymentDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class UnpaidInvoiceDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingBalance { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Currency { get; set; } = "SAR";
}
