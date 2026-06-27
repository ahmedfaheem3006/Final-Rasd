// ═══════════════════════════════════════════════════════════════
// RASD AI — Professional Invoice PDF Generator Service
// Multi-theme + Print-to-PDF + WhatsApp Share
// ═══════════════════════════════════════════════════════════════
import { Injectable, inject } from '@angular/core';
import { I18nService } from './i18n.service';

// ── Interfaces ──
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  id: number | string;
  invoiceNumber?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  totalAmount: number;
  paidAmount?: number;
  status: string;
  dueDate: string;
  createdAt: string;
  items: InvoiceItem[];
  taxRate?: number;
  notes?: string;
  paymentMethod?: string;
}

export type InvoiceTheme = 'rasd' | 'modern' | 'classic' | 'minimal';

// ── Helpers ──
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(raw: string | undefined | null, isAr: boolean): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw).slice(0, 10);
    return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(raw).slice(0, 10);
  }
}

function computeTotals(invoice: InvoiceData) {
  const taxRate = invoice.taxRate ?? 15;
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const paid = invoice.paidAmount ?? 0;
  const remaining = total - paid;
  return { subtotal, tax, total, paid, remaining, taxRate };
}

// ═══════════════════════════════════════════════════════════════
// THEME-BASED HTML GENERATORS
// ═══════════════════════════════════════════════════════════════

function generateRasdTheme(
  inv: InvoiceData,
  items: InvoiceItem[],
  totals: ReturnType<typeof computeTotals>,
  isAr: boolean
): string {
  return `
    <div style="background:linear-gradient(135deg,#4318ff 0%,#868cff 100%);height:6px;width:100%"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:24px 32px 18px;border-bottom:2px solid #e2e8f0">
      <div>
        <div style="font-size:30px;font-weight:900;background:linear-gradient(135deg,#4318ff,#868cff);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${isAr ? 'فاتورة' : 'INVOICE'}</div>
        <div style="font-size:12px;color:#4318ff;font-weight:700;letter-spacing:1.5px;margin-top:2px">${isAr ? 'RASD AI PLATFORM' : 'رصد للذكاء الاصطناعي'}</div>
      </div>
      <div style="text-align:${isAr ? 'left' : 'right'};display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div style="font-size:28px;font-weight:900;font-family:'Cairo',sans-serif;letter-spacing:-0.5px">
          <span style="color:#4318ff">RA</span><span style="color:#0b1437">SD</span>
          <span style="color:#868cff;font-size:14px;font-weight:600;margin-right:4px">AI</span>
        </div>
        <div style="font-size:11px;color:#444;text-align:right;line-height:1.6">
          <div style="font-weight:800;font-size:12px;color:#0b1437">${isAr ? 'شركة رصد للحلول المتكاملة' : 'RASD Integrated Solutions'}</div>
          <div>${isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</div>
          <div class="en" style="color:#4318ff">support@rasd-ai.com</div>
        </div>
      </div>
    </div>
    ${generateCommonBody(inv, items, totals, isAr, '#4318ff')}
    ${generateFooter(isAr, '#4318ff')}
  `;
}

function generateModernTheme(
  inv: InvoiceData,
  items: InvoiceItem[],
  totals: ReturnType<typeof computeTotals>,
  isAr: boolean
): string {
  return `
    <div style="background:linear-gradient(to right,#4f46e5,#7c3aed);height:8px;width:100%"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:24px 32px 20px;border-bottom:2px solid #e0e7ff">
      <div>
        <div style="font-size:30px;font-weight:900;background:linear-gradient(to right,#4f46e5,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${isAr ? 'فاتورة' : 'INVOICE'}</div>
        <div class="en" style="font-size:11px;color:#6366f1;font-weight:700;letter-spacing:2px;text-transform:uppercase">${isAr ? 'INVOICE' : 'فاتورة'}</div>
      </div>
      <div style="text-align:${isAr ? 'left' : 'right'};font-size:11px;color:#444;line-height:1.6">
        <div style="font-weight:800;font-size:13px;color:#4f46e5">${isAr ? 'رصد للحلول الذكية' : 'RASD Smart Solutions'}</div>
        <div>${isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</div>
        <div style="color:#6366f1">support@rasd-ai.com</div>
      </div>
    </div>
    ${generateCommonBody(inv, items, totals, isAr, '#4f46e5')}
    ${generateFooter(isAr, '#4f46e5')}
  `;
}

