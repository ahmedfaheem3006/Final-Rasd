import { Component, signal, computed, inject, OnInit, OnDestroy, AfterViewInit, effect, ViewChild, ElementRef, Renderer2, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AccountantService } from '../../../services/accountant.service';
import { InvoiceService } from '../../../services/invoice.service';
import { ClientFinancialService } from '../../../services/client-financial.service';
import { I18nService } from '../../../services/i18n.service';
import { ToastService } from '../../../services/toast.service';
import { ContractService } from '../../../services/contract.service';
import { PaymentService } from '../../../services/payment.service';
import { ThemeService } from '../../../services/theme.service';
import { FinancialReportsService } from '../../../services/financial-reports.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-accountant-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AccountantDashboard implements OnInit, AfterViewInit, OnDestroy {
  private accountantService = inject(AccountantService);
  private invoiceService = inject(InvoiceService);
  private clientService = inject(ClientFinancialService);
  private contractService = inject(ContractService);
  private paymentService = inject(PaymentService);
  private reportsService = inject(FinancialReportsService);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);
  i18n = inject(I18nService);

  @ViewChild('modalOverlay') overlayRef!: ElementRef;
  private overlayMoved = false;

  get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
  }

  loading = signal(true);
  private pollingSub?: Subscription;

  activeModal = signal<string | null>(null);

  constructor() {
    effect(() => {
      const open = !!this.activeModal();
      if (open) {
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

  ngAfterViewInit() {
    if (this.activeModal() && !this.overlayMoved && this.overlayRef?.nativeElement) {
      this.renderer.appendChild(document.body, this.overlayRef.nativeElement);
      this.overlayMoved = true;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.activeModal()) this.closeAllModals();
  }

  rawData = signal<any>({});
  invoices = signal<any[]>([]);
  clients = signal<any[]>([]);

  ngOnInit() {
    this.loadAllData();
    this.pollingSub = interval(30000).subscribe(() => this.refreshStatsOnly());
  }

  ngOnDestroy() {
    this.pollingSub?.unsubscribe();
    if (this.overlayMoved && this.overlayRef?.nativeElement?.parentNode) {
      this.renderer.removeChild(document.body, this.overlayRef.nativeElement);
    }
  }

  refreshAfterAction() {
    this.loadAllData();
  }

  private loadAllData() {
    this.loading.set(true);
    this.accountantService.getMyDashboard().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.rawData.set(res.data);
        }
        this.loadInvoicesAndClients();
      },
      error: () => this.loadInvoicesAndClients()
    });
  }

  private refreshStatsOnly() {
    this.accountantService.getMyDashboard().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.rawData.set(res.data);
        }
      }
    });
  }

  private loadInvoicesAndClients() {
    this.invoiceService.getInvoices().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.invoices.set(res.data);
        }
        this.clientService.getClients().subscribe({
          next: (cres) => {
            if (cres?.success && cres.data) {
              this.clients.set(cres.data);
            }
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => {
        this.clientService.getClients().subscribe({
          next: (cres) => {
            if (cres?.success && cres.data) {
              this.clients.set(cres.data);
            }
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      }
    });
  }

  d = computed(() => this.rawData());

  totalRevenue = computed(() => this.d()?.totalRevenue ?? 0);
  outstandingBalance = computed(() => this.d()?.outstandingBalance ?? 0);
  paidCount = computed(() => this.d()?.paidInvoices ?? 0);
  pendingCount = computed(() => this.d()?.pendingInvoices ?? 0);
  overdueCount = computed(() => this.d()?.overdueInvoices ?? 0);
  totalClientCount = computed(() => this.clients().length);
  monthlyRevenue = computed(() => this.d()?.monthlyRevenue ?? 0);
  monthlyPayments = computed(() => this.d()?.monthlyPayments ?? 0);

  currency = computed(() => this.d()?.currency ?? 'SAR');

  formatCurrency(val: number): string {
    const num = Number(val) || 0;
    return this.currency() === 'SAR'
      ? num.toLocaleString() + ' SAR'
      : '$' + num.toLocaleString();
  }

  formatShortCurrency(val: number): string {
    const num = Number(val) || 0;
    return this.currency() === 'SAR'
      ? num.toLocaleString() + ' SAR'
      : '$' + num.toLocaleString();
  }

  recentActivity = computed(() => {
    const all = this.invoices();
    return [...all].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  });

  topClients = computed(() => {
    const all = this.clients();
    return [...all].sort((a: any, b: any) => (b.totalRevenue || 0) - (a.totalRevenue || 0)).slice(0, 5);
  });

  topOutstandingClients = computed(() => {
    const all = this.clients();
    return [...all].sort((a: any, b: any) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0)).slice(0, 5);
  });

  outstandingPayments = computed(() => {
    const all = this.invoices();
    return all
      .filter((i: any) => i.status === 'Unpaid' || i.status === 'Overdue' || i.status === 'Pending')
      .slice(0, 10);
  });

  isOverdue = (inv: any) => inv.status === 'Overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'Paid');

  latestClients = computed(() => {
    const all = this.clients();
    return [...all].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);
  });

  latestInvoices = computed(() => {
    const all = this.invoices();
    return [...all].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  });

  upcomingDue = computed(() => {
    const all = this.invoices();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return all.filter((i: any) => {
      if (!i.dueDate) return false;
      const dd = new Date(i.dueDate);
      return dd >= now && dd <= nextWeek && i.status !== 'Paid';
    }).slice(0, 10);
  });

  notifications = computed(() => {
    const items: { icon: string; color: string; title: string; desc: string }[] = [];
    const over = this.overdueCount();
    if (over > 0) {
      items.push({ icon: 'fa-triangle-exclamation', color: 'danger', title: this.i18n.t('accountant_dashboard.notif_overdue'), desc: `${over} ${this.i18n.t('accountant_dashboard.stats.overdue_invoices')}` });
    }
    const paid = this.invoices().filter((i: any) => i.status === 'Paid' && new Date(i.updatedAt || i.createdAt) > new Date(Date.now() - 86400000)).length;
    if (paid > 0) {
      items.push({ icon: 'fa-circle-check', color: 'success', title: this.i18n.t('accountant_dashboard.notif_newly_paid'), desc: `${paid} ${this.i18n.t('accountant_dashboard.invoice_prefix')}${this.i18n.t('accountant_dashboard.status_paid')}` });
    }
    const nearLimit = this.clients().filter((c: any) => c.outstandingBalance > (c.creditLimit * 0.8)).length;
    if (nearLimit > 0) {
      items.push({ icon: 'fa-bell', color: 'warning', title: this.i18n.t('accountant_dashboard.notif_credit_alert'), desc: `${nearLimit} ${this.i18n.t('clients.stats.total')}` });
    }
    return items;
  });

  collectionRate = computed(() => {
    const total = this.totalRevenue();
    const out = this.outstandingBalance();
    if (total === 0 && out === 0) return 100;
    if (total + out === 0) return 0;
    return Math.round((total / (total + out)) * 100);
  });

  revenueGrowth = computed(() => {
    const d = this.d();
    return d?.revenueGrowth ?? 12.5;
  });

  paymentSuccess = computed(() => {
    const all = this.invoices();
    if (all.length === 0) return 100;
    const paid = all.filter((i: any) => i.status === 'Paid').length;
    return Math.round((paid / all.length) * 100);
  });

  outstandingRatio = computed(() => {
    const total = this.totalRevenue();
    const out = this.outstandingBalance();
    if (total === 0 && out === 0) return 0;
    if (total + out === 0) return 0;
    return Math.round((out / (total + out)) * 100);
  });

  cashFlow = computed(() => {
    const all = this.invoices();
    const cashIn = all.filter((i: any) => i.status === 'Paid').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const cashOut = all.filter((i: any) => i.status === 'Unpaid' || i.status === 'Overdue').reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    return { cashIn, cashOut, net: cashIn - cashOut };
  });

  invoiceStatusData = computed(() => {
    const all = this.invoices();
    const paid = all.filter((i: any) => i.status === 'Paid').length;
    const pending = all.filter((i: any) => i.status === 'Pending' || i.status === 'Unpaid').length;
    const overdue = all.filter((i: any) => i.status === 'Overdue').length;
    const cancelled = all.filter((i: any) => i.status === 'Cancelled').length;
    const total = paid + pending + overdue + cancelled || 1;
    return {
      paid: Math.round((paid / total) * 100),
      pending: Math.round((pending / total) * 100),
      overdue: Math.round((overdue / total) * 100),
      cancelled: Math.round((cancelled / total) * 100)
    };
  });

  revenueChartMonths = signal<{ label: string; revenue: number; expenses: number; profit: number }[]>([]);
  revenueChartMax = signal(0);
  revenuePath = signal('');
  expensesPath = signal('');
  profitPath = signal('');
  revChartPoints = signal<{ cx: number; cyRev: number; cyExp: number; cyProf: number }[]>([]);
  revChartEmpty = signal(true);

  private buildRevenueChart() {
    const now = new Date();
    const months: { label: string; revenue: number; expenses: number; profit: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        revenue: 0,
        expenses: 0,
        profit: 0
      });
    }
    const all = this.invoices();
    all.forEach((inv: any) => {
      const dt = new Date(inv.createdAt);
      const idx = months.findIndex(m => {
        const md = new Date(now.getFullYear(), now.getMonth() - (5 - months.indexOf(m)), 1);
        return dt.getMonth() === md.getMonth() && dt.getFullYear() === md.getFullYear();
      });
      if (idx >= 0) {
        if (inv.status === 'Paid') {
          months[idx].revenue += Number(inv.totalAmount) || 0;
        } else {
          months[idx].expenses += Number(inv.totalAmount) || 0;
        }
      }
    });
    months.forEach(m => { m.profit = m.revenue - m.expenses; });

    const allZero = months.every(m => m.revenue === 0 && m.expenses === 0 && m.profit === 0);
    this.revChartEmpty.set(allZero);

    if (!allZero) {
      const maxVal = Math.max(...months.map(m => Math.max(m.revenue, m.expenses, m.profit)), 1);
      const chartH = 160;
      const N = months.length;
      const step = N > 1 ? 700 / (N - 1) : 0;

      const points = months.map((m, i) => ({
        cx: 50 + i * step,
        cyRev: 210 - (m.revenue / maxVal * chartH),
        cyExp: 210 - (m.expenses / maxVal * chartH),
        cyProf: 210 - (m.profit / maxVal * chartH)
      }));

      this.revenuePath.set(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx} ${p.cyRev}`).join(' '));
      this.expensesPath.set(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx} ${p.cyExp}`).join(' '));
      this.profitPath.set(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx} ${p.cyProf}`).join(' '));
      this.revChartPoints.set(points);
      this.revenueChartMax.set(maxVal);
    }
    this.revenueChartMonths.set(months);
  }

  getInvoiceStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': case 'unpaid': return 'warning';
      case 'overdue': return 'danger';
      case 'cancelled': return 'info';
      default: return 'primary';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return this.i18n.t('accountant_dashboard.status_paid');
      case 'pending': case 'unpaid': return this.i18n.t('accountant_dashboard.status_pending');
      case 'overdue': return this.i18n.t('accountant_dashboard.status_overdue');
      case 'cancelled': return this.i18n.t('accountant_dashboard.status_cancelled');
      default: return status || '-';
    }
  }

  // ══════════════════════════════════════════
  // MODAL SIGNALS
  // ══════════════════════════════════════════

  closeAllModals() {
    this.activeModal.set(null);
  }

  // ══════════════════════════════════════════
  // BUTTON HANDLERS
  // ══════════════════════════════════════════

  onCreateInvoice() {
    this.resetInvoiceForm();
    this.loadClientsForInvoice();
    this.loadContracts();
    this.activeModal.set('create-invoice');
  }

  onAddClient() {
    this.resetClientForm();
    this.activeModal.set('add-client');
  }

  onRecordPayment() {
    this.resetPaymentForm();
    this.loadUnpaidInvoicesForPayment();
    this.activeModal.set('record-payment');
  }

  onExportReport() {
    this.resetReportForm();
    this.activeModal.set('generate-report');
  }

  onFilterDates() {
    this.buildRevenueChart();
    this.toastService.info(
      this.i18n.currentLang() === 'ar' ? 'تم تطبيق فلتر التواريخ بنجاح' : 'Date filter applied successfully',
      this.i18n.currentLang() === 'ar' ? 'تصفية التواريخ' : 'Filter Dates'
    );
  }

  // ══════════════════════════════════════════
  // CREATE INVOICE MODAL
  // ══════════════════════════════════════════

  invoiceClients = signal<any[]>([]);
  invoiceContracts = signal<any[]>([]);
  selectedInvoiceClientId = signal<number | null>(null);
  selectedInvoiceContractId: any = null;
  invoiceTotalAmount: number | null = null;
  invoiceDueDate: string = '';
  invoiceStatus = 'Unpaid';
  invoiceSubmitting = signal(false);
  invoiceSuccess = signal(false);

  filteredInvoiceContracts = computed(() => {
    const clientId = this.selectedInvoiceClientId();
    if (!clientId) return [];
    return this.invoiceContracts().filter((c: any) => Number(c.clientId) === Number(clientId));
  });

  resetInvoiceForm() {
    this.selectedInvoiceClientId.set(null);
    this.selectedInvoiceContractId = null;
    this.invoiceTotalAmount = null;
    this.invoiceDueDate = '';
    this.invoiceStatus = 'Unpaid';
    this.invoiceSubmitting.set(false);
    this.invoiceSuccess.set(false);
  }

  loadClientsForInvoice() {
    this.clientService.getClients().subscribe({
      next: (res) => {
        if (res?.success && res.data) this.invoiceClients.set(res.data);
      }
    });
  }

  loadContracts() {
    this.contractService.getContracts().subscribe({
      next: (res) => {
        if (res) this.invoiceContracts.set(res);
      }
    });
  }

  closeCreateInvoiceModal() {
    this.closeAllModals();
  }

  onInvoiceClientChange(clientId: any) {
    const cid = clientId ? Number(clientId) : null;
    this.selectedInvoiceClientId.set(cid);
    setTimeout(() => {
      const contracts = this.filteredInvoiceContracts();
      if (cid && contracts.length === 0) {
        this.selectedInvoiceContractId = 'AUTO_CREATE';
      } else {
        this.selectedInvoiceContractId = null;
      }
    }, 50);
  }

  onSubmitInvoice() {
    if (!this.selectedInvoiceContractId || !this.invoiceTotalAmount || !this.invoiceDueDate) {
      this.toastService.warning(
        this.i18n.currentLang() === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields'
      );
      return;
    }
    this.invoiceSubmitting.set(true);

    const doSubmit = (contractId: number) => {
      const payload = {
        contractId,
        dealId: 0,
        totalAmount: Number(this.invoiceTotalAmount),
        dueDate: new Date(this.invoiceDueDate).toISOString(),
        status: this.invoiceStatus
      };
      this.invoiceService.createInvoice(payload).subscribe({
        next: () => {
          this.invoiceSubmitting.set(false);
          this.invoiceSuccess.set(true);
          this.refreshAfterAction();
          setTimeout(() => this.closeCreateInvoiceModal(), 3000);
        },
        error: (err) => {
          this.invoiceSubmitting.set(false);
          this.toastService.error(err.error?.message || (this.i18n.currentLang() === 'ar' ? 'فشل إنشاء الفاتورة' : 'Failed to create invoice'));
        }
      });
    };

    if (this.selectedInvoiceContractId === 'AUTO_CREATE') {
      const contractPayload = {
        clientId: Number(this.selectedInvoiceClientId()),
        contractTitle: 'Auto Contract',
        contractType: 'General',
        currency: 'SAR',
        contractValue: Number(this.invoiceTotalAmount),
        taxPercentage: 0,
        discount: 0,
        finalAmount: Number(this.invoiceTotalAmount),
        paymentTerms: 'Custom',
        depositAmount: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        reminderDays: 30,
        status: 'Active'
      };
      this.contractService.createContract(contractPayload).subscribe({
        next: (res: any) => {
          if (res && res.id) {
            this.loadContracts();
            doSubmit(res.id);
          } else {
            this.invoiceSubmitting.set(false);
            this.toastService.error(this.i18n.currentLang() === 'ar' ? 'فشل إنشاء عقد تلقائي' : 'Failed to create auto-contract');
          }
        },
        error: () => {
          this.invoiceSubmitting.set(false);
          this.toastService.error(this.i18n.currentLang() === 'ar' ? 'فشل إنشاء عقد تلقائي' : 'Failed to create auto-contract');
        }
      });
    } else {
      doSubmit(Number(this.selectedInvoiceContractId));
    }
  }

  // ══════════════════════════════════════════
  // ADD CLIENT MODAL
  // ══════════════════════════════════════════

  clientCompanyName = '';
  clientOwnerName = '';
  clientEmail = '';
  clientPhone = '';
  clientStatus = 'Active';
  clientSubmitting = signal(false);
  clientSuccess = signal(false);

  resetClientForm() {
    this.clientCompanyName = '';
    this.clientOwnerName = '';
    this.clientEmail = '';
    this.clientPhone = '';
    this.clientStatus = 'Active';
    this.clientSubmitting.set(false);
    this.clientSuccess.set(false);
  }

  closeAddClientModal() {
    this.closeAllModals();
  }

  onSubmitClient() {
    if (!this.clientCompanyName || !this.clientOwnerName || !this.clientEmail || !this.clientPhone) {
      this.toastService.warning(
        this.i18n.currentLang() === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields'
      );
      return;
    }
    this.clientSubmitting.set(true);
    const payload = {
      companyName: this.clientCompanyName,
      ownerName: this.clientOwnerName,
      email: this.clientEmail,
      phone: this.clientPhone,
      status: this.clientStatus
    };
    this.clientService.createClient(payload).subscribe({
      next: () => {
        this.clientSubmitting.set(false);
        this.clientSuccess.set(true);
        this.refreshAfterAction();
        setTimeout(() => this.closeAddClientModal(), 3000);
      },
      error: (err) => {
        this.clientSubmitting.set(false);
        this.toastService.error(err.error?.message || (this.i18n.currentLang() === 'ar' ? 'فشل إضافة العميل' : 'Failed to add client'));
      }
    });
  }

  // ══════════════════════════════════════════
  // RECORD PAYMENT MODAL
  // ══════════════════════════════════════════

  paymentUnpaidInvoices = signal<any[]>([]);
  paymentSelectedInvoice = signal<any | null>(null);
  paymentInvoiceSearchQuery = signal('');
  paymentShowInvoiceDropdown = signal(false);
  paymentAmount = signal<number | null>(null);
  paymentMethod = signal('Cash');
  paymentDate = signal(new Date().toISOString().split('T')[0]);
  paymentReferenceNumber = signal('');
  paymentTransactionNumber = signal('');
  paymentBankName = signal('');
  paymentNotes = signal('');
  paymentSubmitting = signal(false);
  paymentRecorded = signal(false);

  paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque', 'Wallet', 'Online Payment'];

  get paymentRemainingBalance() {
    return this.paymentSelectedInvoice()?.remainingBalance ?? 0;
  }

  get paymentRemainingAfterPayment() {
    const amount = this.paymentAmount() ?? 0;
    return Math.max(this.paymentRemainingBalance - amount, 0);
  }

  get canSubmitPayment() {
    const amount = this.paymentAmount();
    return this.paymentSelectedInvoice() !== null && !!amount && amount > 0 && amount <= this.paymentRemainingBalance && this.paymentMethod() && this.paymentDate();
  }

  resetPaymentForm() {
    this.paymentSelectedInvoice.set(null);
    this.paymentInvoiceSearchQuery.set('');
    this.paymentShowInvoiceDropdown.set(false);
    this.paymentAmount.set(null);
    this.paymentMethod.set('Cash');
    this.paymentDate.set(new Date().toISOString().split('T')[0]);
    this.paymentReferenceNumber.set('');
    this.paymentTransactionNumber.set('');
    this.paymentBankName.set('');
    this.paymentNotes.set('');
    this.paymentSubmitting.set(false);
    this.paymentRecorded.set(false);
    this.paymentUnpaidInvoices.set([]);
  }

  closeRecordPaymentModal() {
    this.closeAllModals();
  }

  loadUnpaidInvoicesForPayment(search?: string) {
    this.paymentService.getUnpaidInvoices(search).subscribe({
      next: (res) => {
        if (res?.success && res.data) this.paymentUnpaidInvoices.set(res.data);
      }
    });
  }

  onPaymentInvoiceSearch(query: string) {
    this.paymentInvoiceSearchQuery.set(query);
    this.loadUnpaidInvoicesForPayment(query || undefined);
    this.paymentShowInvoiceDropdown.set(true);
  }

  selectPaymentInvoice(invoice: any) {
    this.paymentSelectedInvoice.set(invoice);
    this.paymentShowInvoiceDropdown.set(false);
    this.paymentInvoiceSearchQuery.set(`${invoice.invoiceNumber} - ${invoice.clientName}`);
  }

  clearPaymentInvoice() {
    this.paymentSelectedInvoice.set(null);
    this.paymentInvoiceSearchQuery.set('');
    this.paymentAmount.set(null);
  }

  onSubmitPayment() {
    if (!this.canSubmitPayment) {
      this.toastService.warning(
        this.i18n.currentLang() === 'ar' ? 'الرجاء التأكد من تعبئة جميع الحقول' : 'Please ensure all fields are filled correctly'
      );
      return;
    }
    this.paymentSubmitting.set(true);
    const payload = {
      invoiceId: this.paymentSelectedInvoice()!.id,
      amount: this.paymentAmount()!,
      paymentMethod: this.paymentMethod(),
      paymentDate: new Date(this.paymentDate()).toISOString(),
      referenceNumber: this.paymentReferenceNumber() || undefined,
      transactionNumber: this.paymentTransactionNumber() || undefined,
      bankName: this.paymentBankName() || undefined,
      notes: this.paymentNotes() || undefined,
      status: 'Completed'
    };
    this.paymentService.createPayment(payload).subscribe({
      next: () => {
        this.paymentSubmitting.set(false);
        this.paymentRecorded.set(true);
        this.refreshAfterAction();
        setTimeout(() => this.closeRecordPaymentModal(), 3000);
      },
      error: (err) => {
        this.paymentSubmitting.set(false);
        this.toastService.error(err.error?.message || (this.i18n.currentLang() === 'ar' ? 'فشل تسجيل الدفعة' : 'Failed to record payment'));
      }
    });
  }

  // ══════════════════════════════════════════
  // GENERATE REPORT MODAL
  // ══════════════════════════════════════════

  reportType = signal('Revenue Report');
  reportFrom = signal('');
  reportTo = signal('');
  reportClientId = signal<number | null>(null);
  reportStatus = signal('');
  reportFormat = signal('PDF');
  reportGenerating = signal(false);
  reportClients = signal<any[]>([]);

  reportTypes = [
    'Revenue Report',
    'Payments Report',
    'Outstanding Balances',
    'Client Statement',
    'Cash Flow',
    'Invoice Report'
  ];

  reportStatuses = ['', 'Paid', 'Unpaid', 'Overdue', 'Pending', 'Cancelled'];
  reportFormats = ['PDF', 'Excel', 'CSV'];

  resetReportForm() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    this.reportType.set('Revenue Report');
    this.reportFrom.set(startOfYear.toISOString().split('T')[0]);
    this.reportTo.set(now.toISOString().split('T')[0]);
    this.reportClientId.set(null);
    this.reportStatus.set('');
    this.reportFormat.set('PDF');
    this.reportGenerating.set(false);
    this.reportClients.set([]);
    this.loadReportClients();
  }

  closeGenerateReportModal() {
    this.closeAllModals();
  }

  loadReportClients() {
    this.http.get<any>('http://localhost:5292/api/Clients').subscribe({
      next: (res) => this.reportClients.set(res?.data ?? []),
      error: () => this.reportClients.set([])
    });
  }

  onSubmitReport() {
    this.reportGenerating.set(true);
    const params: any = {
      type: this.reportType(),
      fromDate: this.reportFrom() || undefined,
      toDate: this.reportTo() || undefined,
      clientId: this.reportClientId() || undefined,
      status: this.reportStatus() || undefined,
      format: this.reportFormat()
    };

    this.http.post('http://localhost:5292/api/Reports/generate', params, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.reportGenerating.set(false);
        const ext = this.reportFormat().toLowerCase();
        const filename = `${this.reportType().replace(/\s+/g, '_')}.${ext === 'pdf' ? 'pdf' : ext === 'excel' ? 'xlsx' : 'csv'}`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? 'تم إنشاء التقرير وتنزيله بنجاح' : 'Report generated and downloaded successfully',
          this.i18n.currentLang() === 'ar' ? 'تصدير التقرير' : 'Export Report'
        );
        setTimeout(() => this.closeGenerateReportModal(), 1500);
      },
      error: () => {
        this.reportGenerating.set(false);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل إنشاء التقرير' : 'Failed to generate report'
        );
      }
    });
  }

  parseNumber(val: any): number {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }

  formatAmount(val: number): string {
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
