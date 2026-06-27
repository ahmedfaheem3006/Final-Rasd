import { Component, signal, computed, inject, ViewChild, ElementRef, effect, Renderer2, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-leave-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-request-modal.html',
  styleUrl: './leave-request-modal.css'
})
export class LeaveRequestModal {
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private leaveService = inject(LeaveService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);

  @ViewChild('premiumModal') premiumModalRef!: ElementRef;
  @ViewChild('modalOverlay') overlayRef!: ElementRef;
  private overlayMoved = false;

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  // Modal state
  showModal = signal(true);
  isSubmitting = signal(false);

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
  newRole = 'موظف';
  newRoleId = 7;
  newEmployeeId: number | null = null;
  newType = 'إجازة سنوية';
  newStartDate = '';
  newEndDate = '';
  newReason = '';

  // Leave type mapping
  private leaveTypeMap: Record<string, string> = {
    'إجازة سنوية': 'Annual',
    'إجازة مرضية': 'Sick',
    'إجازة طارئة': 'Emergency',
    'إجازة شخصية': 'Personal',
    'إجازة غير مدفوعة': 'Unpaid'
  };

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

  constructor() {
    this.loadEmployees();

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
        this.close.emit();
      }
    });
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
    document.body.style.overflow = '';
    if (this.overlayMoved && this.overlayRef?.nativeElement?.parentNode) {
      this.renderer.removeChild(document.body, this.overlayRef.nativeElement);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showModal()) {
      this.closeModal();
    }
  }

  get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
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
        console.error('[LeaveRequestModal] Failed to load employees', err);
      }
    });
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

  closeModal() {
    this.showModal.set(false);
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('premium-modal-overlay')) {
      this.closeModal();
    }
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

    const expectedRole = this.translateRole(emp.roleName);
    if (this.newRole !== expectedRole) {
      this.newRole = expectedRole;
      this.newRoleId = Number(emp.roleId);
    }

    if (!this.newStartDate || !this.newEndDate) {
      this.toastService.warning('الرجاء تعبئة تاريخ البداية والنهاية');
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
          this.toastService.success(`تم تقديم طلب إجازة باسم "${emp.fullName}" بنجاح`, 'تقديم طلب إجازة');
          this.created.emit();
          this.closeModal();
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'فشل تقديم طلب الإجازة';
        this.toastService.error(msg, 'خطأ');
      }
    });
  }
}
