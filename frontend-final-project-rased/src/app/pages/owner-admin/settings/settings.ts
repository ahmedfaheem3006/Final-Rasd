import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);
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

  tabs = signal([
    { id: 'company', label: 'إعدادات الشركة', icon: 'building' },
    { id: 'notifications', label: 'الإشعارات', icon: 'bell' },
    { id: 'security', label: 'الأمان والخصوصية', icon: 'lock' },
    { id: 'billing', label: 'الاشتراك والفوترة', icon: 'card' },
  ]);

  ngOnInit() {
    this.loadSettings();
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
        this.toastService.warning('الرجاء كتابة كلمة المرور الحالية والجديدة معاً.');
        return;
      }
      this.toastService.success('تم تحديث كلمة المرور الخاصة بك بنجاح.', 'تحديث كلمة المرور');
      this.currentPassword = '';
      this.newPassword = '';
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
