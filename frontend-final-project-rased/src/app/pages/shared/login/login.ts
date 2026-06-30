import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { ThemeService } from '../../../services/theme.service';
import { ToastService } from '../../../services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public i18n = inject(I18nService);
  public themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  email = '';
  password = '';
  errorMessage = signal('');
  loading = signal(false);

  private destroy$ = new Subject<void>();
  private alive = true;

  ngOnInit() {
    this.authService.init();

    if (this.authService.isAuthenticated()) {
      this.authService.navigateToDashboard(this.authService.userRole()!);
    }
  }

  ngOnDestroy() {
    this.alive = false;
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.loading()) return;

    this.errorMessage.set('');
    if (!this.email) {
      this.errorMessage.set(this.i18n.currentLang() === 'ar' ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter email address');
      this.toastService.warning(
        this.errorMessage(),
        this.i18n.currentLang() === 'ar' ? 'تنبيه' : 'Warning'
      );
      return;
    }

    const enteredPassword = this.password || '123456';
    this.loading.set(true);

    this.authService.login(this.email, enteredPassword).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        if (this.alive) this.loading.set(false);
      })
    ).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          const role = this.authService.userRole();
          this.authService.navigateToDashboard(role || 'owner-admin');
        } else {
          this.errorMessage.set(response?.message || (this.i18n.currentLang() === 'ar'
            ? 'فشل تسجيل الدخول. تحقق من بيانات الاعتماد الخاصة بك.'
            : 'Login failed. Check your credentials.'));
          this.toastService.error(this.errorMessage(), this.i18n.currentLang() === 'ar' ? 'خطأ' : 'Error');
        }
      },
      error: (err) => {
        const apiMsg = err.error?.message || '';
        const status = err.status ?? '—';
        console.error('[Login] API login failed', { status, message: apiMsg, body: err.error });

        if (err.status === 0 || err.status === 502 || err.status === 503) {
          console.warn('[Login] Server unreachable, using offline mock mode');
          const success = this.authService.loginMock(this.email);
          if (success) {
            const role = this.authService.userRole();
            this.authService.navigateToDashboard(role || 'owner-admin');
          } else {
            this.errorMessage.set(this.i18n.currentLang() === 'ar'
              ? 'الخادم غير متاح. تعذر تسجيل الدخول في وضع عدم الاتصال.'
              : 'Server unavailable. Could not login in offline mode.');
            this.toastService.error(this.errorMessage(), this.i18n.currentLang() === 'ar' ? 'خطأ' : 'Error');
          }
        } else if (err.name === 'TimeoutError') {
          this.errorMessage.set(this.i18n.currentLang() === 'ar'
            ? 'انتهت مهلة الاتصال. تحقق من توفر الخادم.'
            : 'Connection timed out. Please check server availability.');
          this.toastService.error(this.errorMessage(), this.i18n.currentLang() === 'ar' ? 'خطأ' : 'Error');
        } else {
          this.errorMessage.set(apiMsg || (this.i18n.currentLang() === 'ar'
            ? `فشل تسجيل الدخول (${status})`
            : `Login failed (${status})`));

          this.toastService.error(
            this.errorMessage(),
            this.i18n.currentLang() === 'ar' ? 'خطأ' : 'Error'
          );
        }
      }
    });
  }
}