function generateClassicTheme(
  inv: InvoiceData,
  items: InvoiceItem[],
  totals: ReturnType<typeof computeTotals>,
  isAr: boolean
): string {
  return `
    <div style="background:#1e293b;height:6px;width:100%"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:24px 32px 18px;border-bottom:3px solid #1e293b">
      <div>
        <div style="font-size:28px;font-weight:900;color:#1e293b">${isAr ? 'فاتورة' : 'INVOICE'}</div>
        <div class="en" style="font-size:12px;color:#64748b;font-weight:600">${isAr ? 'RASD AI' : 'رصد'}</div>
      </div>
      <div style="text-align:${isAr ? 'left' : 'right'};font-size:11px;color:#444;line-height:1.6">
        <div style="font-weight:800;font-size:13px;color:#1e293b">${isAr ? 'شركة رصد للحلول المتكاملة' : 'RASD Integrated Solutions'}</div>
        <div>${isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</div>
        <div style="color:#1e293b">support@rasd-ai.com</div>
      </div>
    </div>
    ${generateCommonBody(inv, items, totals, isAr, '#1e293b')}
    ${generateFooter(isAr, '#1e293b')}
  `;
}

function generateMinimalTheme(
  inv: InvoiceData,
  items: InvoiceItem[],
  totals: ReturnType<typeof computeTotals>,
  isAr: boolean
): string {
  return `
    <div style="background:#111827;height:3px;width:100%"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:28px 32px;border-bottom:1px solid #e5e7eb">
      <div style="font-size:24px;font-weight:900;color:#111827;letter-spacing:-0.5px">${isAr ? 'فاتورة' : 'INVOICE'}</div>
      <div style="text-align:${isAr ? 'left' : 'right'};font-size:11px;color:#6b7280;line-height:1.6">
        <div style="font-weight:800;color:#111827">${isAr ? 'رصد' : 'RASD'}</div>
        <div>support@rasd-ai.com</div>
      </div>
    </div>
    ${generateCommonBody(inv, items, totals, isAr, '#111827')}
    ${generateFooter(isAr, '#111827')}
  `;
}

