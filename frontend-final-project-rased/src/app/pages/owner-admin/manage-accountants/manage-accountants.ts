import { Component, signal, computed, inject, OnInit, AfterViewInit, OnDestroy, HostBinding, HostListener, ViewChild, ElementRef, effect, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountantService } from '../../../services/accountant.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-manage-accountants',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-accountants.html',
  styleUrl: './manage-accountants.css'
})
export class ManageAccountants implements OnInit, AfterViewInit, OnDestroy {
  public i18n = inject(I18nService);
  private accountantService = inject(AccountantService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);

  stats = signal<any[]>([]);
  loadingStats = signal(true);
  animFrameId: number | null = null;

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

  accountants = signal<any[]>([]);
  searchQuery = signal('');
  filterStatus = signal('all');

  filteredAccountants = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    return this.accountants().filter(a => {
      const matchesSearch = !query || a.fullName.toLowerCase().includes(query) || a.email.toLowerCase().includes(query) || (a.phone && a.phone.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || a.status.toLowerCase() === status;
      const matchesFilter = this.filterBy() === 'all' || (this.filterBy() === 'newest' && a.status) || true;
      return matchesSearch && matchesStatus;
    });
  });

  displayAccountants = computed(() => {
    let list = [...this.filteredAccountants()];
    const filter = this.filterBy();
    if (filter === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (filter === 'oldest') list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list.map(a => ({ ...a, joinedDisplay: this.formatDate(a.createdAt) }));
  });

  filterBy = signal('all');

  showAddModal = signal(false);
  isSubmitting = signal(false);
  showSuccess = signal(false);
  showPassword = signal(false);

  newFirstName = '';
  newLastName = '';
  newEmail = '';
  newPhone = '';
  newPassword = '';
  confirmPassword = '';
  newStatus = 'Active';

  accountantsLoading = signal(true);

  ngOnInit() {
    this.loadStats();
    this.loadAccountants();
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
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.overlayMoved && this.overlayRef?.nativeElement?.parentNode) {
      this.renderer.removeChild(document.body, this.overlayRef.nativeElement);
    }
  }

  loadAccountants() {
    this.accountantsLoading.set(true);
    this.accountantService.getAccountants().subscribe({
      next: (res) => {
        this.accountantsLoading.set(false);
        if (res?.success && res.data) {
          this.accountants.set(res.data);
        }
      },
      error: () => {
        this.accountantsLoading.set(false);
        this.toastService.error(this.i18n.t('accountants.error.load'), this.i18n.t('common.error'));
      }
    });
  }

  loadStats() {
    this.loadingStats.set(true);
    this.accountantService.getDashboardStats().subscribe({
      next: (res) => {
        this.loadingStats.set(false);
        if (res?.success && res.data) {
          this.stats.set([
            { label: 'accountants.stats.total', value: res.data.totalClients || this.accountants().length, color: 'primary', icon: 'fa-calculator' },
            { label: 'accountants.stats.active', value: res.data.activeClients || 0, color: 'success', icon: 'fa-circle-check' },
            { label: 'accountants.stats.inactive', value: 0, color: 'danger', icon: 'fa-circle-xmark' },
            { label: 'accountants.stats.recent', value: 0, color: 'info', icon: 'fa-clock' }
          ]);
        }
      },
      error: () => this.loadingStats.set(false)
    });
  }

  openAddModal() {
    this.newFirstName = '';
    this.newLastName = '';
    this.newEmail = '';
    this.newPhone = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.newStatus = 'Active';
    this.showPassword.set(false);
    this.isSubmitting.set(false);
    this.showSuccess.set(false);
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.showSuccess.set(false);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onAddAccountant() {
    if (!this.newFirstName || !this.newLastName || !this.newEmail || !this.newPassword) {
      this.toastService.warning(this.i18n.t('accountants.error.validate'));
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toastService.warning(this.i18n.t('users.error.password_mismatch'));
      return;
    }
    if (this.newPassword.length < 8) {
      this.toastService.warning(this.i18n.t('accountants.error.password_length'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newEmail)) {
      this.toastService.warning(this.i18n.t('users.error.invalid_email'));
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      firstName: this.newFirstName,
      lastName: this.newLastName,
      email: this.newEmail,
      phone: this.newPhone,
      password: this.newPassword,
      confirmPassword: this.confirmPassword,
      status: this.newStatus
    };

    this.accountantService.createAccountant(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showSuccess.set(true);
        this.loadAccountants();
        this.loadStats();
        setTimeout(() => this.closeAddModal(), 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || this.i18n.t('accountants.error.create');
        this.toastService.error(msg, this.i18n.t('common.error'));
      }
    });
  }

  onActivate(accountant: any) {
    this.accountantService.updateAccountantStatus(accountant.id, 'Active').subscribe({
      next: () => {
        this.toastService.success(this.i18n.tFormat('accountants.success.activated', { name: accountant.fullName }), this.i18n.t('common.success'));
        this.loadAccountants();
      },
      error: (err) => this.toastService.error(err.error?.message || this.i18n.t('common.error'))
    });
  }

  onDeactivate(accountant: any) {
    this.accountantService.updateAccountantStatus(accountant.id, 'Inactive').subscribe({
      next: () => {
        this.toastService.success(this.i18n.tFormat('accountants.success.deactivated', { name: accountant.fullName }), this.i18n.t('common.success'));
        this.loadAccountants();
      },
      error: (err) => this.toastService.error(err.error?.message || this.i18n.t('common.error'))
    });
  }

  onDelete(accountant: any) {
    if (!confirm(this.i18n.tFormat('accountants.confirm.delete', { name: accountant.fullName }))) return;
    this.accountantService.deleteAccountant(accountant.id).subscribe({
      next: () => {
        this.toastService.success(this.i18n.tFormat('accountants.success.deleted', { name: accountant.fullName }), this.i18n.t('common.success'));
        this.loadAccountants();
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

  onSortFilter(event: Event) {
    this.filterBy.set((event.target as HTMLSelectElement).value);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
    return name[0] || '?';
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const locale = this.i18n.isRtl() ? 'ar-SA' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
