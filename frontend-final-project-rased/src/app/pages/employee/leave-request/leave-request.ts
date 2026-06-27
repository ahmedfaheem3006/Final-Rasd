import { Component, signal, computed, inject, OnInit, AfterViewInit, OnDestroy, HostBinding, HostListener, ViewChild, ElementRef, effect, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '../../../services/leave.service';
import { AuthService } from '../../../services/auth.service';
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
  selector: 'app-employee-leave-request',
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-request.html',
  styleUrl: './leave-request.css'
})
export class EmployeeLeaveRequest implements OnInit, AfterViewInit, OnDestroy {
  private leaveService = inject(LeaveService);
  private authService = inject(AuthService);
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
  requests = signal<any[]>([]);
  currentUserId = signal<number | null>(null);

  stats = computed(() => [
    { label: 'إجمالي الطلبات', value: this.requests().length, color: 'primary' },
    { label: 'قيد الانتظار', value: this.requests().filter(r => r.status === 'Pending').length, color: 'warning' },
    { label: 'المعتمدة', value: this.requests().filter(r => r.status === 'Approved').length, color: 'success' },
    { label: 'المرفوضة', value: this.requests().filter(r => r.status === 'Rejected').length, color: 'danger' },
  ]);

  // New request modal
  showModal = signal(false);
  isSubmitting = signal(false);
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
    this.loadCurrentUser();
    this.loadMyRequests();
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

  private loadCurrentUser() {
    const session = localStorage.getItem('rasd_user_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        this.currentUserId.set(user.id || null);
      } catch {}
    }
  }

  private loadMyRequests() {
    this.loading.set(true);
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.success && res.data) {
          const userId = this.currentUserId();
          if (userId) {
            this.requests.set(res.data.filter((r: any) => r.employeeId === userId));
          } else {
            this.requests.set(res.data);
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('[EmployeeLeaveRequest] Failed to load', err);
        this.toastService.error('فشل تحميل طلبات الإجازات', 'خطأ');
      }
    });
  }

  translateLeaveType(type: string): string {
    return this.reverseLeaveTypeMap[type] || type;
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'Pending': return 'معلقة';
      case 'Approved': return 'موافقة';
      case 'Rejected': return 'مرفوضة';
      default: return status;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  openModal() {
    this.newType = 'إجازة سنوية';
    this.newStartDate = '';
    this.newEndDate = '';
    this.newReason = '';
    this.isSubmitting.set(false);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    this.isSubmitting.set(true);

    if (!this.newStartDate || !this.newEndDate) {
      this.toastService.warning('الرجاء تعبئة تاريخ البدء والنهاية');
      this.isSubmitting.set(false);
      return;
    }

    const session = localStorage.getItem('rasd_user_session');
    if (!session) {
      this.toastService.error('بيانات المستخدم غير متوفرة', 'خطأ');
      this.isSubmitting.set(false);
      return;
    }

    const user = JSON.parse(session);
    const apiLeaveType = this.leaveTypeMap[this.newType] || this.newType;
    const startDate = new Date(this.newStartDate);
    const endDate = new Date(this.newEndDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // Get current user's real data from AuthService to get employeeId/roleId
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const currentUserData = res.data.find((u: any) =>
            u.email === user.email
          );
          if (!currentUserData) {
            this.toastService.error('بيانات المستخدم غير موجودة في النظام', 'خطأ');
            this.isSubmitting.set(false);
            return;
          }

          this.leaveService.createLeaveRequest({
            employeeId: Number(currentUserData.id),
            roleId: Number(currentUserData.roleId),
            leaveType: apiLeaveType,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            reason: this.newReason || undefined
          }).subscribe({
            next: (res2) => {
              this.isSubmitting.set(false);
              if (res2 && res2.success) {
                this.toastService.success('تم تقديم طلب الإجازة بنجاح', 'تقديم طلب إجازة');
                this.loadMyRequests();
                this.closeModal();
              }
            },
            error: (err2) => {
              this.isSubmitting.set(false);
              this.toastService.error(err2.error?.message || 'فشل تقديم الطلب', 'خطأ');
            }
          });
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('فشل تحميل بيانات المستخدم', 'خطأ');
      }
    });
  }

  private getIconForLabel(label: string): string {
    switch (label) {
      case 'إجمالي الطلبات': return 'fa-clipboard-list';
      case 'قيد الانتظار': return 'fa-clock';
      case 'المعتمدة': return 'fa-circle-check';
      case 'المرفوضة': return 'fa-circle-xmark';
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
}
