import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SystemAdminService } from './system-admin.service';

export interface NotificationItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  timeAr: string;
  timeEn: string;
  isRead: boolean;
  type: 'info' | 'warning' | 'success' | 'danger';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private authService = inject(AuthService);
  private sysAdminService = inject(SystemAdminService);

  notifications = signal<NotificationItem[]>([]);
  
  unreadCount = computed(() => {
    return this.notifications().filter(n => !n.isRead).length;
  });

  constructor() {
    // Reload notifications whenever the current user changes
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadNotificationsForUser(user.role);
      } else {
        this.notifications.set([]);
      }
    });
  }

  loadNotificationsForUser(role: string) {
    const defaultNotifications: NotificationItem[] = [];

    if (role === 'system-admin') {
      // 1. System Admin real-data derived notifications
      forkJoin({
        issues: this.sysAdminService.getSupportIssues().pipe(catchError(() => of({ success: false, data: [] }))),
        tenants: this.sysAdminService.getTenants().pipe(catchError(() => of({ success: false, data: [] })))
      }).subscribe({
        next: (res) => {
          const items: NotificationItem[] = [];
          
          // Pending support tickets
          if (res.issues && res.issues.success && res.issues.data) {
            res.issues.data.forEach((issue: any) => {
              if (issue.status === 'Pending') {
                items.push({
                  id: issue.id,
                  titleAr: `طلب دعم معلق: ${issue.tenantName}`,
                  titleEn: `Pending support request: ${issue.tenantName}`,
                  descriptionAr: issue.issueDescription,
                  descriptionEn: issue.issueDescription,
                  timeAr: 'نشط الآن',
                  timeEn: 'Active now',
                  isRead: false,
                  type: 'warning'
                });
              }
            });
          }

          // Pending company approvals (OwnerStatus === 'Pending')
          if (res.tenants && res.tenants.success && res.tenants.data) {
            res.tenants.data.forEach((tenant: any) => {
              if (tenant.ownerStatus === 'Pending') {
                items.push({
                  id: `pending-tenant-${tenant.tenantId}`,
                  titleAr: `محاولة تسجيل لدخول شركة جديدة: ${tenant.name}`,
                  titleEn: `New company registration attempt: ${tenant.name}`,
                  descriptionAr: `المالك: ${tenant.ownerName} (${tenant.ownerEmail}) يطلب تفعيل حسابه.`,
                  descriptionEn: `Owner: ${tenant.ownerName} (${tenant.ownerEmail}) requests activation.`,
                  timeAr: 'بانتظار الموافقة',
                  timeEn: 'Pending approval',
                  isRead: false,
                  type: 'info'
                });
              }
            });
          }

          // Add some static tech logs for admin
          items.push({
            id: 'sys-log-1',
            titleAr: 'أداء النظام مستقر',
            titleEn: 'System performance stable',
            descriptionAr: 'معدل استهلاك الذاكرة 8.4 GB والـ CPU مستقر عند 28%',
            descriptionEn: 'RAM usage is 8.4 GB and CPU is stable at 28%',
            timeAr: 'منذ ساعة',
            timeEn: '1 hour ago',
            isRead: false,
            type: 'success'
          });

          this.notifications.set(items);
        },
        error: () => {
          this.notifications.set([
            {
              id: 'sys-log-1',
              titleAr: 'أداء النظام مستقر',
              titleEn: 'System performance stable',
              descriptionAr: 'معدل استهلاك الذاكرة 8.4 GB والـ CPU مستقر عند 28%',
              descriptionEn: 'RAM usage is 8.4 GB and CPU is stable at 28%',
              timeAr: 'منذ ساعة',
              timeEn: '1 hour ago',
              isRead: false,
              type: 'success'
            }
          ]);
        }
      });

    } else if (role === 'owner-admin') {
      // 2. Company Owner notifications
      defaultNotifications.push(
        {
          id: 'owner-1',
          titleAr: 'طلب إجازة جديد معلق',
          titleEn: 'New pending leave request',
          descriptionAr: 'أرسل الموظف يوسف حسن طلب إجازة مرضية لمدة 3 أيام بانتظار موافقتك.',
          descriptionEn: 'Employee Yousef Hassan sent a sick leave request for 3 days waiting your approval.',
          timeAr: 'منذ 10 دقائق',
          timeEn: '10 minutes ago',
          isRead: false,
          type: 'warning'
        },
        {
          id: 'owner-2',
          titleAr: 'صفقة مبيعات رابحة 🎉',
          titleEn: 'Won Sales Deal 🎉',
          descriptionAr: 'تم إغلاق صفقة مجموعة الفتح للتجارة بنجاح بقيمة $150,000.',
          descriptionEn: 'Deal with Fatah Trade Group closed successfully with value $150,000.',
          timeAr: 'منذ ساعتين',
          timeEn: '2 hours ago',
          isRead: false,
          type: 'success'
        }
      );
      this.notifications.set(defaultNotifications);

    } else if (role === 'accountant') {
      // 3. Accountant notifications
      defaultNotifications.push(
        {
          id: 'acc-1',
          titleAr: 'فاتورة متأخرة الدفع ⚠️',
          titleEn: 'Overdue invoice ⚠️',
          descriptionAr: 'تجاوزت الفاتورة رقم #INV-0044 تاريخ استحقاق السداد للعميل شركة الحلول الحديثة.',
          descriptionEn: 'Invoice #INV-0044 has passed its due date for Modern Solutions.',
          timeAr: 'منذ يوم',
          timeEn: 'Yesterday',
          isRead: false,
          type: 'danger'
        }
      );
      this.notifications.set(defaultNotifications);

    } else {
      // 4. Standard Employee / Sales notifications
      defaultNotifications.push(
        {
          id: 'emp-1',
          titleAr: 'تم تعيين مهمة جديدة لك 📋',
          titleEn: 'New task assigned to you 📋',
          descriptionAr: 'قام المدير بإسناد مهمة جديدة لك: متابعة توقيعات العقد المعلق مع المورد.',
          descriptionEn: 'Manager assigned a new task: Follow up on contract signature with supplier.',
          timeAr: 'منذ قليل',
          timeEn: 'Just now',
          isRead: false,
          type: 'info'
        }
      );
      this.notifications.set(defaultNotifications);
    }
  }

  markAllAsRead() {
    this.notifications.update(list => 
      list.map(n => ({ ...n, isRead: true }))
    );
  }
}
