import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { SystemAdminService } from '../../../services/system-admin.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  authService = inject(AuthService);
  private toastService = inject(ToastService);
  private systemAdminService = inject(SystemAdminService);
  i18n = inject(I18nService);

  // Form password state
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // System settings toggles
  enableGlobalNotifications = true;
  enableAiSupport = true;

  isSubmitting = signal(false);
  isSavingConfig = signal(false);

  ngOnInit() {
    this.loadSettingsConfig();
  }

  loadSettingsConfig() {
    this.systemAdminService.getSettingsConfig().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.enableGlobalNotifications = res.data.enableGlobalNotifications;
          this.enableAiSupport = res.data.enableAiSupport;
        }
      },
      error: (err) => console.error('Failed to load system config settings', err)
    });
  }

  saveSystemConfig() {
    this.isSavingConfig.set(true);
    const config = {
      enableGlobalNotifications: this.enableGlobalNotifications,
      enableAiSupport: this.enableAiSupport
    };
    this.systemAdminService.updateSettingsConfig(config).subscribe({
      next: (res) => {
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? 'تم تحديث إعدادات النظام بنجاح!' : 'System configuration saved successfully!',
          this.i18n.currentLang() === 'ar' ? 'تحديث النظام' : 'System Configuration'
        );
        this.isSavingConfig.set(false);
      },
      error: (err) => {
        console.error('Failed to save settings config', err);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل حفظ إعدادات النظام' : 'Failed to save system settings'
        );
        this.isSavingConfig.set(false);
      }
    });
  }

  onSubmit() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.toastService.warning(
        this.i18n.currentLang() === 'ar' ? 'الرجاء إدخال جميع حقول كلمة المرور' : 'Please fill all password fields'
      );
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastService.error(
        this.i18n.currentLang() === 'ar' ? 'كلمة المرور الجديدة غير متطابقة مع التأكيد' : 'New passwords do not match',
        this.i18n.currentLang() === 'ar' ? 'خطأ في التحقق' : 'Validation Error'
      );
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.warning(
        this.i18n.currentLang() === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'
      );
      return;
    }

    this.isSubmitting.set(true);

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (res) => {
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!',
          this.i18n.currentLang() === 'ar' ? 'تحديث الإعدادات' : 'Update Settings'
        );
        this.isSubmitting.set(false);
        // Clear fields
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        console.error('Failed to change password', err);
        const errMsg = err.error?.message || 
          (this.i18n.currentLang() === 'ar' ? 'فشل تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية.' : 'Failed to change password. Please check your current password.');
        this.toastService.error(errMsg, this.i18n.currentLang() === 'ar' ? 'خطأ في العملية' : 'Error');
        this.isSubmitting.set(false);
      }
    });
  }
}
