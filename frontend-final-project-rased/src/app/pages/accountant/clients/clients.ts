import { Component, signal, computed, inject, OnInit, AfterViewInit, OnDestroy, HostBinding, HostListener, ViewChild, ElementRef, effect, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientFinancialService } from '../../../services/client-financial.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';
import { I18nService } from '../../../services/i18n.service';
import { ClientDetail } from '../client-detail/client-detail';

@Component({
  selector: 'app-accountant-clients',
  imports: [CommonModule, FormsModule, RouterModule, ClientDetail],
  templateUrl: './clients.html',
  styleUrl: './clients.css'
})
export class AccountantClients implements OnInit, AfterViewInit, OnDestroy {
  public i18n = inject(I18nService);
  private clientService = inject(ClientFinancialService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);

  stats = signal<any[]>([]);
  loadingStats = signal(true);

  @ViewChild('premiumModal') premiumModalRef!: ElementRef;
  @ViewChild('modalOverlay') overlayRef!: ElementRef;
  private overlayMoved = false;

  @HostBinding('class.light-theme') get isLightTheme() {
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
        setTimeout(() => this.focusFirstElement(), 120);
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showAddModal()) this.closeAddModal();
  }

  private focusFirstElement() {
    if (!this.premiumModalRef?.nativeElement) return;
    const el: HTMLElement = this.premiumModalRef.nativeElement;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) (focusable[0] as HTMLElement).focus();
  }

  clients = signal<any[]>([]);
  searchQuery = signal('');
  filterStatus = signal('all');

  filteredClients = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    return this.clients().filter(c => {
      const matchesSearch = !query || c.companyName?.toLowerCase().includes(query) || c.ownerName?.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query) || c.phone?.includes(query);
      const matchesStatus = status === 'all' || c.status?.toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
  });

  clientsLoading = signal(true);
  showAddModal = signal(false);
  isSubmitting = signal(false);
  showSuccess = signal(false);
  selectedDetailId = signal<number | null>(null);

  // Form fields
  companyName = '';
  commercialRegistration = '';
  taxNumber = '';
  industry = '';
  website = '';
  companySize = '';
  description = '';
  ownerName = '';
  email = '';
  phone = '';
  jobTitle = '';
  country = '';
  governorate = '';
  city = '';
  street = '';
  postalCode = '';
  creditLimit: number | null = null;
  paymentTerms = '';
  currency = 'USD';
  openingBalance: number | null = null;
  taxPercentage: number | null = null;
  clientStatus = 'Active';

  industries = ['technology', 'finance', 'healthcare', 'education', 'real_estate', 'retail', 'manufacturing', 'logistics', 'consulting', 'other'];
  currencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'other'];
  paymentTermOptions = ['net_15', 'net_30', 'net_60', 'net_90', 'due_on_receipt'];
  companySizes = ['1_10', '11_50', '51_200', '201_1000', '1000_plus'];

  // Edit mode
  editingId: number | null = null;
  isEditing = computed(() => this.editingId !== null);

  ngOnInit() {
    this.loadStats();
    this.loadClients();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.overlayMoved && this.overlayRef?.nativeElement) {
        this.renderer.appendChild(document.body, this.overlayRef.nativeElement);
        this.overlayMoved = true;
      }
    });
  }

  ngOnDestroy() {
    if (this.overlayMoved && this.overlayRef?.nativeElement?.parentNode) {
      this.renderer.removeChild(document.body, this.overlayRef.nativeElement);
    }
  }

  loadClients() {
    this.clientsLoading.set(true);
    this.clientService.getClients().subscribe({
      next: (res) => {
        this.clientsLoading.set(false);
        if (res?.success && res.data) this.clients.set(res.data);
      },
      error: () => {
        this.clientsLoading.set(false);
        this.toastService.error(this.i18n.t('clients.error.load'), this.i18n.t('common.error'));
      }
    });
  }

  loadStats() {
    this.loadingStats.set(true);
    this.clientService.getClients().subscribe({
      next: (res) => {
        this.loadingStats.set(false);
        if (res?.success && res.data) {
          const data = res.data;
          const total = data.length;
          const active = data.filter((c: any) => c.status === 'Active').length;
          const outstanding = data.reduce((sum: number, c: any) => sum + (c.outstandingBalance || 0), 0);
          const revenue = data.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0);
          this.stats.set([
            { label: 'clients.stats.total', value: total, color: 'primary', icon: 'fa-building' },
            { label: 'clients.stats.active', value: active, color: 'success', icon: 'fa-circle-check' },
            { label: 'clients.stats.outstanding', value: '$' + outstanding.toLocaleString(), color: 'warning', icon: 'fa-credit-card' },
            { label: 'clients.stats.revenue', value: '$' + revenue.toLocaleString(), color: 'info', icon: 'fa-chart-line' },
          ]);
        }
      },
      error: () => this.loadingStats.set(false)
    });
  }

  resetForm() {
    this.companyName = '';
    this.commercialRegistration = '';
    this.taxNumber = '';
    this.industry = '';
    this.website = '';
    this.companySize = '';
    this.description = '';
    this.ownerName = '';
    this.email = '';
    this.phone = '';
    this.jobTitle = '';
    this.country = '';
    this.governorate = '';
    this.city = '';
    this.street = '';
    this.postalCode = '';
    this.creditLimit = null;
    this.paymentTerms = '';
    this.currency = 'USD';
    this.openingBalance = null;
    this.taxPercentage = null;
    this.clientStatus = 'Active';
    this.editingId = null;
  }

  openAddModal() {
    this.resetForm();
    this.isSubmitting.set(false);
    this.showSuccess.set(false);
    this.showAddModal.set(true);
  }

  openEditModal(client: any) {
    this.resetForm();
    this.editingId = client.id;
    this.companyName = client.companyName || '';
    this.commercialRegistration = client.commercialRegistration || '';
    this.taxNumber = client.taxNumber || '';
    this.industry = client.industry || '';
    this.website = client.website || '';
    this.companySize = client.companySize || '';
    this.description = client.description || '';
    this.ownerName = client.ownerName || '';
    this.email = client.email || '';
    this.phone = client.phone || '';
    this.jobTitle = client.jobTitle || '';
    this.country = client.country || '';
    this.governorate = client.governorate || '';
    this.city = client.city || '';
    this.street = client.street || '';
    this.postalCode = client.postalCode || '';
    this.creditLimit = client.creditLimit || null;
    this.paymentTerms = client.paymentTerms || '';
    this.currency = client.currency || 'USD';
    this.openingBalance = client.openingBalance || null;
    this.taxPercentage = client.taxPercentage || null;
    this.clientStatus = client.status || 'Active';
    this.isSubmitting.set(false);
    this.showSuccess.set(false);
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.showSuccess.set(false);
  }

  openDetailModal(id: number) {
    this.selectedDetailId.set(id);
  }

  closeDetailModal() {
    this.selectedDetailId.set(null);
  }

  onSubmit() {
    if (!this.companyName || !this.ownerName || !this.email || !this.phone) {
      this.toastService.warning(this.i18n.t('clients.error.validate'));
      return;
    }
    this.isSubmitting.set(true);
    const payload = {
      companyName: this.companyName,
      commercialRegistration: this.commercialRegistration,
      taxNumber: this.taxNumber,
      industry: this.industry,
      website: this.website,
      companySize: this.companySize,
      description: this.description,
      ownerName: this.ownerName,
      email: this.email,
      phone: this.phone,
      jobTitle: this.jobTitle,
      country: this.country,
      governorate: this.governorate,
      city: this.city,
      street: this.street,
      postalCode: this.postalCode,
      creditLimit: this.creditLimit,
      paymentTerms: this.paymentTerms,
      currency: this.currency,
      openingBalance: this.openingBalance,
      taxPercentage: this.taxPercentage,
      status: this.clientStatus
    };

    const request = this.editingId
      ? this.clientService.updateClient(this.editingId, payload)
      : this.clientService.createClient(payload);

    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showSuccess.set(true);
        this.loadClients();
        this.loadStats();
        setTimeout(() => this.closeAddModal(), 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error(err.error?.message || this.i18n.t('clients.error.create'), this.i18n.t('common.error'));
      }
    });
  }

  onDelete(client: any) {
    if (!confirm(this.i18n.tFormat('clients.confirm.delete', { name: client.companyName }))) return;
    this.clientService.deleteClient(client.id).subscribe({
      next: () => {
        this.toastService.success(this.i18n.tFormat('clients.success.deleted', { name: client.companyName }), this.i18n.t('common.success'));
        this.loadClients();
        this.loadStats();
      },
      error: (err) => this.toastService.error(err.error?.message || this.i18n.t('common.error'))
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(event: Event) {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const locale = this.i18n.isRtl() ? 'ar-SA' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  onExport() {
    this.toastService.success(this.i18n.t('common.export'), this.i18n.t('common.success'));
  }
}
