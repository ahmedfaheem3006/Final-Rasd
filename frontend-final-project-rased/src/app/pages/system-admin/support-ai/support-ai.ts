import { Component, signal, inject, OnInit } from '@angular/core';
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

  ngOnInit() {
    this.loadIssues();
  }

  loadIssues() {
    this.isLoading.set(true);
    this.systemAdminService.getSupportIssues().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.issues.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load support issues', err);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في تحميل طلبات الدعم.' : 'Failed to load support requests.'
        );
        this.isLoading.set(false);
      }
    });
  }

  takeAction(issueId: string, actionName: string) {
    this.systemAdminService.resolveIssue(issueId, actionName).subscribe({
      next: (res) => {
        const arMsg = actionName === 'Approved' ? 'تم الموافقة على إجراء الذكاء الاصطناعي وتطبيقه بنجاح!' : 'تم رفض إجراء الذكاء الاصطناعي وإبلاغ صاحب النظام.';
        const enMsg = actionName === 'Approved' ? 'AI action approved and executed successfully!' : 'AI action rejected and owner notified.';
        
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? arMsg : enMsg,
          this.i18n.currentLang() === 'ar' ? 'قرار النظام' : 'System Decision'
        );
        
        this.loadIssues();
        
        // Refresh notifications
        const user = this.authServiceCurrentUser();
        if (user) {
          this.notificationService.loadNotificationsForUser(user.role);
        }
      },
      error: (err) => {
        console.error('Failed to resolve support issue', err);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في إرسال قرار الإجراء للذكاء الاصطناعي.' : 'Failed to submit action resolution decision.'
        );
      }
    });
  }

  private authServiceCurrentUser() {
    // Simple helper to reload sessions
    const saved = localStorage.getItem('rasd_user_session');
    return saved ? JSON.parse(saved) : null;
  }
}
