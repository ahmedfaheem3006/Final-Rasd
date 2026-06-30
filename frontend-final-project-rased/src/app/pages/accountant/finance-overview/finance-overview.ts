import { Component, signal, inject, OnInit, ViewChild, ElementRef, effect, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountantService } from '../../../services/accountant.service';
import { PaymentService } from '../../../services/payment.service';
import { ExpenseService } from '../../../services/expense.service';
import { I18nService } from '../../../services/i18n.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-finance-overview',
  imports: [CommonModule],
  templateUrl: './finance-overview.html',
  styleUrl: './finance-overview.css'
})
export class FinanceOverview implements OnInit, OnDestroy {
  private accountantService = inject(AccountantService);
  private paymentService = inject(PaymentService);
  private expenseService = inject(ExpenseService);
  public i18n = inject(I18nService);
  private renderer = inject(Renderer2);

  @ViewChild('modalOverlay') overlayRef!: ElementRef;
  private overlayMoved = false;

  stats = signal<any[]>([]);
  transactions = signal<any[]>([]);
  
  revenuePath = signal<string>('');
  expensesPath = signal<string>('');
  chartMonths = signal<string[]>([]);
  
  loading = signal(true);
  
  showExportModal = signal(false);
  exporting = signal(false);
  showSuccess = signal(false);

  constructor() {
    effect(() => {
      if (this.showExportModal()) {
        if (!this.overlayMoved && this.overlayRef?.nativeElement) {
          this.renderer.appendChild(document.body, this.overlayRef.nativeElement);
          this.overlayMoved = true;
        }
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnDestroy() {
    if (this.overlayMoved && this.overlayRef?.nativeElement?.parentNode) {
      this.renderer.removeChild(document.body, this.overlayRef.nativeElement);
    }
  }

  openExportModal() {
    this.showSuccess.set(false);
    this.exporting.set(false);
    this.showExportModal.set(true);
  }

  closeExportModal() {
    this.showExportModal.set(false);
    this.showSuccess.set(false);
  }

  exportReport() {
    this.exporting.set(true);
    // Simulate export delay
    setTimeout(() => {
      this.exporting.set(false);
      this.showSuccess.set(true);
      setTimeout(() => this.closeExportModal(), 3000);
    }, 1500);
  }

  ngOnInit() {
    this.loadData();
  }

  formatCurrency(val: number | undefined | null): string {
    if (val === undefined || val === null) return '0';
    return this.i18n.currentLang() === 'ar' ? val.toLocaleString() + ' SAR' : '$' + val.toLocaleString();
  }

  loadData() {
    this.loading.set(true);
    const isAr = this.i18n.currentLang() === 'ar';

    forkJoin({
      fullDashboard: this.accountantService.getFullDashboard(),
      paymentsRes: this.paymentService.getPayments(undefined, undefined, undefined, undefined, 1, 10),
      expensesRes: this.expenseService.getExpenses()
    }).subscribe({
      next: ({ fullDashboard, paymentsRes, expensesRes }) => {
        // 1. Map Stats
        if (fullDashboard?.success && fullDashboard.data) {
          const data = fullDashboard.data;
          const statsData = data.stats;
          const cashIn = data.cashFlow?.cashIn ?? 0;
          const cashOut = data.cashFlow?.cashOut ?? 0;
          const netProfit = cashIn - cashOut;

          this.stats.set([
            {
              label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue',
              value: this.formatCurrency(statsData.totalRevenue),
              change: statsData.revenueGrowth ? `${statsData.revenueGrowth}%` : '—',
              positive: statsData.revenueGrowth >= 0,
              color: 'primary',
              icon: 'fa-chart-line'
            },
            {
              label: isAr ? 'إجمالي المصروفات' : 'Total Expenses',
              value: this.formatCurrency(cashOut),
              change: '—',
              positive: false,
              color: 'danger',
              icon: 'fa-wallet'
            },
            {
              label: isAr ? 'صافي الربح' : 'Net Profit',
              value: this.formatCurrency(netProfit),
              change: '—',
              positive: netProfit >= 0,
              color: 'success',
              icon: 'fa-coins'
            },
            {
              label: isAr ? 'فواتير مستحقة' : 'Outstanding Invoices',
              value: this.formatCurrency(statsData.outstandingBalance),
              change: '—',
              positive: true,
              color: 'warning',
              icon: 'fa-file-invoice-dollar'
            }
          ]);

          // 2. Build Chart
          const chartData = data.revenueChart || [];
          if (chartData.length > 0) {
            const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const labels: string[] = [];
            
            const maxVal = Math.max(...chartData.map((d: any) => Math.max(d.revenue, d.expenses)), 1000);
            
            let revPathPoints = '';
            let expPathPoints = '';
            const totalWidth = 650;
            const startX = 50;

            chartData.forEach((d: any, idx: number) => {
              const label = isAr ? monthsAr[d.month - 1] : monthsEn[d.month - 1];
              labels.push(label);

              const x = startX + idx * (totalWidth / Math.max(1, chartData.length - 1));
              const yRev = 170 - (Number(d.revenue) / maxVal) * 130;
              const yExp = 170 - (Number(d.expenses) / maxVal) * 130;

              if (idx === 0) {
                revPathPoints = `M ${x} ${yRev}`;
                expPathPoints = `M ${x} ${yExp}`;
              } else {
                revPathPoints += ` L ${x} ${yRev}`;
                expPathPoints += ` L ${x} ${yExp}`;
              }
            });

            this.chartMonths.set(labels);
            this.revenuePath.set(revPathPoints);
            this.expensesPath.set(expPathPoints);
          }
        }

        // 3. Merge Payments and Expenses for Recent Transactions
        const paymentsList = (paymentsRes?.success && paymentsRes.data?.items) ? paymentsRes.data.items : [];
        const expensesList = (expensesRes?.success && expensesRes.data) ? expensesRes.data : [];

        const merged: any[] = [];

        paymentsList.forEach((p: any) => {
          merged.push({
            desc: isAr ? `سداد فاتورة - ${p.clientName || p.companyName}` : `Invoice Payment - ${p.clientName || p.companyName}`,
            amount: `+${this.formatCurrency(p.amount)}`,
            dateRaw: new Date(p.paymentDate || p.createdAt),
            date: new Date(p.paymentDate || p.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' }),
            type: 'income'
          });
        });

        expensesList.forEach((e: any) => {
          merged.push({
            desc: `${e.category ? (isAr ? this.translateCategory(e.category) : e.category) : (isAr ? 'مصروف' : 'Expense')} - ${e.purpose || ''}`,
            amount: `-${this.formatCurrency(e.amount)}`,
            dateRaw: new Date(e.expenseDate || e.createdAt),
            date: new Date(e.expenseDate || e.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' }),
            type: 'expense'
          });
        });

        // Sort descending by date
        const sorted = merged.sort((a, b) => b.dateRaw.getTime() - a.dateRaw.getTime()).slice(0, 5);
        this.transactions.set(sorted);
        
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private translateCategory(cat: string): string {
    const map: { [key: string]: string } = {
      'Salaries': 'رواتب الموظفين',
      'Rent': 'إيجار المكاتب',
      'Marketing': 'تسويق وإعلانات',
      'Utilities': 'خدمات ومرافق',
      'Software': 'برمجيات وتراخيص',
      'Hardware': 'أجهزة ومعدات',
      'Office': 'لوازم مكتبية',
      'Travel': 'سفر وانتقالات',
      'Consulting': 'استشارات وخدمات مهنية',
      'Other': 'مصروفات أخرى'
    };
    return map[cat] || cat;
  }
}
