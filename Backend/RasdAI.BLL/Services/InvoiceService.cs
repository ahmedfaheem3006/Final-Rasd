using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RasdAI.BLL.DTOs.Invoice;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _context;

    static InvoiceService()
    {
        // Register QuestPDF Community License to prevent runtime exception
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public InvoiceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(Guid tenantId)
    {
        return await _context.Invoices
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId)
            .Include(i => i.Deal)
                .ThenInclude(d => d.Client)
            .Include(i => i.Contract)
            .Include(i => i.Client)
            .Select(i => new InvoiceDto
            {
                Id = i.Id,
                TenantId = i.TenantId,
                DealId = i.DealId,
                ContractId = i.ContractId,
                ContractNumber = i.Contract != null ? i.Contract.ContractNumber : null,
                ClientName = i.Client != null ? i.Client.Name : (i.Deal != null ? i.Deal.Client.Name : string.Empty),
                TotalAmount = i.TotalAmount,
                Status = i.Status,
                DueDate = i.DueDate,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto createInvoiceDto, Guid tenantId, int userId)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == createInvoiceDto.ClientId && c.TenantId == tenantId);
        if (client == null)
            throw new Exception("العميل المحدد غير موجود أو لا ينتمي لشركتك");

        Contract? contract = null;
        if (createInvoiceDto.ContractId.HasValue)
        {
            contract = await _context.Contracts.FirstOrDefaultAsync(c => c.Id == createInvoiceDto.ContractId.Value && c.TenantId == tenantId);
        }

        var invoice = new Invoice
        {
            TenantId = tenantId,
            DealId = createInvoiceDto.DealId,
            ContractId = createInvoiceDto.ContractId,
            ClientId = createInvoiceDto.ClientId,
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
            TotalAmount = createInvoiceDto.TotalAmount,
            GrandTotal = createInvoiceDto.TotalAmount,
            RemainingBalance = createInvoiceDto.Status == "Paid" ? 0 : createInvoiceDto.TotalAmount,
            PaidAmount = createInvoiceDto.Status == "Paid" ? createInvoiceDto.TotalAmount : 0,
            Status = createInvoiceDto.Status,
            DueDate = createInvoiceDto.DueDate,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId,
            Discount = 0m,
            Subtotal = createInvoiceDto.TotalAmount,
            IssueDate = DateTime.UtcNow
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return new InvoiceDto
        {
            Id = invoice.Id,
            TenantId = invoice.TenantId,
            DealId = invoice.DealId,
            ContractId = invoice.ContractId,
            ContractNumber = contract?.ContractNumber,
            ClientName = client.Name,
            TotalAmount = invoice.TotalAmount,
            Status = invoice.Status,
            DueDate = invoice.DueDate,
            CreatedAt = invoice.CreatedAt
        };
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(int invoiceId, Guid tenantId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Deal)
                .ThenInclude(d => d.Client)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == tenantId);

        if (invoice == null)
        {
            throw new Exception("الفاتورة المطلوبة غير موجودة");
        }

        // Generate PDF bytes using QuestPDF fluent design API
        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                // Header
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(column =>
                    {
                        column.Item().Text("شركة رصد للتطوير والاستشارات").Bold().FontSize(18).FontColor("#4f46e5");
                        column.Item().Text("منصة رصد الذكية لإدارة الشركات - رصد AI").FontSize(9).FontColor("#64748b");
                    });

                    row.ConstantItem(150).Column(column =>
                    {
                        column.Item().Text($"فاتورة رقم: #{invoice.Id}").Bold().FontSize(11);
                        column.Item().Text($"التاريخ: {invoice.CreatedAt:yyyy/MM/dd}").FontSize(9);
                        column.Item().Text($"تاريخ الاستحقاق: {invoice.DueDate:yyyy/MM/dd}").FontSize(9).FontColor("#ea580c");
                    });
                });

                // Content
                page.Content().PaddingVertical(1, Unit.Centimetre).Column(column =>
                {
                    column.Item().Text("تفاصيل العميل (فاتورة إلى):").Bold().FontSize(11).FontColor("#4f46e5");
                    column.Item().Text(invoice.Deal.Client.Name).Bold().FontSize(12);
                    if (!string.IsNullOrEmpty(invoice.Deal.Client.Email))
                    {
                        column.Item().Text($"البريد الإلكتروني: {invoice.Deal.Client.Email}").FontSize(10);
                    }
                    if (!string.IsNullOrEmpty(invoice.Deal.Client.Phone))
                    {
                        column.Item().Text($"رقم الهاتف: {invoice.Deal.Client.Phone}").FontSize(10);
                    }

                    column.Item().PaddingTop(20).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background("#4f46e5").Padding(6).Text("الوصف / بيان الصفقة").Bold().FontColor(Colors.White);
                            header.Cell().Background("#4f46e5").Padding(6).Text("المبلغ الإجمالي").Bold().FontColor(Colors.White);
                        });

                        table.Cell().BorderBottom(1).BorderColor("#e2e8f0").Padding(8).Text($"إجمالي قيمة خدمات الصفقة المرتبطة بـ #{invoice.DealId} (العميل: {invoice.Deal.Client.Name})");
                        table.Cell().BorderBottom(1).BorderColor("#e2e8f0").Padding(8).Text($"{invoice.TotalAmount:N2} USD");
                    });

                    column.Item().AlignRight().PaddingTop(20).Text($"المبلغ الإجمالي المستحق: {invoice.TotalAmount:N2} USD").Bold().FontSize(13).FontColor("#4f46e5");
                });

                // Footer
                page.Footer().AlignCenter().Text("نشكركم لتعاملكم معنا | تم التوليد آلياً عبر نظام رصد AI").FontSize(8).FontColor("#94a3b8");
            });
        }).GeneratePdf();

        return pdfBytes;
    }

    public async Task<bool> UpdateInvoiceStatusAsync(int invoiceId, string status, Guid tenantId)
    {
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == tenantId);

        if (invoice == null) return false;

        invoice.Status = status;
        await _context.SaveChangesAsync();
        return true;
    }
}
