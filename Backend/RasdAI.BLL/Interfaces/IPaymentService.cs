using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Payment;

namespace RasdAI.BLL.Interfaces;

public interface IPaymentService
{
    Task<PaymentListResponseDto> GetPaymentsAsync(Guid tenantId, string? status = null, string? search = null, DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 20);
    Task<PaymentDto?> GetPaymentByIdAsync(int id, Guid tenantId);
    Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto dto, Guid tenantId, int userId);
    Task<PaymentDto> UpdatePaymentAsync(int id, UpdatePaymentDto dto, Guid tenantId, int userId);
    Task<bool> DeletePaymentAsync(int id, Guid tenantId);
    Task<PaymentDashboardDto> GetPaymentDashboardAsync(Guid tenantId);
    Task<PaymentReceiptDto?> GetPaymentReceiptAsync(int id, Guid tenantId);
    Task<List<UnpaidInvoiceDto>> GetUnpaidInvoicesAsync(Guid tenantId, string? search = null);
    Task<List<string>> GetPaymentMethodsAsync();
}
