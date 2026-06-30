import { Component, signal, computed, inject, OnInit, OnDestroy, ChangeDetectionStrategy, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PaymentService } from '../../../services/payment.service';
import { ToastService } from '../../../services/toast.service';
import { SignalRService } from '../../../services/signalr.service';
import { I18nService } from '../../../services/i18n.service';
import { ThemeService } from '../../../services/theme.service';
import { PremiumModalComponent } from '../../../shared/premium-modal/premium-modal';

interface DashboardData {
  totalCollected: number;
  pendingAmount: number;
  overdueAmount: number;
  thisMonthRevenue: number;
  todayCollections: number;
  totalPayments: number;
}

interface Payment {
  id: number;
  referenceNumber: string;
  invoiceNumber: string;
  clientName: string;
  companyName: string;
  amount: number;
  remainingBalance: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  createdByName: string;
}

interface UnpaidInvoice {
  id: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  companyName: string;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number;
  dueDate: string;
  status: string;
  currency: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PremiumModalComponent],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsComponent implements OnInit, OnDestroy {
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private signalR = inject(SignalRService);
  private router = inject(Router);
  public i18n = inject(I18nService);
  private themeService = inject(ThemeService);
  private destroy$ = new Subject<void>();

  @HostBinding('class.light-theme') get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
  }

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);
  showSuccess = signal(false);
  showAddModal = signal(false);

  dashboard = signal<DashboardData | null>(null);
  payments = signal<Payment[]>([]);
  unpaidInvoices = signal<UnpaidInvoice[]>([]);

  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));

  openMenuId = signal<number | null>(null);

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeMenu();
  }

  toggleMenu(id: number): void {
    this.openMenuId.update(current => current === id ? null : id);
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  searchQuery = signal('');
  statusFilter = signal('All');
  dateFilter = signal('All');
  customFrom = signal('');
  customTo = signal('');

  selectedInvoice = signal<UnpaidInvoice | null>(null);
  invoiceSearchQuery = signal('');
  showInvoiceDropdown = signal(false);

  formAmount = signal<number | null>(null);
  formPaymentMethod = signal('Cash');
  formPaymentDate = signal(new Date().toISOString().split('T')[0]);
  formReferenceNumber = signal('');
  formTransactionNumber = signal('');
  formBankName = signal('');
  formNotes = signal('');

  get selectedInvoiceCurrency() {
    return this.selectedInvoice()?.currency ?? 'SAR';
  }

  get invoiceTotal() {
    return this.selectedInvoice()?.grandTotal ?? 0;
  }

  get alreadyPaid() {
    return this.selectedInvoice()?.paidAmount ?? 0;
  }

  get remainingBalance() {
    return this.selectedInvoice()?.remainingBalance ?? 0;
  }

  get remainingAfterPayment() {
    const amount = this.formAmount() ?? 0;
    const remaining = this.remainingBalance;
    return Math.max(remaining - amount, 0);
  }

  get isAmountValid() {
    const amount = this.formAmount();
    if (!amount || amount <= 0) return false;
    return amount <= this.remainingBalance;
  }

  get canSubmit() {
    return this.selectedInvoice() !== null && this.isAmountValid && this.formPaymentMethod() && this.formPaymentDate();
  }

  statuses = ['All', 'Completed', 'Partial', 'Pending', 'Failed', 'Refunded'];
  dateFilters = ['All', 'Today', 'ThisWeek', 'ThisMonth', 'Custom'];

  paymentMethods = signal<string[]>(['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Wallet']);

  totalCollected = computed(() => this.dashboard()?.totalCollected ?? 0);
  pendingAmount = computed(() => this.dashboard()?.pendingAmount ?? 0);
  overdueAmount = computed(() => this.dashboard()?.overdueAmount ?? 0);
  thisMonthRevenue = computed(() => this.dashboard()?.thisMonthRevenue ?? 0);
  todayCollections = computed(() => this.dashboard()?.todayCollections ?? 0);
  totalPaymentsCount = computed(() => this.dashboard()?.totalPayments ?? 0);

  filteredPayments = computed(() => this.payments());

  constructor() {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadPayments();
    this.loadPaymentMethods();

    this.signalR.paymentCreated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadPayments();
      this.loadDashboard();
    });

    this.signalR.paymentUpdated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadPayments();
      this.loadDashboard();
    });

    this.signalR.paymentDeleted$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadPayments();
      this.loadDashboard();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboard(): void {
    this.paymentService.getPaymentDashboard().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.dashboard.set(res.data);
        }
      }
    });
  }

  private loadPayments(): void {
    this.loading.set(true);
    const from = this.dateFilter() === 'Custom' ? this.customFrom() || undefined : undefined;
    const to = this.dateFilter() === 'Custom' ? this.customTo() || undefined : undefined;
    this.paymentService.getPayments(
      this.statusFilter() !== 'All' ? this.statusFilter() : undefined,
      this.searchQuery() || undefined,
      from,
      to,
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.payments.set(res.data.items ?? []);
          this.totalCount.set(res.data.totalCount ?? 0);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadPayments();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.loadPayments();
  }

  filterByStatus(status: string): void {
    this.statusFilter.set(status);
    this.loadPayments();
  }

  filterByDate(filter: string): void {
    this.dateFilter.set(filter);
    if (filter !== 'Custom') {
      this.loadPayments();
    }
  }

  applyCustomDate(): void {
    this.loadPayments();
  }

  openAddModal(): void {
    this.showSuccess.set(false);
    this.submitting.set(false);
    this.selectedInvoice.set(null);
    this.formAmount.set(null);
    this.formPaymentMethod.set('Cash');
    this.formPaymentDate.set(new Date().toISOString().split('T')[0]);
    this.formReferenceNumber.set('');
    this.formTransactionNumber.set('');
    this.formBankName.set('');
    this.formNotes.set('');
    this.invoiceSearchQuery.set('');
    this.unpaidInvoices.set([]);
    this.showInvoiceDropdown.set(false);
    this.showAddModal.set(true);
    this.loadUnpaidInvoices();
  }

  closeModal(): void {
    this.showAddModal.set(false);
    this.showSuccess.set(false);
    this.showInvoiceDropdown.set(false);
  }

  private loadPaymentMethods(): void {
    this.paymentService.getPaymentMethods().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.paymentMethods.set(res.data);
        }
      }
    });
  }

  private loadUnpaidInvoices(search?: string): void {
    this.paymentService.getUnpaidInvoices(search).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.unpaidInvoices.set(res.data);
        }
      }
    });
  }

  onInvoiceSearch(query: string): void {
    this.invoiceSearchQuery.set(query);
    this.loadUnpaidInvoices(query || undefined);
    this.showInvoiceDropdown.set(true);
  }

  selectInvoice(invoice: UnpaidInvoice): void {
    this.selectedInvoice.set(invoice);
    this.showInvoiceDropdown.set(false);
    this.invoiceSearchQuery.set(`${invoice.invoiceNumber} - ${invoice.clientName}`);
  }

  clearSelectedInvoice(): void {
    this.selectedInvoice.set(null);
    this.invoiceSearchQuery.set('');
    this.formAmount.set(null);
  }

  parseNumber(val: any): number {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }

  formatCurrency(val: number): string {
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onSubmit(): void {
    if (!this.canSubmit) {
      this.toastService.warning(
        this.i18n.currentLang() === 'ar' ? 'الرجاء التأكد من تعبئة جميع الحقول بشكل صحيح' : 'Please ensure all fields are filled correctly'
      );
      return;
    }

    this.submitting.set(true);
    const payload = {
      invoiceId: this.selectedInvoice()!.id,
      amount: this.formAmount()!,
      paymentMethod: this.formPaymentMethod(),
      paymentDate: new Date(this.formPaymentDate()).toISOString(),
      referenceNumber: this.formReferenceNumber() || undefined,
      transactionNumber: this.formTransactionNumber() || undefined,
      bankName: this.formBankName() || undefined,
      notes: this.formNotes() || undefined,
      status: 'Completed'
    };

    this.paymentService.createPayment(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.showSuccess.set(true);
        setTimeout(() => this.closeModal(), 3000);
        this.loadPayments();
        this.loadDashboard();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل تسجيل الدفعة' : 'Failed to record payment'
        );
      }
    });
  }

  viewPayment(id: number): void {
    this.router.navigate(['/app/accountant/payments', id]);
  }

  deletePayment(id: number): void {
    const msg = this.i18n.currentLang() === 'ar'
      ? 'هل أنت متأكد من حذف هذه الدفعة؟'
      : 'Are you sure you want to delete this payment?';
    if (!confirm(msg)) return;
    this.paymentService.deletePayment(id).subscribe({
      next: () => {
        this.loadPayments();
        this.loadDashboard();
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? 'تم حذف الدفعة بنجاح' : 'Payment deleted successfully'
        );
      }
    });
  }

  printReceipt(payment: Payment): void {
    this.paymentService.getPaymentReceipt(payment.id).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(this.buildReceiptHtml(res.data));
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 300);
          }
        }
      }
    });
  }

  downloadPdf(payment: Payment): void {
    this.paymentService.getPaymentReceipt(payment.id).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(this.buildReceiptHtml(res.data));
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 300);
          }
        }
      }
    });
  }

  private buildReceiptHtml(data: any): string {
    const isAr = this.i18n.currentLang() === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const lang = isAr ? 'ar' : 'en';
    return `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head><meta charset="UTF-8"><title>${isAr ? 'إيصال الدفع' : 'Payment Receipt'}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #333; direction: ${dir}; }
        .receipt { max-width: 700px; margin: 0 auto; border: 1px solid #ddd; padding: 40px; border-radius: 8px; }
        h1 { text-align: center; color: #4318ff; margin-bottom: 5px; }
        .receipt-no { text-align: center; color: #888; font-size: 14px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        td, th { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        th { font-weight: 700; color: #555; background: #f9f9f9; text-align: ${isAr ? 'right' : 'left'}; }
        td { text-align: ${isAr ? 'right' : 'left'}; }
        .label { font-weight: 700; color: #555; width: 40%; }
        .value { color: #333; }
        .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #4318ff; }
        .footer { text-align: center; margin-top: 30px; color: #aaa; font-size: 12px; }
        @media print { body { margin: 20px; } .receipt { border: none; padding: 20px; } }
      </style>
      </head>
      <body>
        <div class="receipt">
          <h1>${isAr ? 'إيصال دفع' : 'Payment Receipt'}</h1>
          <div class="receipt-no">${isAr ? 'رقم الإيصال' : 'Receipt No'}: ${data.receiptNumber || ''}</div>
          <table>
            <tr><td class="label">${isAr ? 'رقم الفاتورة' : 'Invoice No'}</td><td class="value">${data.invoiceNumber || ''}</td></tr>
            <tr><td class="label">${isAr ? 'العميل' : 'Client'}</td><td class="value">${data.clientName || ''}</td></tr>
            ${data.companyName ? `<tr><td class="label">${isAr ? 'الشركة' : 'Company'}</td><td class="value">${data.companyName}</td></tr>` : ''}
            <tr><td class="label">${isAr ? 'المبلغ' : 'Amount'}</td><td class="value">${this.formatCurrency(data.amount)} ${isAr ? 'ريال' : 'SAR'}</td></tr>
            <tr><td class="label">${isAr ? 'الرصيد المتبقي' : 'Remaining'}</td><td class="value">${this.formatCurrency(data.remainingBalance)} ${isAr ? 'ريال' : 'SAR'}</td></tr>
            <tr><td class="label">${isAr ? 'طريقة الدفع' : 'Method'}</td><td class="value">${data.paymentMethod || ''}</td></tr>
            <tr><td class="label">${isAr ? 'تاريخ الدفع' : 'Date'}</td><td class="value">${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : ''}</td></tr>
            ${data.referenceNumber ? `<tr><td class="label">${isAr ? 'رقم المرجع' : 'Reference'}</td><td class="value">${data.referenceNumber}</td></tr>` : ''}
            ${data.createdByName ? `<tr><td class="label">${isAr ? 'المحاسب' : 'Accountant'}</td><td class="value">${data.createdByName}</td></tr>` : ''}
          </table>
          <div class="footer">${data.tenantName || ''}</div>
        </div>
        <script>window.print();<\/script>
      </body>
      </html>
    `;
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const locale = this.i18n.isRtl() ? 'ar-SA' : 'en-US';
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
