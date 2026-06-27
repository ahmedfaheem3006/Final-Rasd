import { Component, signal, computed, inject, OnInit, AfterViewInit, OnDestroy, HostBinding, HostListener, ViewChild, ElementRef, effect, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { LeaveService } from '../../../services/leave.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';

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
  selector: 'app-employee-manager-leave-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-requests.html',
  styleUrl: './leave-requests.css'
})
export class EmployeeManagerLeaveRequests implements OnInit, AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private leaveService = inject(LeaveService);
  private toastService = inject(ToastService);
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
    effect(() => {
      const s = this.stats();
      if (s.length > 0 && !this.loading()) {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.startCardAnimation(s);
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

  loading = signal(false);
  activeFilter = signal<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  currentPage = signal(1);
  pageSize = 10;

  requests = signal<any[]>([]);

  filteredRequests = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.requests();
    return this.requests().filter(r => r.status === f);
  });

  paginatedRequests = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize;
    const list = this.filteredRequests();
    return list.slice((page - 1) * size, page * size);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRequests().length / this.pageSize)));

  stats = computed(() => [
    { label: 'إجمالي الطلبات', value: this.requests().length, color: 'primary' },
    { label: 'قيد الانتظار', value: this.requests().filter(r => r.status === 'Pending').length, color: 'warning' },
    { label: 'معتمدة', value: this.requests().filter(r => r.status === 'Approved').length, color: 'success' },
    { label: 'مرفوضة', value: this.requests().filter(r => r.status === 'Rejected').length, color: 'danger' },
  ]);

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

  // Modal state
  showModal = signal(false);
  isSubmitting = signal(false);
  newEmployee = '';
  newRole = 'موظف';
  newRoleId = 7;
  newEmployeeId: number | null = null;
  newType = 'إجازة سنوية';
  newStartDate = '';
  newEndDate = '';
  newReason = '';

  private leaveTypeMap: Record<string, string> = {
    'إجازة سنوية': 'Annual',
    'إجازة مرضية': 'Sick',
    'إجازة طارئة': 'Emergency',
    'إجازة شخصية': 'Personal',
    'إجازة غير مدفوعة': 'Unpaid'
  };
  private reverseLeaveTypeMap: Record<string, string> = {
    'Annual': 'إجازة سنوية',
    'Sick': 'إجازة مرضية',
    'Emergency': 'إجازة طارئة',
    'Personal': 'إجازة شخصية',
    'Unpaid': 'إجازة غير مدفوعة'
  };

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
        console.error('[EmployeeManagerLeaveRequests] Failed to load employees', err);
      }
    });
  }

  getAvatar(name: string): string {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
  }

  private translateRole(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'accountant': return 'محاسب';
      case 'salesmanager': return 'مدير مبيعات';
      case 'sales': return 'مندوب مبيعات';
      case 'employeemanager': return 'مدير الموظفين';
      case 'employee': return 'موظف';
      default: return roleName || 'موظف';
    }
  }

  translateRoleName(roleName: string): string {
    return this.translateRole(roleName);
  }

  translateLeaveType(type: string): string {
    return this.reverseLeaveTypeMap[type] || type;
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'Pending': return 'قيد الانتظار';
      case 'Approved': return 'معتمدة';
      case 'Rejected': return 'مرفوضة';
      default: return status;
    }
  }

  onSearchInput(value: string) {
    this.searchTerm.set(value);
    this.showDropdown.set(true);
    this.filteredIndex.set(-1);
    this.employeeError.set('');
    if (!value.trim()) {
      this.selectedEmployee.set(null);
      this.newEmployee = '';
      this.newRole = 'موظف';
      this.newEmployeeId = null;
    }
  }

  selectEmployee(emp: any) {
    this.selectedEmployee.set(emp);
    this.newEmployee = emp.fullName;
    this.newRole = this.translateRole(emp.roleName);
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

  setFilter(f: 'all' | 'Pending' | 'Approved' | 'Rejected') {
    this.activeFilter.set(f);
    this.currentPage.set(1);
  }

  prevPage() { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  private loadLeaveRequests() {
    this.loading.set(true);
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.success && res.data) this.requests.set(res.data);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('[EmployeeManagerLeaveRequests] Failed to load', err);
        this.toastService.error('فشل تحميل طلبات الإجازات', 'خطأ');
      }
    });
  }

  onApproveLeave(req: any) {
    this.leaveService.approveLeaveRequest(req.id).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success('تم اعتماد طلب الإجازة', 'اعتماد');
          this.loadLeaveRequests();
        }
      },
      error: (err) => this.toastService.error(err.error?.message || 'فشل الاعتماد', 'خطأ')
    });
  }

  onRejectLeave(req: any) {
    const reason = prompt('سبب الرفض (اختياري):');
    this.leaveService.rejectLeaveRequest(req.id, reason || undefined).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.warning('تم رفض طلب الإجازة', 'رفض');
          this.loadLeaveRequests();
        }
      },
      error: (err) => this.toastService.error(err.error?.message || 'فشل الرفض', 'خطأ')
    });
  }

  onDeleteRequest(req: any) {
    if (!confirm(`حذف طلب إجازة "${req.employeeName}"؟`)) return;
    this.leaveService.deleteLeaveRequest(req.id).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success('تم الحذف', 'حذف');
          this.loadLeaveRequests();
        }
      },
      error: (err) => this.toastService.error(err.error?.message || 'فشل الحذف', 'خطأ')
    });
  }

  openModal() {
    this.newEmployee = '';
    this.newRole = 'موظف';
    this.newEmployeeId = null;
    this.newType = 'إجازة سنوية';
    this.newStartDate = '';
    this.newEndDate = '';
    this.newReason = '';
    this.searchTerm.set('');
    this.selectedEmployee.set(null);
    this.showDropdown.set(false);
    this.employeeError.set('');
    this.filteredIndex.set(-1);
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
        this.employeeError.set('لا يوجد موظف بهذا الاسم في النظام');
        this.isSubmitting.set(false);
        return;
      }
    }

    const emp = this.selectedEmployee();
    if (!emp) {
      this.employeeError.set('لا يوجد موظف بهذا الاسم في النظام');
      this.isSubmitting.set(false);
      return;
    }

    const expectedRole = this.translateRoleName(emp.roleName);
    if (this.newRole !== expectedRole) this.newRole = expectedRole;

    if (!this.newStartDate || !this.newEndDate) {
      this.toastService.warning('الرجاء تعبئة تاريخ البدء والنهاية');
      this.isSubmitting.set(false);
      return;
    }

    const apiLeaveType = this.leaveTypeMap[this.newType] || this.newType;
    const startDate = new Date(this.newStartDate);
    const endDate = new Date(this.newEndDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    this.leaveService.createLeaveRequest({
      employeeId: Number(emp.id),
      roleId: this.newRoleId,
      leaveType: apiLeaveType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason: this.newReason || undefined
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          this.toastService.success(`تم تقديم طلب إجازة باسم "${emp.fullName}"`, 'تقديم طلب إجازة');
          this.loadLeaveRequests();
          this.closeModal();
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error(err.error?.message || 'فشل تقديم الطلب', 'خطأ');
      }
    });
  }

  private getIconForLabel(label: string): string {
    switch (label) {
      case 'إجمالي الطلبات': return 'fa-clipboard-list';
      case 'قيد الانتظار': return 'fa-clock';
      case 'معتمدة': return 'fa-circle-check';
      case 'مرفوضة': return 'fa-circle-xmark';
      default: return 'fa-chart-simple';
    }
  }

  private startCardAnimation(currentStats: { label: string; value: number; color: string }[]) {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
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
        if (c.label !== 'إجمالي الطلبات') {
          const pct = c.value > 0 && total > 0 ? Math.round(c.value / total * 100) : 0;
          trendText = `${pct}%`;
        } else {
          trendText = 'الإجمالي';
        }
        return { ...c, displayValue: currentValue, trendLabel: trendText, trendUp: true };
      }));
      if (progress < 1) this.animFrameId = requestAnimationFrame(animate);
    };
    this.animFrameId = requestAnimationFrame(animate);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