// ═══ Shared body (used by all themes) ═══
function generateCommonBody(
  inv: InvoiceData,
  items: InvoiceItem[],
  totals: ReturnType<typeof computeTotals>,
  isAr: boolean,
  accentColor: string
): string {
  const invNumber = inv.invoiceNumber || `INV-${String(inv.id).padStart(3, '0')}`;

  const itemsRows = items
    .map(
      (item) => `
    <tr style="border-bottom:1px solid #d1d5db">
      <td style="border:1px solid #d1d5db;padding:10px 12px;text-align:right;font-weight:700;color:#1e293b;font-size:12px;vertical-align:top">${escapeHtml(item.description)}</td>
      <td style="border:1px solid #d1d5db;padding:10px 12px;text-align:center;font-size:12px;width:12%">${item.quantity}</td>
      <td style="border:1px solid #d1d5db;padding:10px 12px;text-align:center;font-size:12px;font-family:'Segoe UI',sans-serif;direction:ltr;width:18%">$${formatCurrency(item.unitPrice)}</td>
      <td style="border:1px solid #d1d5db;padding:10px 12px;text-align:center;font-size:12px;font-weight:700;font-family:'Segoe UI',sans-serif;direction:ltr;width:18%">$${formatCurrency(item.quantity * item.unitPrice)}</td>
    </tr>
  `
    )
    .join('');

  const statusLabel = inv.status?.toLowerCase() === 'paid'
    ? (isAr ? 'مدفوعة' : 'Paid')
    : inv.status?.toLowerCase() === 'overdue'
    ? (isAr ? 'متأخرة' : 'Overdue')
    : (isAr ? 'غير مدفوعة' : 'Unpaid');

  const statusColor = inv.status?.toLowerCase() === 'paid'
    ? '#01b574'
    : inv.status?.toLowerCase() === 'overdue'
    ? '#e31a1a'
    : '#f59e0b';

  return `
    <!-- Client & Invoice Info -->
    <div style="display:flex;justify-content:space-between;padding:20px 32px;gap:24px">
      <div style="flex:1">
        <div style="font-weight:800;font-size:14px;color:#111;margin-bottom:8px">${isAr ? 'فاتورة إلى:' : 'Bill To:'}</div>
        <div style="font-weight:700;font-size:14px;color:#333">${escapeHtml(inv.clientName)}</div>
        ${inv.clientEmail ? `<div style="font-size:12px;color:#555;margin-top:2px">${escapeHtml(inv.clientEmail)}</div>` : ''}
        ${inv.clientPhone ? `<div class="en" style="font-size:12px;color:#555">${escapeHtml(inv.clientPhone)}</div>` : ''}
        ${inv.clientAddress ? `<div style="font-size:12px;color:#555">${escapeHtml(inv.clientAddress)}</div>` : ''}
      </div>
      <div style="text-align:left;font-size:12px;min-width:260px">
        <table style="border-collapse:collapse;width:100%">
          <tr>
            <td style="padding:5px 10px;font-weight:700;color:#555;text-align:right;white-space:nowrap">${isAr ? 'رقم الفاتورة' : 'Invoice #'}</td>
            <td class="en" style="padding:5px 10px;font-weight:800;color:#111;text-align:left;direction:ltr">${escapeHtml(invNumber)}</td>
          </tr>
          <tr>
            <td style="padding:5px 10px;font-weight:700;color:#555;text-align:right;white-space:nowrap">${isAr ? 'تاريخ الإصدار' : 'Issue Date'}</td>
            <td class="en" style="padding:5px 10px;font-weight:800;color:#111;text-align:left;direction:ltr">${formatDate(inv.createdAt, isAr)}</td>
          </tr>
          <tr>
            <td style="padding:5px 10px;font-weight:700;color:#555;text-align:right;white-space:nowrap">${isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</td>
            <td class="en" style="padding:5px 10px;font-weight:800;color:#111;text-align:left;direction:ltr">${formatDate(inv.dueDate, isAr)}</td>
          </tr>
          <tr>
            <td style="padding:5px 10px;font-weight:700;color:#555;text-align:right;white-space:nowrap">${isAr ? 'الحالة' : 'Status'}</td>
            <td style="padding:5px 10px;text-align:left">
              <span style="background:${statusColor}18;color:${statusColor};padding:3px 10px;border-radius:12px;font-weight:700;font-size:11px">${statusLabel}</span>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width:calc(100% - 64px);margin:0 32px;border-collapse:collapse;border:1px solid #d1d5db">
      <thead>
        <tr style="background:${accentColor};color:white">
          <th style="border:1px solid ${accentColor};padding:10px 12px;font-weight:700;font-size:12px;text-align:center">${isAr ? 'الوصف' : 'Description'}</th>
          <th style="border:1px solid ${accentColor};padding:10px 12px;font-weight:700;font-size:12px;text-align:center;width:12%">${isAr ? 'الكمية' : 'Qty'}</th>
          <th style="border:1px solid ${accentColor};padding:10px 12px;font-weight:700;font-size:12px;text-align:center;width:18%">${isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
          <th style="border:1px solid ${accentColor};padding:10px 12px;font-weight:700;font-size:12px;text-align:center;width:18%">${isAr ? 'الإجمالي' : 'Total'}</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <!-- Totals -->
    <div style="padding:20px 32px;display:flex;justify-content:flex-end">
      <table style="border-collapse:collapse;min-width:300px">
        <tr>
          <td style="padding:8px 14px;font-weight:700;color:#555;font-size:13px;border-bottom:1px solid #e5e7eb">${isAr ? 'المجموع الفرعي' : 'Subtotal'}</td>
          <td class="en" style="padding:8px 14px;font-weight:800;color:#111;font-size:13px;text-align:left;direction:ltr;border-bottom:1px solid #e5e7eb;min-width:120px">$${formatCurrency(totals.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:8px 14px;font-weight:700;color:#555;font-size:13px;border-bottom:1px solid #e5e7eb">${isAr ? `ضريبة القيمة المضافة (${totals.taxRate}%)` : `VAT (${totals.taxRate}%)`}</td>
          <td class="en" style="padding:8px 14px;font-weight:700;color:#555;font-size:13px;text-align:left;direction:ltr;border-bottom:1px solid #e5e7eb">$${formatCurrency(totals.tax)}</td>
        </tr>
        <tr style="background:#fef3c7">
          <td style="padding:8px 14px;font-weight:900;color:#333;font-size:14px;border-bottom:1px solid #e5e7eb">${isAr ? 'الإجمالي' : 'Total'}</td>
          <td class="en" style="padding:8px 14px;font-weight:900;color:#111;font-size:14px;text-align:left;direction:ltr;border-bottom:1px solid #e5e7eb">$${formatCurrency(totals.total)}</td>
        </tr>
        <tr>
          <td style="padding:8px 14px;font-weight:700;color:#555;font-size:13px;border-bottom:1px solid #e5e7eb">${isAr ? 'المدفوع' : 'Paid'}</td>
          <td class="en" style="padding:8px 14px;font-weight:700;color:#01b574;font-size:13px;text-align:left;direction:ltr;border-bottom:1px solid #e5e7eb">$${formatCurrency(totals.paid)}</td>
        </tr>
        ${inv.paymentMethod ? `
        <tr>
          <td style="padding:8px 14px;font-weight:700;color:#555;font-size:13px;border-bottom:1px solid #e5e7eb">${isAr ? 'مسار الدفع' : 'Payment Method'}</td>
          <td style="padding:8px 14px;font-weight:700;color:#111;font-size:13px;text-align:left;border-bottom:1px solid #e5e7eb">${escapeHtml(inv.paymentMethod)}</td>
        </tr>` : ''}
        <tr style="background:#fee2e2">
          <td style="padding:8px 14px;font-weight:900;color:#dc2626;font-size:14px;border-bottom:2px solid #ef4444">${isAr ? 'الرصيد المستحق' : 'Balance Due'}</td>
          <td class="en" style="padding:8px 14px;font-weight:900;color:#dc2626;font-size:14px;text-align:left;direction:ltr;border-bottom:2px solid #ef4444">$${formatCurrency(totals.remaining > 0 ? totals.remaining : 0)}</td>
        </tr>
      </table>
    </div>

    ${inv.notes ? `
    <div style="padding:0 32px 16px">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px">
        <div style="font-weight:800;color:#334155;font-size:12px;margin-bottom:6px">${isAr ? '📝 ملاحظات' : '📝 Notes'}</div>
        <div style="font-size:11px;color:#475569;line-height:1.7;white-space:pre-line">${escapeHtml(inv.notes)}</div>
      </div>
    </div>` : ''}
  `;
}

