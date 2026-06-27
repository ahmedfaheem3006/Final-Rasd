import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private readonly STORAGE_KEY = 'rasd_settings_data';

  activeTab = signal('company');

  // Company Form Fields
  companyName = 'شركة رصد للحلول المتكاملة';
  companyEmail = 'info@rasd.sa';
  companyPhone = '+966 11 123 4567';
  companyLocation = 'الرياض، المملكة العربية السعودية';
  companyDesc = 'شركة رائدة في تقديم حلول إدارة الأعمال والـ CRM للمؤسسات والشركات الكبرى في المملكة العربية السعودية.';

  // Notification Toggles
  notifyNewDeals = true;
  notifyLeaveRequests = true;
  notifyOverdueInvoices = false;
  notifyWeeklyPerformance = true;

  // Security Form Fields
  currentPassword = '';
  newPassword = '';

  tabs = signal<any[]>([]);

  ngOnInit() {
    this.loadSettings();

    const isHr = this.authService.userRole()?.toLowerCase() === 'hr';
    const allTabs = [
      { id: 'company', labelKey: 'settings.tab.company', icon: 'building' },
      { id: 'notifications', labelKey: 'settings.tab.notifications', icon: 'bell' },
      { id: 'security', labelKey: 'settings.tab.security', icon: 'lock' },
      { id: 'billing', labelKey: 'settings.tab.billing', icon: 'card' },
    ];

    if (isHr) {
      this.tabs.set(allTabs.filter(t => t.id !== 'billing'));
    } else {
      this.tabs.set(allTabs);
    }
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  loadSettings() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.company) {
          this.companyName = data.company.name || this.companyName;
          this.companyEmail = data.company.email || this.companyEmail;
          this.companyPhone = data.company.phone || this.companyPhone;
          this.companyLocation = data.company.location || this.companyLocation;
          this.companyDesc = data.company.desc || this.companyDesc;
        }
        if (data.notifications) {
          this.notifyNewDeals = data.notifications.newDeals !== undefined ? data.notifications.newDeals : this.notifyNewDeals;
          this.notifyLeaveRequests = data.notifications.leaveRequests !== undefined ? data.notifications.leaveRequests : this.notifyLeaveRequests;
          this.notifyOverdueInvoices = data.notifications.overdueInvoices !== undefined ? data.notifications.overdueInvoices : this.notifyOverdueInvoices;
          this.notifyWeeklyPerformance = data.notifications.weeklyPerformance !== undefined ? data.notifications.weeklyPerformance : this.notifyWeeklyPerformance;
        }
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }

  saveSettings() {
    // If security tab and password is typed, validate
    if (this.activeTab() === 'security' && (this.currentPassword || this.newPassword)) {
      if (!this.currentPassword || !this.newPassword) {
        this.toastService.warning(this.i18n.isRtl() ? 'الرجاء كتابة كلمة المرور الحالية والجديدة معاً.' : 'Please enter both current and new passwords.');
        return;
      }
      this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
        next: (res) => {
          if (res && res.success) {
            this.toastService.success(
              this.i18n.isRtl() ? 'تم تحديث كلمة المرور الخاصة بك بنجاح.' : 'Your password has been changed successfully.',
              this.i18n.isRtl() ? 'تحديث كلمة المرور' : 'Update Password'
            );
            this.currentPassword = '';
            this.newPassword = '';
          }
        },
        error: (err) => {
          const msg = err.error?.message || (this.i18n.isRtl() ? 'فشل تحديث كلمة المرور.' : 'Failed to update password.');
          this.toastService.error(msg, this.i18n.isRtl() ? 'خطأ' : 'Error');
        }
      });
      return;
    }

    const dataToSave = {
      company: {
        name: this.companyName,
        email: this.companyEmail,
        phone: this.companyPhone,
        location: this.companyLocation,
        desc: this.companyDesc
      },
      notifications: {
        newDeals: this.notifyNewDeals,
        leaveRequests: this.notifyLeaveRequests,
        overdueInvoices: this.notifyOverdueInvoices,
        weeklyPerformance: this.notifyWeeklyPerformance
      }
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    this.toastService.success('تم حفظ جميع التغييرات والإعدادات بنجاح.', 'إعدادات النظام');
  }
}
