import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { I18nService } from '../../../services/i18n.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container" [dir]="i18n.dir()">
      <header class="page-header animate-fade-in">
        <div class="header-info">
          <div class="breadcrumbs">
            <a routerLink="/app/accountant/payments">{{ i18n.currentLang() === 'ar' ? 'المدفوعات' : 'Payments' }}</a>
            / {{ payment()?.referenceNumber || i18n.currentLang() === 'ar' ? 'تفاصيل الدفعة' : 'Payment Details' }}
          </div>
          <h1>{{ i18n.currentLang() === 'ar' ? 'تفاصيل الدفعة' : 'Payment Details' }}</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" (click)="router.navigate(['/app/accountant/payments'])">
            <i class="fa-solid fa-arrow-left"></i> {{ i18n.currentLang() === 'ar' ? 'عودة' : 'Back' }}
          </button>
          <button class="btn btn-primary" (click)="printReceipt()">
            <i class="fa-solid fa-print"></i> {{ i18n.currentLang() === 'ar' ? 'طباعة' : 'Print' }}
          </button>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">{{ i18n.currentLang() === 'ar' ? 'جاري التحميل...' : 'Loading...' }}</div>
      } @else if (payment(); as p) {
        <div class="detail-grid animate-reveal">
          <div class="card detail-card">
            <div class="card-header"><i class="fa-solid fa-credit-card"></i> {{ i18n.currentLang() === 'ar' ? 'معلومات الدفع' : 'Payment Information' }}</div>
            <div class="card-body">
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'رقم المرجع' : 'Reference' }}</span><span class="info-value">{{ p.referenceNumber || '—' }}</span></div>
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'المبلغ' : 'Amount' }}</span><span class="info-value fw-bold text-primary">{{ formatCurrency(p.amount) }} SAR</span></div>
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'الرصيد المتبقي' : 'Remaining' }}</span><span class="info-value">{{ formatCurrency(p.remainingBalance) }} SAR</span></div>
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'طريقة الدفع' : 'Method' }}</span><span class="info-value">{{ p.paymentMethod }}</span></div>
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'تاريخ الدفع' : 'Date' }}</span><span class="info-value">{{ formatDate(p.paymentDate) }}</span></div>
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'حالة الدفع' : 'Payment Status' }}</span><span class="info-value"><span class="badge" [ngClass]="getBadgeClass(p.status)">{{ p.status }}</span></span></div>
              @if (p.invoiceStatus) {
                <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'حالة الفاتورة' : 'Invoice Status' }}</span><span class="info-value"><span class="badge" [ngClass]="getBadgeClass(p.invoiceStatus)">{{ p.invoiceStatus }}</span></span></div>
              }
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'تاريخ الإنشاء' : 'Created At' }}</span><span class="info-value">{{ formatDate(p.createdAt) }}</span></div>
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'المحاسب' : 'Created By' }}</span><span class="info-value">{{ p.createdByName || '—' }}</span></div>
              @if (p.notes) {
                <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'ملاحظات' : 'Notes' }}</span><span class="info-value">{{ p.notes }}</span></div>
              }
            </div>
          </div>

          <div class="card detail-card">
            <div class="card-header"><i class="fa-solid fa-file-invoice"></i> {{ i18n.currentLang() === 'ar' ? 'معلومات الفاتورة' : 'Invoice Information' }}</div>
            <div class="card-body">
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'رقم الفاتورة' : 'Invoice No' }}</span><span class="info-value fw-bold">{{ p.invoiceNumber }}</span></div>
              <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'العميل' : 'Client' }}</span><span class="info-value">{{ p.clientName }}</span></div>
              @if (p.companyName) {
                <div class="info-row"><span class="info-label">{{ i18n.currentLang() === 'ar' ? 'الشركة' : 'Company' }}</span><span class="info-value">{{ p.companyName }}</span></div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <h3>{{ i18n.currentLang() === 'ar' ? 'الدفعة غير موجودة' : 'Payment Not Found' }}</h3>
          <button class="btn btn-primary" routerLink="/app/accountant/payments">{{ i18n.currentLang() === 'ar' ? 'عودة للمدفوعات' : 'Back to Payments' }}</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .breadcrumbs { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
    .breadcrumbs a { color: var(--primary); text-decoration: none; }
    .breadcrumbs a:hover { text-decoration: underline; }
    .header-info h1 { font-size: 1.85rem; font-weight: 800; color: var(--text-title); margin: 4px 0; }
    .header-actions { display: flex; gap: 10px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .detail-card { overflow: hidden; }
    .card-header { padding: 14px 20px; font-size: 0.9rem; font-weight: 700; color: var(--text-title); border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 8px; }
    .card-header i { color: var(--primary); }
    .card-body { padding: 16px 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-light); }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; }
    .info-value { font-size: 0.85rem; color: var(--text-title); text-align: end; }
    .loading-state { text-align: center; padding: 60px; color: var(--text-muted); font-size: 1rem; }
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-state h3 { color: var(--text-title); margin-bottom: 16px; }
    .fw-bold { font-weight: 700; }
    .text-primary { color: var(--primary); }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
    .badge-success { background: rgba(16,185,129,0.12); color: #059669; }
    .badge-warning { background: rgba(245,158,11,0.12); color: #d97706; }
    .badge-danger { background: rgba(239,68,68,0.12); color: #dc2626; }
    .badge-info { background: rgba(59,130,246,0.12); color: #2563eb; }
    .badge-secondary { background: rgba(107,114,128,0.12); color: #6b7280; }
    .badge-primary { background: rgba(67,24,255,0.12); color: var(--primary); }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class PaymentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  public i18n = inject(I18nService);
  public router = inject(Router);
  private themeService = inject(ThemeService);

  payment = signal<any>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadPayment(id);
  }

  private loadPayment(id: number): void {
    this.loading.set(true);
    this.paymentService.getPaymentById(id).subscribe({
      next: (res) => {
        if (res?.success && res.data) this.payment.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  printReceipt(): void {
    const p = this.payment();
    if (!p) return;
    this.paymentService.getPaymentReceipt(p.id).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const w = window.open('', '_blank');
          if (w) {
            w.document.write(this.buildReceiptHtml(res.data));
            w.document.close();
            w.focus();
            setTimeout(() => w.print(), 300);
          }
        }
      }
    });
  }

  private buildReceiptHtml(data: any): string {
    const isAr = this.i18n.currentLang() === 'ar';
    return `
      <!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
      <head><meta charset="UTF-8"><title>${isAr ? 'إيصال الدفع' : 'Payment Receipt'}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #333; direction: ${isAr ? 'rtl' : 'ltr'}; }
        .receipt { max-width: 700px; margin: 0 auto; border: 1px solid #ddd; padding: 40px; border-radius: 8px; }
        h1 { text-align: center; color: #4318ff; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .label { font-weight: 700; color: #555; width: 40%; }
        .footer { text-align: center; margin-top: 30px; color: #aaa; font-size: 12px; }
        @media print { body { margin: 20px; } .receipt { border: none; padding: 20px; } }
      </style></head>
      <body><div class="receipt">
        <h1>${isAr ? 'إيصال دفع' : 'Payment Receipt'}</h1>
        <p style="text-align:center;color:#888">${isAr ? 'رقم الإيصال' : 'Receipt No'}: ${data.receiptNumber || ''}</p>
        <table>
          <tr><td class="label">${isAr ? 'رقم الفاتورة' : 'Invoice No'}</td><td>${data.invoiceNumber || ''}</td></tr>
          <tr><td class="label">${isAr ? 'العميل' : 'Client'}</td><td>${data.clientName || ''}</td></tr>
          ${data.companyName ? `<tr><td class="label">${isAr ? 'الشركة' : 'Company'}</td><td>${data.companyName}</td></tr>` : ''}
          <tr><td class="label">${isAr ? 'المبلغ' : 'Amount'}</td><td>${Number(data.amount).toLocaleString()} SAR</td></tr>
          <tr><td class="label">${isAr ? 'المتبقي' : 'Remaining'}</td><td>${Number(data.remainingBalance).toLocaleString()} SAR</td></tr>
          <tr><td class="label">${isAr ? 'طريقة الدفع' : 'Method'}</td><td>${data.paymentMethod || ''}</td></tr>
          <tr><td class="label">${isAr ? 'التاريخ' : 'Date'}</td><td>${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : ''}</td></tr>
          ${data.referenceNumber ? `<tr><td class="label">${isAr ? 'رقم المرجع' : 'Reference'}</td><td>${data.referenceNumber}</td></tr>` : ''}
          ${data.createdByName ? `<tr><td class="label">${isAr ? 'المحاسب' : 'Accountant'}</td><td>${data.createdByName}</td></tr>` : ''}
        </table>
        <div class="footer">${data.tenantName || ''}</div>
      </div></body></html>
    `;
  }

  formatCurrency(val: number): string {
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(this.i18n.isRtl() ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Partial': return 'badge-info';
      case 'Pending': return 'badge-warning';
      case 'Failed': return 'badge-danger';
      case 'Refunded': return 'badge-secondary';
      default: return 'badge-primary';
    }
  }
}