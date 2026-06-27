import { Component, inject } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { ThemeService } from '../../../services/theme.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public i18n = inject(I18nService);
  public themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  email = '';
  password = '';
  errorMessage = '';

  // If already authenticated, redirect away from login
  constructor() {
    if (this.authService.isAuthenticated()) {
      this.redirectAfterLogin();
    }
  }


  onSubmit() {
    this.errorMessage = '';
    if (!this.email) {
      this.errorMessage = this.i18n.currentLang() === 'ar' ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter email address';
      this.toastService.warning(
        this.errorMessage,
        this.i18n.currentLang() === 'ar' ? 'تنبيه' : 'Warning'
      );
      return;
    }
    const enteredPassword = this.password || '123456';
    
    this.authService.login(this.email, enteredPassword).subscribe({
      next: () => {
        this.redirectAfterLogin();
      },
      error: (err) => {
        const apiMsg = err.error?.message || '';
        const status = err.status ?? '—';
        console.error('[Login] API login failed', { status, message: apiMsg, body: err.error });

        // Fallback to mock if server is unreachable (no connection)
        if (err.status === 0 || err.status === 502 || err.status === 503) {
          console.warn('[Login] Server unreachable, using offline mock mode');
          this.authService.loginMock(this.email);
        } else {
          this.errorMessage = apiMsg || (this.i18n.currentLang() === 'ar'
            ? `فشل تسجيل الدخول (${status})`
            : `Login failed (${status})`);
          
          this.toastService.error(
            this.errorMessage,
            this.i18n.currentLang() === 'ar' ? 'خطأ' : 'Error'
          );
        }
      }
    });
  }


  private redirectAfterLogin() {
    // Honor the returnUrl if set by authGuard
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    }
  }
}
