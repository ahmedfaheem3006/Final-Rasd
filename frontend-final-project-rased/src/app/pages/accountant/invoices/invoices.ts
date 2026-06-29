import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef, effect, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../services/invoice.service';
import { CrmService } from '../../../services/crm.service';
import { ContractService } from '../../../services/contract.service';
import { ClientFinancialService } from '../../../services/client-financial.service';
import { ThemeService } from '../../../services/theme.service';
import { PdfGeneratorService, InvoiceData, InvoiceTheme } from '../../../services/pdf-generator.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-invoices',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class Invoices implements OnInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private crmService = inject(CrmService);
  private contractService = inject(ContractService);
  private clientService = inject(ClientFinancialService);
  private themeService = inject(ThemeService);
  private pdfService = inject(PdfGeneratorService);
  private toastService = inject(ToastService);
  private renderer = inject(Renderer2);
  public i18n = inject(I18nService);

  @ViewChild('modalOverlay') overlayRef!: ElementRef;
  private overlayMoved = false;

  selectedTheme = signal<InvoiceTheme>('rasd');
  searchQuery = signal('');

  rawInvoices = signal<any[]>([]);
  invoices = signal<any[]>([]);
  
  // Modal signals
  showAddModal = signal(false);
  isSubmitting = signal(false);
  showSuccess = signal(false);

  // Modal form fields
  clients = signal<any[]>([]);
  selectedClientId = signal<number | null>(null);
  contracts = signal<any[]>([]);
  selectedContractId: any = null;
  totalAmount: number | null = null;
  dueDate: string = '';
  invoiceStatus: string = 'Unpaid';

  filteredContracts = computed(() => {
    const clientId = this.selectedClientId();
    if (!clientId) return [];
    return this.contracts().filter(contract => Number(contract.clientId) === Number(clientId));
  });

  stats = signal([
    { label: 'إجمالي الفواتير', value: '$0', color: 'primary', icon: 'fa-file-invoice-dollar' },
    { label: 'مدفوعة', value: '$0', color: 'success', icon: 'fa-circle-check' },
    { label: 'قيد الانتظار', value: '$0', color: 'warning', icon: 'fa-clock' },
    { label: 'متأخرة', value: '$0', color: 'danger', icon: 'fa-triangle-exclamation' },
  ]);

  get themes(): { key: InvoiceTheme; label: string }[] {
    const isAr = this.i18n.currentLang() === 'ar';
    return [
      { key: 'rasd', label: isAr ? 'رصد' : 'RASD' },
      { key: 'modern', label: isAr ? 'عصري' : 'Modern' },
      { key: 'classic', label: isAr ? 'كلاسيكي' : 'Classic' },
      { key: 'minimal', label: isAr ? 'بسيط' : 'Minimal' },
    ];
  }

  get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
  }

  constructor() {
    effect(() => {
      if (this.showAddModal()) {
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

  ngOnInit() {
    this.loadInvoices();
    this.loadContracts();
    this.loadClients();
  }

  ngOnDestroy() {
    if (this.overlayMoved && this.overlayRef?.nativeElement?.parentNode) {
      this.renderer.removeChild(document.body, this.overlayRef.nativeElement);
    }
  }

  loadClients() {
    this.clientService.getClients().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.clients.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load clients', err)
    });
  }

  loadContracts() {
    this.contractService.getContracts().subscribe({
      next: (res) => {
        if (res) {
          this.contracts.set(res);
        }
      },
      error: (err) => console.error('Failed to load contracts', err)
    });
  }

  loadInvoices() {
    this.invoiceService.getInvoices().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const apiInvoices = res.data;

          const mapped = apiInvoices.map((inv: any) => ({
            id: `INV-${String(inv.id).padStart(3, '0')}`,
            numericId: inv.id,
            client: inv.clientName || 'عميل غير معروف',
            amount: `$${Number(inv.totalAmount).toLocaleString()}`,
            amountNum: Number(inv.totalAmount),
            date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'مؤخراً',
            due: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'مؤخراً',
            createdAt: inv.createdAt,
            dueDate: inv.dueDate,
            status: inv.status?.toLowerCase() === 'unpaid' ? 'pending' : inv.status?.toLowerCase() || 'pending'
          }));

          this.rawInvoices.set(mapped);
          this.invoices.set(mapped);

          const total = apiInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
          const paid = apiInvoices.filter((inv: any) => inv.status?.toLowerCase() === 'paid').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
          const pending = apiInvoices.filter((inv: any) => inv.status?.toLowerCase() === 'unpaid' || inv.status?.toLowerCase() === 'pending').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
          const overdue = apiInvoices.filter((inv: any) => inv.status?.toLowerCase() === 'overdue').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

          this.stats.set([
            { label: this.i18n.currentLang() === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices', value: `$${total.toLocaleString()}`, color: 'primary', icon: 'fa-file-invoice-dollar' },
            { label: this.i18n.currentLang() === 'ar' ? 'مدفوعة' : 'Paid', value: `$${paid.toLocaleString()}`, color: 'success', icon: 'fa-circle-check' },
            { label: this.i18n.currentLang() === 'ar' ? 'قيد الانتظار' : 'Pending', value: `$${pending.toLocaleString()}`, color: 'warning', icon: 'fa-clock' },
            { label: this.i18n.currentLang() === 'ar' ? 'متأخرة' : 'Overdue', value: `$${overdue.toLocaleString()}`, color: 'danger', icon: 'fa-triangle-exclamation' }
          ]);
        }
      },
      error: (err) => console.error('Failed to load invoices', err)
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.invoices.set(this.rawInvoices());
      return;
    }
    const q = query.toLowerCase();
    this.invoices.set(
      this.rawInvoices().filter(inv =>
        inv.id.toLowerCase().includes(q) ||
        inv.client.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
      )
    );
  }

  selectTheme(theme: InvoiceTheme) {
    this.selectedTheme.set(theme);
  }

  openAddModal() {
    this.selectedClientId.set(null);
    this.selectedContractId = null;
    this.totalAmount = null;
    this.dueDate = '';
    this.invoiceStatus = 'Unpaid';
    this.isSubmitting.set(false);
    this.showSuccess.set(false);
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.showSuccess.set(false);
  }

  onClientChange(clientId: any) {
    const cid = clientId ? Number(clientId) : null;
    this.selectedClientId.set(cid);
    
    setTimeout(() => {
      const contracts = this.filteredContracts();
      if (cid && contracts.length === 0) {
        this.selectedContractId = 'AUTO_CREATE';
      } else {
        this.selectedContractId = null;
      }
    }, 50);
  }

  onSubmit() {
    if (!this.selectedContractId || !this.totalAmount || !this.dueDate) {
      this.toastService.warning(
        this.i18n.currentLang() === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields'
      );
      return;
    }

    this.isSubmitting.set(true);

    if (this.selectedContractId === 'AUTO_CREATE') {
      // 1. Create a contract automatically
      const contractPayload = {
        clientId: Number(this.selectedClientId()),
        contractTitle: 'Auto Contract',
        contractType: 'General',
        currency: 'SAR',
        contractValue: Number(this.totalAmount),
        taxPercentage: 0,
        discount: 0,
        finalAmount: Number(this.totalAmount),
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
            const newContractId = res.id;
            this.loadContracts();
            this.submitInvoice(newContractId);
          } else {
            this.isSubmitting.set(false);
            this.toastService.error(
              this.i18n.currentLang() === 'ar' ? 'فشل إنشاء عقد تلقائي للعميل' : 'Failed to create auto-contract'
            );
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(
            err.error?.message || (this.i18n.currentLang() === 'ar' ? 'فشل إنشاء عقد تلقائي للعميل' : 'Failed to create auto-contract')
          );
        }
      });
    } else {
      this.submitInvoice(Number(this.selectedContractId));
    }
  }

  private submitInvoice(contractId: number) {
    const payload = {
      contractId: contractId,
      dealId: 0, // Fallback if still required by DB
      totalAmount: Number(this.totalAmount),
      dueDate: new Date(this.dueDate).toISOString(),
      status: this.invoiceStatus
    };

    this.invoiceService.createInvoice(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.showSuccess.set(true);
        this.loadInvoices();
        setTimeout(() => this.closeAddModal(), 3000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error(
          err.error?.message || (this.i18n.currentLang() === 'ar' ? 'فشل إنشاء الفاتورة' : 'Failed to create invoice')
        );
      }
    });
  }

  downloadInvoicePDF(inv: any) {
    const invoiceData: InvoiceData = {
      id: inv.numericId || inv.id,
      invoiceNumber: inv.id,
      clientName: inv.client,
      totalAmount: inv.amountNum,
      paidAmount: inv.status === 'paid' ? inv.amountNum : 0,
      status: inv.status,
      dueDate: inv.dueDate || inv.due,
      createdAt: inv.createdAt || inv.date,
      items: [
        {
          description: this.i18n.currentLang() === 'ar'
            ? 'خدمات وحلول رصد للذكاء الاصطناعي'
            : 'RASD AI Services & Solutions',
          quantity: 1,
          unitPrice: inv.amountNum,
        }
      ],
      taxRate: 0,
    };

    this.pdfService.downloadInvoicePDF(invoiceData, this.selectedTheme());
    this.toastService.success(
      this.i18n.currentLang() === 'ar'
        ? `تم فتح PDF للفاتورة ${inv.id}`
        : `PDF opened for invoice ${inv.id}`,
      this.i18n.currentLang() === 'ar' ? 'تصدير PDF' : 'PDF Export'
    );
  }
}
