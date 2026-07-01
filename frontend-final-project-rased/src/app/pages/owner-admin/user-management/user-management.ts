import { Component, signal, computed, inject, OnInit, AfterViewInit, OnDestroy, HostBinding, HostListener, ViewChild, ElementRef, effect, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
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

interface RoleCard {
  id: number;
  name: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit, AfterViewInit, OnDestroy {
  public i18n = inject(I18nService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);

  premiumStats = signal<PremiumStatCard[]>([]);
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
    if (this.showAddModal()) {
      this.closeAddModal();
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

  users = signal<any[]>([]);

  // List of roles for select menus (Role ID + Label)
  filterRoleId = signal<number | null>(null);

  filteredUsers = computed(() => {
    const roleId = this.filterRoleId();
    const all = this.users();
    if (!roleId) return all;
    return all.filter(u => u.roleId === roleId);
  });

  displayUsers = computed(() => {
    return this.filteredUsers().map(u => ({
      ...u,
      roleDisplay: this.translateRole(u.roleName),
      joinedDisplay: this.formatJoinedDate(u.createdAt)
    }));
  });

  availableRoles = signal([
    { id: 1, name: 'SystemAdmin', label: 'role.systemadmin' },
    { id: 2, name: 'Owner', label: 'role.owner' },
    { id: 3, name: 'Accountant', label: 'role.accountant' },
    { id: 4, name: 'SalesManager', label: 'role.salesmanager' },
    { id: 5, name: 'Sales', label: 'role.sales' },
    { id: 6, name: 'EmployeeManager', label: 'role.employeemanager' },
    { id: 7, name: 'Employee', label: 'role.employee' },
    { id: 8, name: 'HR', label: 'role.hr' }
  ]);

  roleCards: RoleCard[] = [
    { id: 3, name: 'Accountant', label: 'role.accountant', icon: 'fa-calculator', description: 'users.role.accountant.desc' },
    { id: 4, name: 'SalesManager', label: 'role.salesmanager', icon: 'fa-chart-line', description: 'users.role.salesmanager.desc' },
    { id: 5, name: 'Sales', label: 'role.sales', icon: 'fa-handshake', description: 'users.role.sales.desc' },
    { id: 6, name: 'EmployeeManager', label: 'role.employeemanager', icon: 'fa-users-gear', description: 'users.role.employeemanager.desc' },
    { id: 7, name: 'Employee', label: 'role.employee', icon: 'fa-user-tie', description: 'users.role.employee.desc' },
    { id: 8, name: 'HR', label: 'role.hr', icon: 'fa-user-nurse', description: 'users.role.hr.desc' },
  ];

  selectableRoles = computed(() => this.availableRoles().filter(r => r.id !== 1 && r.id !== 2));

  // Modals visibility
  showAddModal = signal(false);
  showEditModal = signal(false);

  // Premium Modal States
  isSubmitting = signal(false);
  showSuccess = signal(false);
  showPassword = signal(false);
  passwordStrength = signal(0);
  passwordStrengthLabel = signal('');
  showPermissions = signal(false);

  // Form Fields - New User
  newFullName = '';
  newEmail = '';
  newPhone = '';
  newPassword = '';
  confirmPassword = '';
  newRoleId = 7;
  selectedRoleCard = 7;

  permissions: Record<string, boolean> = {
    crm: true,
    users: true,
    invoices: false,
    tasks: true,
    reports: false,
    aiAssistant: false,
  };

  // Form Fields - Edit Role
  selectedUserId = 0;
  selectedUserName = '';
  editRoleId = 7;

  usersLoading = signal(true);

  ngOnInit() {
    this.loadDashboardStats();
    this.loadUsers();
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

  loadUsers() {
    this.usersLoading.set(true);
    this.authService.getUsers().subscribe({
      next: (res) => {
        this.usersLoading.set(false);
        if (res && res.success && res.data) {
          const apiUsers = res.data;
          this.users.set(apiUsers.map((u: any) => ({
            id: u.id,
            name: u.fullName,
            email: u.email,
            roleName: u.roleName,
            roleId: u.roleId,
            status: (u.status || 'active').toLowerCase(),
            createdAt: u.createdAt || u.joinDate || null,
            avatar: this.getInitials(u.fullName)
          })));
        }
      },
      error: (err) => {
        this.usersLoading.set(false);
        const status = err.status ?? '—';
        const msg = err.error?.message || err.message || this.i18n.t('users.error.load');
        console.error('[UserManagement] loadUsers failed', {
          status,
          url: err.url || err.request?.url,
          body: err.error,
          token: !!localStorage.getItem('token'),
        });
        this.toastService.error(`${msg} (${status})`, this.i18n.t('users.error.load_title'));
      }
    });
  }

  loadDashboardStats() {
    this.loadingStats.set(true);
    this.authService.getDashboardStats().subscribe({
      next: (res) => {
        this.loadingStats.set(false);
        if (res && res.success && res.data) {
          const d = res.data;
          const cards = [
            { label: 'users.stats.total', value: d.totalUsers, color: 'primary' },
            { label: 'users.stats.active', value: d.activeUsers, color: 'success' },
            { label: 'users.stats.pending', value: d.pendingUsers, color: 'warning' },
            { label: 'users.stats.roles', value: d.rolesCount, color: 'info' },
          ];
          this.startCardAnimation(cards);
        }
      },
      error: () => this.loadingStats.set(false)
    });
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
        if (c.label !== 'users.stats.total') {
          const pct = c.value > 0 && total > 0 ? Math.round(c.value / total * 100) : 0;
          trendText = `${pct}%`;
        } else {
          trendText = this.i18n.t('users.stats.trend_total');
        }
        return { ...c, displayValue: currentValue, trendLabel: trendText, trendUp: true };
      }));
      if (progress < 1) this.animFrameId = requestAnimationFrame(animate);
    };
    this.animFrameId = requestAnimationFrame(animate);
  }

  private getIconForLabel(label: string): string {
    switch (label) {
      case 'users.stats.total': return 'fa-users';
      case 'users.stats.active': return 'fa-circle-check';
      case 'users.stats.pending': return 'fa-hourglass-half';
      case 'users.stats.roles': return 'fa-shield-halved';
      default: return 'fa-chart-simple';
    }
  }

  onExport() {
    this.toastService.success(this.i18n.t('users.export.success'), this.i18n.t('users.export.title'));
  }

  openAddModal() {
    this.newFullName = '';
    this.newEmail = '';
    this.newPhone = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.newRoleId = 7;
    this.selectedRoleCard = 7;
    this.showPassword.set(false);
    this.passwordStrength.set(0);
    this.passwordStrengthLabel.set('');
    this.showPermissions.set(false);
    this.isSubmitting.set(false);
    this.showSuccess.set(false);
    this.permissions = { crm: true, users: true, invoices: false, tasks: true, reports: false, aiAssistant: false };
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.showSuccess.set(false);
  }

  selectRole(roleId: number) {
    this.selectedRoleCard = roleId;
    this.newRoleId = roleId;
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onPasswordChange() {
    const pwd = this.newPassword;
    if (!pwd) {
      this.passwordStrength.set(0);
      this.passwordStrengthLabel.set('');
      return;
    }
    let score = 0;
    if (pwd.length >= 6) score += 20;
    if (pwd.length >= 10) score += 10;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
    this.passwordStrength.set(Math.min(score, 100));
    if (score < 40) this.passwordStrengthLabel.set(this.i18n.t('users.password.weak'));
    else if (score < 70) this.passwordStrengthLabel.set(this.i18n.t('users.password.medium'));
    else this.passwordStrengthLabel.set(this.i18n.t('users.password.strong'));
  }

  togglePermission(key: string) {
    this.permissions[key] = !this.permissions[key];
  }

  onAddUser() {
    if (!this.newFullName || !this.newEmail || !this.newPassword) {
      this.toastService.warning(this.i18n.t('users.error.validate'));
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toastService.warning(this.i18n.t('users.error.password_mismatch'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newEmail)) {
      this.toastService.warning(this.i18n.t('users.error.invalid_email'), this.i18n.t('users.error.create_title'));
      return;
    }

    this.isSubmitting.set(true);

    const payload: any = {
      fullName: this.newFullName,
      email: this.newEmail,
      password: this.newPassword,
      roleId: Number(this.newRoleId),
    };

    if (this.newPhone) {
      payload.phoneNumber = this.newPhone;
    }

    this.authService.registerUser(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.showSuccess.set(true);
        this.loadUsers();
        this.loadDashboardStats();
        setTimeout(() => {
          this.closeAddModal();
        }, 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const status = err.status ?? '—';

        let detail = '';
        if (err.error) {
          if (typeof err.error === 'string') {
            detail = err.error;
          } else {
            detail = err.error.message || err.error.title || JSON.stringify(err.error.errors || err.error);
          }
        }
        const fallback = err.message || this.i18n.t('users.error.create');
        const displayMsg = detail || fallback;

        console.error('[UserManagement] registerUser failed', {
          status,
          url: `${err.url || err.request?.url || this.authService['baseUrl']}/register`,
          responseBody: err.error,
          tokenPresent: !!localStorage.getItem('rasd_jwt_token'),
          tokenKey: 'rasd_jwt_token',
          payload: { ...payload, password: '***' },
        });

        this.toastService.error(`${displayMsg} (${status})`, this.i18n.t('users.error.create_title'));
      }
    });
  }

  openEditModal(user: any) {
    this.selectedUserId = user.id;
    this.selectedUserName = user.name;
    this.editRoleId = user.roleId || 7;
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  onUpdateRole() {
    this.authService.updateUserRole(this.selectedUserId, Number(this.editRoleId)).subscribe({
      next: (res) => {
        this.toastService.success(
          this.i18n.tFormat('users.success.updated', { name: this.selectedUserName }),
          this.i18n.t('users.success.updated_title')
        );
        this.loadUsers();
        this.loadDashboardStats();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Failed to update role', err);
        const errMsg = err.error?.message || this.i18n.t('users.error.update');
        this.toastService.error(errMsg, this.i18n.t('users.error.update_title'));
      }
    });
  }

  onDeleteUser(user: any) {
    if (!confirm(this.i18n.tFormat('users.confirm.delete', { name: user.name }))) return;
    this.authService.deleteUser(user.id).subscribe({
      next: (res) => {
        this.toastService.success(
          this.i18n.tFormat('users.success.deleted', { name: user.name }),
          this.i18n.t('users.success.deleted_title')
        );
        this.loadUsers();
        this.loadDashboardStats();
      },
      error: (err) => {
        console.error('Failed to delete user', err);
        const errMsg = err.error?.message || this.i18n.t('users.error.delete');
        this.toastService.error(errMsg, this.i18n.t('users.error.delete_title'));
      }
    });
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.filterRoleId.set(target.value ? Number(target.value) : null);
  }

  isPrivilegedUser(user: any): boolean {
    return user.roleId === 1 || user.roleId === 2;
  }

  private translateRole(roleName: string): string {
    if (!roleName) return this.i18n.t('role.employee');
    const key = 'role.' + roleName.toLowerCase().replace(/\s+/g, '');
    const translated = this.i18n.t(key);
    return translated !== key ? translated : (roleName || this.i18n.t('role.employee'));
  }

  private formatJoinedDate(dateStr: string | null): string {
    if (!dateStr) return this.i18n.t('users.joined.recently');
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return this.i18n.t('dashboard.today');
    if (diffDays === 1) return this.i18n.t('dashboard.yesterday');
    const locale = this.i18n.isRtl() ? 'ar-SA' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return name[0] || '?';
  }
}
