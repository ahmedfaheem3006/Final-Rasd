using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Invoice;

namespace RasdAI.BLL.Interfaces;

public interface IInvoiceService
{
    Task<List<InvoiceDto>> GetInvoicesAsync(Guid tenantId);
    Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto createInvoiceDto, Guid tenantId);
    Task<byte[]> GenerateInvoicePdfAsync(int invoiceId, Guid tenantId);
    Task<bool> UpdateInvoiceStatusAsync(int invoiceId, string status, Guid tenantId);
}