function generateFooter(isAr: boolean, accentColor: string): string {
  return `
    <div style="border-top:1px solid #e5e7eb;padding:20px 32px;margin-top:auto">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <div style="font-weight:800;color:#16a34a;font-size:12px;margin-bottom:8px">
          🏦 ${isAr ? 'تفاصيل الحساب البنكي للسداد' : 'Bank Account Details for Payment'}
        </div>
        <table style="width:100%;font-size:11px;border-collapse:collapse" dir="rtl">
          <tr style="border-bottom:1px dashed #e2e8f0">
            <td style="padding:5px 0;font-weight:800;color:#4b5563;width:120px">${isAr ? 'البنك:' : 'Bank:'}</td>
            <td style="padding:5px 0;font-weight:700;color:#111827">${isAr ? 'البنك الأهلي السعودي' : 'Saudi National Bank (SNB)'}</td>
          </tr>
          <tr style="border-bottom:1px dashed #e2e8f0">
            <td style="padding:5px 0;font-weight:800;color:#4b5563">${isAr ? 'الاسم التجاري:' : 'Account Name:'}</td>
            <td style="padding:5px 0;font-weight:700;color:#111827">${isAr ? 'شركة رصد للحلول المتكاملة' : 'RASD Integrated Solutions Co.'}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-weight:800;color:#4b5563">${isAr ? 'رقم الآيبان:' : 'IBAN:'}</td>
            <td class="en" style="padding:5px 0;direction:ltr;font-family:'Courier New',monospace;font-weight:800;color:#1e3a8a;font-size:13px;letter-spacing:0.5px;text-align:left">SA47 8000 0000 6080 1012 2345</td>
          </tr>
        </table>
      </div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#94a3b8;padding-top:8px;border-top:1px solid #f1f5f9">
        <span>RASD AI © ${new Date().getFullYear()}</span>
        <span>${isAr ? 'هذا التقرير سري ومخصص للاستخدام الداخلي' : 'Confidential — For internal use only'}</span>
        <span style="color:${accentColor};font-weight:700">rasd-ai.com</span>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════

@Injectable({
  providedIn: 'root',
})
export class PdfGeneratorService {
  private i18n = inject(I18nService);

  /**
   * Generate full HTML document for an invoice
   */
  generateInvoiceHTML(
    invoice: InvoiceData,
    theme: InvoiceTheme = 'rasd'
  ): string {
    const isAr = this.i18n.currentLang() === 'ar';
    const totals = computeTotals(invoice);
    const items = invoice.items;
    const invNumber =
      invoice.invoiceNumber || `INV-${String(invoice.id).padStart(3, '0')}`;

    let themeContent = '';
    switch (theme) {
      case 'modern':
        themeContent = generateModernTheme(invoice, items, totals, isAr);
        break;
      case 'classic':
        themeContent = generateClassicTheme(invoice, items, totals, isAr);
        break;
      case 'minimal':
        themeContent = generateMinimalTheme(invoice, items, totals, isAr);
        break;
      case 'rasd':
      default:
        themeContent = generateRasdTheme(invoice, items, totals, isAr);
        break;
    }

    return `<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
<head>
<meta charset="UTF-8">
<title>${isAr ? 'فاتورة' : 'Invoice'} #${escapeHtml(invNumber)} — RASD AI</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box }
  body {
    font-family: 'Cairo', 'Segoe UI', sans-serif;
    background: #fff;
    color: #222;
    direction: ${isAr ? 'rtl' : 'ltr'};
    font-size: 13px;
    line-height: 1.6;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
  .en {
    font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
    direction: ltr;
    unicode-bidi: embed;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0; width: 100%; }
  }
</style>
</head>
<body>
<div class="page">
${themeContent}
</div>
</body>
</html>`;
  }

  /**
   * Download invoice as PDF via print dialog
   */
  downloadInvoicePDF(
    invoice: InvoiceData,
    theme: InvoiceTheme = 'rasd'
  ): void {
    const html = this.generateInvoiceHTML(invoice, theme);
    const printWindow = window.open('', '_blank', 'width=900,height=1100');

    if (!printWindow) {
      alert(
        this.i18n.currentLang() === 'ar'
          ? 'يرجى السماح بالنوافذ المنبثقة لتحميل PDF'
          : 'Please allow popups to download the PDF'
      );
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 700);
  }

  /**
   * Share invoice via WhatsApp
   */
  shareInvoiceWhatsApp(
    invoice: InvoiceData,
    theme: InvoiceTheme = 'rasd'
  ): void {
    const isAr = this.i18n.currentLang() === 'ar';
    const totals = computeTotals(invoice);
    const invNumber =
      invoice.invoiceNumber || `INV-${String(invoice.id).padStart(3, '0')}`;

    // First download PDF
    this.downloadInvoicePDF(invoice, theme);

    // Then open WhatsApp after delay
    setTimeout(() => {
      const msg = [
        `📄 *${isAr ? 'فاتورة' : 'Invoice'} #${invNumber}*`,
        `👤 ${invoice.clientName}`,
        `💰 ${isAr ? 'الإجمالي' : 'Total'}: $${formatCurrency(totals.total)}`,
        totals.remaining > 0
          ? `🔴 ${isAr ? 'المستحق' : 'Due'}: $${formatCurrency(totals.remaining)}`
          : `✅ ${isAr ? 'مدفوعة بالكامل' : 'Fully Paid'}`,
        '',
        `📎 ${isAr ? 'الفاتورة PDF تم تحميلها — يرجى إرفاقها' : 'PDF invoice downloaded — please attach it'}`,
      ].join('\n');

      const phone = (invoice.clientPhone || '')
        .replace(/[^0-9+]/g, '');
      const cleanPhone = phone.startsWith('+')
        ? phone.slice(1)
        : phone.startsWith('0')
        ? '966' + phone.slice(1)
        : phone;

      const encoded = encodeURIComponent(msg);
      const waUrl = cleanPhone
        ? `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send/?text=${encoded}`;

      window.open(waUrl, '_blank');
    }, 1500);
  }
}
