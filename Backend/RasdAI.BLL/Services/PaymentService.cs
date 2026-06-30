using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Payment;
using RasdAI.BLL.Exceptions;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;

    public PaymentService(AppDbContext context) => _context = context;

    public async Task<PaymentListResponseDto> GetPaymentsAsync(Guid tenantId, string? status = null, string? search = null, DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 20)
    {
        var query = _context.Set<Payment>()
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && !p.IsDeleted)
            .Include(p => p.Invoice)
            .Include(p => p.Client)
            .Include(p => p.CreatedByUser)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            var paymentStatuses = new[] { "Completed", "Failed", "Refunded" };
            if (paymentStatuses.Contains(status))
                query = query.Where(p => p.Status == status);
            else
                query = query.Where(p => p.Invoice.Status == status);
        }

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p =>
                (p.ReferenceNumber != null && p.ReferenceNumber.Contains(search)) ||
                p.Client.Name.Contains(search) ||
                (p.Client.CompanyName != null && p.Client.CompanyName.Contains(search)) ||
                p.Invoice.InvoiceNumber.Contains(search) ||
                (p.Client.Phone != null && p.Client.Phone.Contains(search)));

        if (from.HasValue)
            query = query.Where(p => p.PaymentDate >= from.Value);

        if (to.HasValue)
            query = query.Where(p => p.PaymentDate <= to.Value);

        var totalCount = await query.CountAsync();

        var items = await query.OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice.InvoiceNumber,
                ClientId = p.ClientId,
                ClientName = p.Client.Name,
                CompanyName = p.Client.CompanyName,
                Amount = p.Amount,
                RemainingBalance = p.Invoice.RemainingBalance,
                PaymentMethod = p.PaymentMethod,
                Status = p.Status,
                ReferenceNumber = p.ReferenceNumber,
                TransactionNumber = p.TransactionNumber,
                BankName = p.BankName,
                Notes = p.Notes,
                PaymentDate = p.PaymentDate,
                CreatedAt = p.CreatedAt,
                CreatedByName = p.CreatedByUser != null ? p.CreatedByUser.FullName : null
            }).ToListAsync();

        return new PaymentListResponseDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PaymentDto?> GetPaymentByIdAsync(int id, Guid tenantId)
    {
        return await _context.Set<Payment>()
            .AsNoTracking()
            .Where(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted)
            .Include(p => p.Invoice)
            .Include(p => p.Client)
            .Include(p => p.CreatedByUser)
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice.InvoiceNumber,
                ClientId = p.ClientId,
                ClientName = p.Client.Name,
                CompanyName = p.Client.CompanyName,
                Amount = p.Amount,
                RemainingBalance = p.Invoice.RemainingBalance,
                PaymentMethod = p.PaymentMethod,
                Status = p.Status,
                ReferenceNumber = p.ReferenceNumber,
                TransactionNumber = p.TransactionNumber,
                BankName = p.BankName,
                Notes = p.Notes,
                PaymentDate = p.PaymentDate,
                CreatedAt = p.CreatedAt,
                CreatedByName = p.CreatedByUser != null ? p.CreatedByUser.FullName : null
            }).FirstOrDefaultAsync();
    }

    public async Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto dto, Guid tenantId, int userId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId && i.TenantId == tenantId);

        if (invoice == null)
            throw new NotFoundException("الفاتورة غير موجودة");

        if (dto.Amount <= 0)
            throw new BadRequestException("المبلغ يجب أن يكون أكبر من صفر");

        if (dto.Amount > invoice.RemainingBalance)
            throw new BadRequestException("المبلغ يتجاوز الرصيد المتبقي للفاتورة");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var referenceNumber = dto.ReferenceNumber ?? GenerateReferenceNumber();

            var payment = new Payment
            {
                TenantId = tenantId,
                InvoiceId = dto.InvoiceId,
                ClientId = invoice.ClientId,
                CreatedByUserId = userId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                Status = dto.Status,
                ReferenceNumber = referenceNumber,
                TransactionNumber = dto.TransactionNumber,
                BankName = dto.BankName,
                Notes = dto.Notes,
                PaymentDate = dto.PaymentDate,
                CreatedAt = DateTime.UtcNow
            };

            invoice.PaidAmount += dto.Amount;
            invoice.RemainingBalance = invoice.GrandTotal - invoice.PaidAmount;

            if (invoice.RemainingBalance == 0)
                invoice.Status = "Paid";
            else
                invoice.Status = "Partial";

            if (invoice.ContractId.HasValue)
            {
                var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.Id == invoice.ContractId && c.TenantId == tenantId);
                if (contract != null)
                {
                    contract.PaidAmount += dto.Amount;
                    contract.RemainingAmount = contract.FinalAmount - contract.PaidAmount;
                }
            }

            _context.Set<Payment>().Add(payment);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return new PaymentDto
            {
                Id = payment.Id,
                InvoiceId = payment.InvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                ClientId = payment.ClientId,
                ClientName = invoice.Client.Name,
                CompanyName = invoice.Client.CompanyName,
                Amount = payment.Amount,
                RemainingBalance = invoice.RemainingBalance,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                ReferenceNumber = payment.ReferenceNumber,
                Notes = payment.Notes,
                PaymentDate = payment.PaymentDate,
                CreatedAt = payment.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<PaymentDto> UpdatePaymentAsync(int id, UpdatePaymentDto dto, Guid tenantId, int userId)
    {
        var payment = await _context.Set<Payment>()
            .Include(p => p.Invoice)
            .Include(p => p.Client)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

        if (payment == null)
            throw new NotFoundException("الدفعة غير موجودة");

        var invoice = payment.Invoice;
        var oldAmount = payment.Amount;
        var amountDiff = dto.Amount - oldAmount;

        if (dto.Amount <= 0)
            throw new BadRequestException("المبلغ يجب أن يكون أكبر من صفر");

        var newRemaining = invoice.RemainingBalance - amountDiff;
        if (newRemaining < 0)
            throw new BadRequestException("المبلغ الجديد يتجاوز الرصيد المتبقي للفاتورة");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            payment.Amount = dto.Amount;
            payment.PaymentMethod = dto.PaymentMethod;
            payment.Status = dto.Status;
            payment.ReferenceNumber = dto.ReferenceNumber;
            payment.TransactionNumber = dto.TransactionNumber;
            payment.BankName = dto.BankName;
            payment.Notes = dto.Notes;
            payment.PaymentDate = dto.PaymentDate;
            payment.UpdatedAt = DateTime.UtcNow;
            payment.UpdatedBy = userId;

            invoice.PaidAmount = invoice.PaidAmount + amountDiff;
            invoice.RemainingBalance = invoice.GrandTotal - invoice.PaidAmount;

            if (invoice.RemainingBalance == 0)
                invoice.Status = "Paid";
            else if (invoice.PaidAmount > 0)
                invoice.Status = "Partial";
            else
                invoice.Status = "Pending";

            if (invoice.ContractId.HasValue)
            {
                var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.Id == invoice.ContractId && c.TenantId == tenantId);
                if (contract != null)
                {
                    contract.PaidAmount += amountDiff;
                    contract.RemainingAmount = contract.FinalAmount - contract.PaidAmount;
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new PaymentDto
            {
                Id = payment.Id,
                InvoiceId = payment.InvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                ClientId = payment.ClientId,
                ClientName = payment.Client.Name,
                CompanyName = payment.Client.CompanyName,
                Amount = payment.Amount,
                RemainingBalance = invoice.RemainingBalance,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                ReferenceNumber = payment.ReferenceNumber,
                Notes = payment.Notes,
                PaymentDate = payment.PaymentDate,
                CreatedAt = payment.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> DeletePaymentAsync(int id, Guid tenantId)
    {
        var payment = await _context.Set<Payment>()
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

        if (payment == null)
            throw new NotFoundException("الدفعة غير موجودة");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = payment.Invoice;
            invoice.PaidAmount -= payment.Amount;
            invoice.RemainingBalance = invoice.GrandTotal - invoice.PaidAmount;

            if (invoice.RemainingBalance == invoice.GrandTotal)
                invoice.Status = "Pending";
            else if (invoice.RemainingBalance > 0)
                invoice.Status = "Partial";
            else
                invoice.Status = "Paid";

            if (invoice.ContractId.HasValue)
            {
                var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.Id == invoice.ContractId && c.TenantId == tenantId);
                if (contract != null)
                {
                    contract.PaidAmount -= payment.Amount;
                    contract.RemainingAmount = contract.FinalAmount - contract.PaidAmount;
                }
            }

            payment.IsDeleted = true;
            payment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<PaymentDashboardDto> GetPaymentDashboardAsync(Guid tenantId)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var todayStart = now.Date;

        var completedPayments = await _context.Set<Payment>()
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.Status == "Completed")
            .ToListAsync();

        var pendingInvoices = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && (i.Status == "Pending" || i.Status == "Partial"))
            .ToListAsync();

        var overdueInvoices = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.Status == "Overdue")
            .ToListAsync();

        return new PaymentDashboardDto
        {
            TotalCollected = completedPayments.Sum(p => p.Amount),
            PendingAmount = pendingInvoices.Sum(i => i.RemainingBalance),
            OverdueAmount = overdueInvoices.Sum(i => i.RemainingBalance),
            ThisMonthRevenue = completedPayments.Where(p => p.PaymentDate >= monthStart).Sum(p => p.Amount),
            TodayCollections = completedPayments.Where(p => p.PaymentDate >= todayStart).Sum(p => p.Amount),
            TotalPayments = completedPayments.Count
        };
    }

    public async Task<PaymentReceiptDto?> GetPaymentReceiptAsync(int id, Guid tenantId)
    {
        return await _context.Set<Payment>()
            .AsNoTracking()
            .Where(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted)
            .Include(p => p.Invoice)
            .Include(p => p.Client)
            .Include(p => p.CreatedByUser)
            .Include(p => p.Tenant)
            .Select(p => new PaymentReceiptDto
            {
                ReceiptNumber = p.ReferenceNumber ?? $"RCP-{p.Id:D5}",
                PaymentId = p.Id,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice.InvoiceNumber,
                ClientName = p.Client.Name,
                CompanyName = p.Client.CompanyName,
                Amount = p.Amount,
                RemainingBalance = p.Invoice.RemainingBalance,
                PaymentMethod = p.PaymentMethod,
                ReferenceNumber = p.ReferenceNumber,
                PaymentDate = p.PaymentDate,
                CreatedByName = p.CreatedByUser != null ? p.CreatedByUser.FullName : null,
                TenantName = p.Tenant.Name,
                TenantLogo = null,
                Status = p.Status
            }).FirstOrDefaultAsync();
    }

    public async Task<List<UnpaidInvoiceDto>> GetUnpaidInvoicesAsync(Guid tenantId, string? search = null)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .Include(i => i.Client)
            .Where(i => i.TenantId == tenantId && (i.Status == "Pending" || i.Status == "Partial"))
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(i =>
                i.InvoiceNumber.Contains(search) ||
                i.Client.Name.Contains(search) ||
                (i.Client.CompanyName != null && i.Client.CompanyName.Contains(search)));

        return await query.OrderByDescending(i => i.CreatedAt)
            .Select(i => new UnpaidInvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                ClientId = i.ClientId,
                ClientName = i.Client.Name,
                CompanyName = i.Client.CompanyName,
                GrandTotal = i.GrandTotal,
                PaidAmount = i.PaidAmount,
                RemainingBalance = i.RemainingBalance,
                DueDate = i.DueDate,
                Status = i.Status,
                Currency = i.Currency
            }).ToListAsync();
    }

    public async Task<List<string>> GetPaymentMethodsAsync()
    {
        return await Task.FromResult(new List<string>
        {
            "Cash", "Bank Transfer", "Credit Card", "Cheque", "Wallet"
        });
    }

    private string GenerateReferenceNumber()
    {
        return $"PAY-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";
    }
}
