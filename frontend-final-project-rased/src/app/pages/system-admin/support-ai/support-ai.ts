import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-support-ai',
  imports: [CommonModule],
  templateUrl: './support-ai.html',
  styleUrl: './support-ai.css'
})
export class SupportAi implements OnInit {
  private systemAdminService = inject(SystemAdminService);
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);
  i18n = inject(I18nService);

  issues = signal<any[]>([]);
  isLoading = signal(false);
  isScanning = signal(false);
  activeFilter = signal<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  filteredIssues = computed(() => {
    const f = this.activeFilter();
    return f === 'All' ? this.issues() : this.issues().filter(i => i.status === f);
  });

  pendingCount = computed(() => this.issues().filter(i => i.status === 'Pending').length);
  approvedCount = computed(() => this.issues().filter(i => i.status === 'Approved').length);
  rejectedCount = computed(() => this.issues().filter(i => i.status === 'Rejected').length);

  ngOnInit() {
    this.loadIssues();
  }

  loadIssues() {
    this.isLoading.set(true);
    this.systemAdminService.getSupportIssues().subscribe({
      next: (res) => {
        if (res?.success && res.data) this.issues.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في تحميل طلبات الدعم.' : 'Failed to load support requests.'
        );
        this.isLoading.set(false);
      }
    });
  }

  runScan() {
    this.isScanning.set(true);
    this.systemAdminService.runAiScan().subscribe({
      next: (res) => {
        this.isScanning.set(false);
        if (res?.success) {
          const count = res.count ?? 0;
          this.toastService.success(
            res.message ?? (this.i18n.currentLang() === 'ar' ? 'اكتمل الفحص.' : 'Scan complete.'),
            this.i18n.currentLang() === 'ar' ? 'فحص الذكاء الاصطناعي' : 'AI Scan'
          );
          if (count > 0) this.loadIssues();
        }
      },
      error: () => {
        this.isScanning.set(false);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في تشغيل فحص الذكاء الاصطناعي.' : 'AI scan failed.'
        );
      }
    });
  }

  takeAction(issueId: string, actionName: string) {
    // Optimistic update
    this.issues.update(list =>
      list.map(i => i.id === issueId ? { ...i, status: actionName } : i)
    );

    this.systemAdminService.resolveIssue(issueId, actionName).subscribe({
      next: () => {
        const ar = actionName === 'Approved'
          ? 'تم الموافقة على إجراء الذكاء الاصطناعي وتطبيقه بنجاح!'
          : 'تم رفض إجراء الذكاء الاصطناعي وإبلاغ صاحب النظام.';
        const en = actionName === 'Approved'
          ? 'AI action approved and executed successfully!'
          : 'AI action rejected and owner notified.';
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? ar : en,
          this.i18n.currentLang() === 'ar' ? 'قرار النظام' : 'System Decision'
        );
        const saved = localStorage.getItem('rasd_user_session');
        const user = saved ? JSON.parse(saved) : null;
        if (user) this.notificationService.loadNotificationsForUser(user.role);
      },
      error: () => {
        // Revert optimistic update on failure
        this.loadIssues();
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في إرسال قرار الإجراء.' : 'Failed to submit decision.'
        );
      }
    });
  }

  setFilter(f: 'All' | 'Pending' | 'Approved' | 'Rejected') {
    this.activeFilter.set(f);
  }
}
