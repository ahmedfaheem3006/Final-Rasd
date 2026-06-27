import { Component, inject, ChangeDetectorRef, HostBinding } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  public i18n = inject(I18nService);
  public themeService = inject(ThemeService);

  @HostBinding('class.light-theme') get isLightTheme() {
    return !this.themeService.isDark();
  }

  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  
  step = 1; // Step 1: Email, Step 2: OTP, Step 3: New Password, Step 4: Success
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  sendOtp() {
    this.errorMessage = '';
    if (!this.email) {
      this.errorMessage = this.i18n.currentLang() === 'ar' ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email';
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.step = 2;
        this.cdr.detectChanges();
        const msg = this.i18n.currentLang() === 'ar' 
          ? 'تم إرسال رمز التحقق بنجاح. يرجى التحقق من بريدك الإلكتروني.' 
          : 'OTP sent successfully. Please check your email.';
        this.toastService.success(msg, this.i18n.currentLang() === 'ar' ? 'تم الإرسال' : 'Sent');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || (this.i18n.currentLang() === 'ar' 
          ? 'حدث خطأ أثناء إرسال رمز التحقق. يرجى المحاولة لاحقاً.' 
          : 'Error sending OTP. Please try again.');
        this.cdr.detectChanges();
        this.toastService.error(this.errorMessage, this.i18n.currentLang() === 'ar' ? 'خطأ' : 'Error');
      }
    });
  }

  verifyOtpCode() {
    this.errorMessage = '';
    if (!this.otp || this.otp.length < 4) {
      this.errorMessage = this.i18n.currentLang() === 'ar' ? 'الرجاء إدخال رمز التحقق كاملاً' : 'Please enter a valid OTP code';
      return;
    }

    this.isLoading = true;
    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.step = 3;
        this.cdr.detectChanges();
        const msg = this.i18n.currentLang() === 'ar' ? 'تم التحقق من الرمز بنجاح.' : 'OTP verified successfully.';
        this.toastService.success(msg, this.i18n.currentLang() === 'ar' ? 'تم التحقق' : 'Verified');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || (this.i18n.currentLang() === 'ar' 
          ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' 
          : 'Invalid or expired OTP code.');
        this.cdr.detectChanges();
        this.toastService.error(this.errorMessage, this.i18n.currentLang() === 'ar' ? 'فشل التحقق' : 'Verification Failed');
      }
    });
  }

  resetPasswordCode() {
    this.errorMessage = '';
    if (!this.newPassword) {
      this.errorMessage = this.i18n.currentLang() === 'ar' ? 'الرجاء إدخال كلمة المرور الجديدة' : 'Please enter your new password';
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMessage = this.i18n.currentLang() === 'ar' ? 'كلمة المرور يجب ألا تقل عن 6 أحرف' : 'Password must be at least 6 characters long';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = this.i18n.currentLang() === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.email, this.otp, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.step = 4;
        this.cdr.detectChanges();
        const msg = this.i18n.currentLang() === 'ar' 
          ? 'تم إعادة تعيين كلمة المرور بنجاح.' 
          : 'Password reset successfully.';
        this.toastService.success(msg, this.i18n.currentLang() === 'ar' ? 'تم التغيير' : 'Changed');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || (this.i18n.currentLang() === 'ar' 
          ? 'فشل تعيين كلمة المرور الجديدة.' 
          : 'Failed to reset password.');
        this.cdr.detectChanges();
        this.toastService.error(this.errorMessage, this.i18n.currentLang() === 'ar' ? 'خطأ' : 'Error');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

