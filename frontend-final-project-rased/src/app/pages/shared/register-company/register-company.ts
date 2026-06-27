import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../../services/tenant.service';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';

import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-register-company',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './register-company.html',
  styleUrl: './register-company.css'
})
export class RegisterCompany {
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  public i18n = inject(I18nService);
  public themeService = inject(ThemeService);

  companyName = '';
  ownerFullName = '';
  ownerEmail = '';
  ownerPassword = '';
  errorMessage = '';
  successMessage = '';

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.companyName || !this.ownerFullName || !this.ownerEmail || !this.ownerPassword) {
      this.errorMessage = this.i18n.currentLang() === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill in all required fields';
      this.toastService.warning(this.errorMessage, this.i18n.currentLang() === 'ar' ? 'تنبيه' : 'Warning');
      return;
    }

    // 1. Check if company already exists
    this.tenantService.checkCompanyExists(this.companyName).subscribe({
      next: (checkRes) => {
        if (checkRes && checkRes.exists) {
          this.errorMessage = this.i18n.currentLang() === 'ar' 
            ? 'اسم الشركة مسجل بالفعل في النظام، الرجاء اختيار اسم آخر' 
            : 'Company name is already registered, please choose another name';
          this.toastService.error(this.errorMessage, this.i18n.currentLang() === 'ar' ? 'فشل التحقق' : 'Validation Failed');
          return;
        }

        // 2. Proceed with registration
        const payload = {
          companyName: this.companyName,
          ownerFullName: this.ownerFullName,
          ownerEmail: this.ownerEmail,
          ownerPassword: this.ownerPassword
        };

        this.tenantService.registerTenant(payload).subscribe({
          next: (res) => {
            const successMsg = this.i18n.currentLang() === 'ar' ? 'تم تسجيل الشركة بنجاح! جاري تسجيل الدخول...' : 'Company registered successfully! Logging in...';
            this.successMessage = successMsg;
            this.toastService.success(successMsg, this.i18n.currentLang() === 'ar' ? 'مبارك!' : 'Success!');
            
            // Log in immediately as the owner
            setTimeout(() => {
              this.authService.login(this.ownerEmail, this.ownerPassword).subscribe({
                next: () => {
                  this.toastService.info(this.i18n.currentLang() === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
                  this.router.navigate(['/app/owner/dashboard']);
                },
                error: () => {
                  this.router.navigate(['/login']);
                }
              });
            }, 1500);
          },
          error: (err) => {
            console.error('API registration failed', err);
            this.errorMessage = err.error?.message || (this.i18n.currentLang() === 'ar' ? 'فشل تسجيل الشركة. الرجاء المحاولة مرة أخرى.' : 'Company registration failed. Please try again.');
            this.toastService.error(this.errorMessage, this.i18n.currentLang() === 'ar' ? 'خطأ في التسجيل' : 'Registration Error');
          }
        });
      },
      error: (err) => {
        console.error('Check company existence failed', err);
        // Fallback: try to register directly if check endpoint fails
        this.registerDirectly();
      }
    });
  }

  private registerDirectly() {
    const payload = {
      companyName: this.companyName,
      ownerFullName: this.ownerFullName,
      ownerEmail: this.ownerEmail,
      ownerPassword: this.ownerPassword
    };

    this.tenantService.registerTenant(payload).subscribe({
      next: (res) => {
        const successMsg = this.i18n.currentLang() === 'ar' ? 'تم تسجيل الشركة بنجاح! جاري تسجيل الدخول...' : 'Company registered successfully! Logging in...';
        this.successMessage = successMsg;
        this.toastService.success(successMsg);
        
        setTimeout(() => {
          this.authService.login(this.ownerEmail, this.ownerPassword).subscribe({
            next: () => {
              this.router.navigate(['/app/owner/dashboard']);
            },
            error: () => {
              this.router.navigate(['/login']);
            }
          });
        }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || (this.i18n.currentLang() === 'ar' ? 'فشل تسجيل الشركة. الرجاء المحاولة مرة أخرى.' : 'Company registration failed. Please try again.');
        this.toastService.error(this.errorMessage);
      }
    });
  }
}
