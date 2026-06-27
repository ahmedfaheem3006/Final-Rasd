import { Component, signal, computed, inject, OnInit, AfterViewInit, OnDestroy, HostBinding, HostListener, ViewChild, ElementRef, effect, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { LeaveService } from '../../../services/leave.service';
import { ThemeService } from '../../../services/theme.service';
import { I18nService } from '../../../services/i18n.service';

interface PremiumStatCard {
  label: string;
  value: number;
  displayValue: number;
  color: string;
  icon: string;
  trendLabel: string;
  trendUp: boolean;
}

@Component({
  selector: 'app-leave-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-requests.html',
  styleUrl: './leave-requests.css'
})
export class LeaveRequests implements OnInit, AfterViewInit, OnDestroy {
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private leaveService = inject(LeaveService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);

  @ViewChild('premiumModal') premiumModalRef!: ElementRef;
  @ViewChild('modalOverlay') overlayRef!: ElementRef;
  private overlayMoved = false;
  private animFrameId = 0;

  premiumStats = signal<PremiumStatCard[]>([]);

  @HostBinding('class.light-theme') get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
  }

  constructor() {
    effect(() => {
      if (this.showModal()) {
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
    if (this.showModal()) {
      this.closeModal();
    }
  }

  private focusFirstElement() {
    if (!this.premiumModalRef?.nativeElement) return;
    const el: HTMLElement = this.premiumModalRef.nativeElement;
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }
  }

  requests = signal<any[]>([]);
  stats = signal<any[]>([]);

  // Loading states
  loading = signal(false);

  // Search & Filter
  searchQuery = signal('');
  activeFilter = signal<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  currentPage = signal(1);
  pageSize = 10;

  filteredRequests = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const f = this.activeFilter();
    let list = this.requests();
    if (f !== 'all') list = list.filter(r => r.status === f);
    if (q) list = list.filter(r =>
      r.employeeName.toLowerCase().includes(q) ||
      r.leaveType.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
    return list;
  });

  paginatedRequests = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize;
    const list = this.filteredRequests();
    return list.slice((page - 1) * size, page * size);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRequests().length / this.pageSize)));
  pageInfoText = computed(() => this.i18n.tFormat('leaves.pagination.page', { current: String(this.currentPage()), total: String(this.totalPages()) }));

  // Modal State
  showModal = signal(false);
  isSubmitting = signal(false);
  editingRequest: any | null = null;

  // Employee list from DB
  employees = signal<any[]>([]);
  loadingEmployees = signal(false);
  noEmployees = computed(() => !this.loadingEmployees() && this.employees().length === 0);

  // Autocomplete state
  searchTerm = signal('');
  showDropdown = signal(false);
  selectedEmployee = signal<any | null>(null);
  employeeError = signal('');
  filteredIndex = signal(-1);

  filteredEmployees = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.employees();
    if (!term) return list;
    return list.filter((e: any) =>
      e.fullName.toLowerCase().includes(term) ||
      e.email?.toLowerCase().includes(term)
    );
  });

  // Form Fields
  newEmployee = '';
  newRole = this.i18n.t('role.employee');
  newRoleId = 7;
  newEmployeeId: number | null = null;
  newType = 'Annual';
  newStartDate = '';
  newEndDate = '';
  newReason = '';
  leaveTypeOptions = ['Annual', 'Sick', 'Emergency', 'Personal', 'Unpaid'];

  ngOnInit() {
    this.loadLeaveRequests();
    this.loadEmployees();
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
    document.body.style.overflow = '';
  }

  private loadEmployees() {
    this.loadingEmployees.set(true);
    this.authService.getUsers().subscribe({
      next: (res) => {
        this.loadingEmployees.set(false);
        if (res && res.success && res.data) {
          const allUsers: any[] = res.data;
          const filtered = allUsers.filter((u: any) => {
            const roleId = Number(u.roleId);
            return roleId >= 3 && roleId <= 7;
          }).map((u: any) => ({
            ...u,
            roleLabel: this.translateRole(u.roleName)
          }));
          this.employees.set(filtered);
        }
      },
      error: (err) => {
        this.loadingEmployees.set(false);
        console.error('[LeaveRequests] Failed to load employees', err);
      }
    });
  }

  private translateRole(roleName: string): string {
    if (!roleName) return this.i18n.t('role.employee');
    const key = 'role.' + roleName.toLowerCase().replace(/\s+/g, '');
    const translated = this.i18n.t(key);
    return translated !== key ? translated : (roleName || this.i18n.t('role.employee'));
  }

  translateRoleName(roleName: string): string {
    return this.translateRole(roleName);
  }

  translateLeaveType(type: string): string {
    if (!type) return '';
    const key = 'leaves.type.' + type.toLowerCase();
    const translated = this.i18n.t(key);
    return translated !== key ? translated : type;
  }

  translateStatus(status: string): string {
    if (!status) return '';
    const key = 'leaves.status.' + status.toLowerCase();
    const translated = this.i18n.t(key);
    return translated !== key ? translated : status;
  }

  onSearchInput(value: string) {
    this.searchTerm.set(value);
    this.showDropdown.set(true);
    this.filteredIndex.set(-1);
    this.employeeError.set('');
    if (!value.trim()) {
      this.selectedEmployee.set(null);
      this.newEmployee = '';
      this.newRole = this.i18n.t('role.employee');
      this.newRoleId = 7;
      this.newEmployeeId = null;
    }
  }

  selectEmployee(emp: any) {
    this.selectedEmployee.set(emp);
    this.newEmployee = emp.fullName;
    this.newRole = this.translateRole(emp.roleName);
    this.newRoleId = Number(emp.roleId);
    this.newEmployeeId = Number(emp.id);
    this.searchTerm.set(emp.fullName);
    this.showDropdown.set(false);
    this.employeeError.set('');
    this.filteredIndex.set(-1);
  }

  onSearchBlur() {
    setTimeout(() => { this.showDropdown.set(false); this.filteredIndex.set(-1); }, 200);
  }

  onSearchFocus() {
    if (this.employees().length > 0) this.showDropdown.set(true);
  }

  onDropdownKeydown(event: KeyboardEvent) {
    const filtered = this.filteredEmployees();
    if (!filtered.length) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.filteredIndex.set(Math.min(this.filteredIndex() + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.filteredIndex.set(Math.max(this.filteredIndex() - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (this.filteredIndex() >= 0 && this.filteredIndex() < filtered.length)
          this.selectEmployee(filtered[this.filteredIndex()]);
        break;
      case 'Escape':
        this.showDropdown.set(false);
        this.filteredIndex.set(-1);
        break;
    }
  }

  private loadLeaveRequests() {
    this.loading.set(true);
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.success && res.data) {
          this.requests.set(res.data);
          this.recalculateStats();
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('[LeaveRequests] Failed to load', err);
        this.toastService.error(this.i18n.t('leaves.error.load'), this.i18n.t('leaves.error.load_title'));
      }
    });
  }

  private recalculateStats() {
    const list = this.requests();
    const total = list.length;
    const pending = list.filter(r => r.status === 'Pending').length;
    const approved = list.filter(r => r.status === 'Approved').length;
    const rejected = list.filter(r => r.status === 'Rejected').length;
    this.stats.set([
      { label: 'leaves.stats.total', value: total, color: 'primary' },
      { label: 'leaves.stats.pending', value: pending, color: 'warning' },
      { label: 'leaves.stats.approved', value: approved, color: 'success' },
      { label: 'leaves.stats.rejected', value: rejected, color: 'danger' },
    ]);
    this.startCardAnimation();
  }

  private getIconForLabel(label: string): string {
    switch (label) {
      case 'leaves.stats.total': return 'fa-clipboard-list';
      case 'leaves.stats.pending': return 'fa-clock';
      case 'leaves.stats.approved': return 'fa-circle-check';
      case 'leaves.stats.rejected': return 'fa-circle-xmark';
      default: return 'fa-chart-simple';
    }
  }

  private startCardAnimation() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    const currentStats = this.stats();
    if (currentStats.length === 0) return;
    const total = currentStats[0].value || 1;
    const targetCards = currentStats.map(s => ({
      label: s.label,
      value: s.value,
      color: s.color,
      icon: this.getIconForLabel(s.label),
      displayValue: 0,
      trendLabel: '',
      trendUp: true
    }));
    const duration = 1000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.premiumStats.set(targetCards.map(c => {
        const currentValue = Math.round(c.value * eased);
        let trendText = '';
        if (c.label !== 'leaves.stats.total') {
          const pct = c.value > 0 && total > 0 ? Math.round(c.value / total * 100) : 0;
          trendText = `${pct}%`;
        } else {
          trendText = this.i18n.t('leaves.error.stats_total');
        }
        return { ...c, displayValue: currentValue, trendLabel: trendText, trendUp: true };
      }));
      if (progress < 1) this.animFrameId = requestAnimationFrame(animate);
    };
    this.animFrameId = requestAnimationFrame(animate);
  }

  setFilter(f: 'all' | 'Pending' | 'Approved' | 'Rejected') {
    this.activeFilter.set(f);
    this.currentPage.set(1);
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  onApproveLeave(req: any) {
    this.leaveService.approveLeaveRequest(req.id).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success(
            this.i18n.tFormat('leaves.approve.success', { name: req.employeeName }),
            this.i18n.t('leaves.approve.title')
          );
          this.loadLeaveRequests();
        }
      },
      error: (err) => {
        const msg = err.error?.message || this.i18n.t('leaves.approve.error');
        this.toastService.error(msg, this.i18n.t('leaves.error.load_title'));
      }
    });
  }

  onRejectLeave(req: any) {
    const reason = prompt(this.i18n.t('leaves.reject.prompt'));
    this.leaveService.rejectLeaveRequest(req.id, reason || undefined).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.warning(
            this.i18n.tFormat('leaves.reject.success', { name: req.employeeName }),
            this.i18n.t('leaves.reject.title')
          );
          this.loadLeaveRequests();
        }
      },
      error: (err) => {
        const msg = err.error?.message || this.i18n.t('leaves.reject.error');
        this.toastService.error(msg, this.i18n.t('leaves.error.load_title'));
      }
    });
  }

  onDeleteRequest(req: any) {
    if (!confirm(this.i18n.tFormat('leaves.confirm.delete', { name: req.employeeName }))) return;
    this.leaveService.deleteLeaveRequest(req.id).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success(
            this.i18n.t('leaves.delete.success'),
            this.i18n.t('leaves.delete.title')
          );
          this.loadLeaveRequests();
        }
      },
      error: (err) => {
        const msg = err.error?.message || this.i18n.t('leaves.delete.error');
        this.toastService.error(msg, this.i18n.t('leaves.error.load_title'));
      }
    });
  }

  openModal() {
    this.newEmployee = '';
    this.newRole = this.i18n.t('role.employee');
    this.newRoleId = 7;
    this.newEmployeeId = null;
    this.newType = 'Annual';
    this.newStartDate = '';
    this.newEndDate = '';
    this.newReason = '';
    this.searchTerm.set('');
    this.selectedEmployee.set(null);
    this.showDropdown.set(false);
    this.employeeError.set('');
    this.filteredIndex.set(-1);
    this.editingRequest = null;
    this.isSubmitting.set(false);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    this.employeeError.set('');
    this.isSubmitting.set(true);

    if (!this.selectedEmployee()) {
      const matching = this.employees().find((e: any) =>
        e.fullName === this.newEmployee ||
        e.fullName.trim().toLowerCase() === this.newEmployee.trim().toLowerCase()
      );
      if (matching) this.selectEmployee(matching);
      else {
        this.employeeError.set(this.i18n.t('leaves.form.no_employee'));
        this.isSubmitting.set(false);
        return;
      }
    }

    const emp = this.selectedEmployee();
    if (!emp) {
      this.employeeError.set(this.i18n.t('leaves.form.no_employee'));
      this.isSubmitting.set(false);
      return;
    }

    const expectedRole = this.translateRole(emp.roleName);
    if (this.newRole !== expectedRole) {
      this.newRole = expectedRole;
      this.newRoleId = Number(emp.roleId);
    }

    if (!this.newStartDate || !this.newEndDate) {
      this.toastService.warning(this.i18n.t('leaves.error.validate_dates'));
      this.isSubmitting.set(false);
      return;
    }

    const startDate = new Date(this.newStartDate);
    const endDate = new Date(this.newEndDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    this.leaveService.createLeaveRequest({
      employeeId: Number(emp.id),
      roleId: this.newRoleId,
      leaveType: this.newType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason: this.newReason || undefined
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          this.toastService.success(
            this.i18n.tFormat('leaves.success.created', { name: emp.fullName }),
            this.i18n.t('leaves.success.created_title')
          );
          this.loadLeaveRequests();
          this.closeModal();
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || this.i18n.t('leaves.error.create');
        this.toastService.error(msg, this.i18n.t('leaves.error.load_title'));
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const locale = this.i18n.isRtl() ? 'ar-SA' : 'en-US';
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
