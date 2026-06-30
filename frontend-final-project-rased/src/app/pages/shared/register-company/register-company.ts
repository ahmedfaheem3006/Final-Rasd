import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../../services/tenant.service';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';
import { SystemAdminService } from '../../../services/system-admin.service';

@Component({
  selector: 'app-register-company',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './register-company.html',
  styleUrl: './register-company.css'
})
export class RegisterCompany implements OnInit {
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private sysAdminService = inject(SystemAdminService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  public i18n = inject(I18nService);
  public themeService = inject(ThemeService);

  // Step Management
  currentStep = signal(1);

  // Step 1: Company Information Fields
  companyName = '';
  address = '';

  // Step 2: Owner Information Fields
  ownerFirstName = '';
  ownerLastName = '';
  ownerEmail = '';
  ownerPhone = '';
  ownerPassword = '';
  termsAccepted = false;

  // Pricing plans list from backend
  pricingPlans = signal<any[]>([]);
  selectedPlanId = signal<string>('');

  selectedPlan = computed(() => {
    return this.pricingPlans().find(p => p.id === this.selectedPlanId()) || null;
  });

  computedAiLimit = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    if (plan.id === 'free') return 100;
    if (plan.id === 'starter') return 200;
    if (plan.id === 'professional') return 5000;
    return 99999;
  });

  computedAiLimitDisplay = computed(() => {
    const limit = this.computedAiLimit();
    if (!this.selectedPlanId()) return this.i18n.currentLang() === 'ar' ? 'اختر الباقة أولاً' : 'Select a plan first';
    if (limit >= 99999) return this.i18n.currentLang() === 'ar' ? 'غير محدود' : 'Unlimited';
    return `${limit} ${this.i18n.currentLang() === 'ar' ? 'طلب' : 'queries'}`;
  });

  // Field-level validation errors
  fieldErrors = signal<Record<string, string>>({});

  // Password Strength
  passwordStrength: { level: string; percent: number; labelAr: string; labelEn: string } | null = null;

  // Modal & Submission State
  showApprovalModal = signal(false);
  isSubmitting = signal(false);
  errorMessage = '';

  // Auto-redirect timer
  redirectCountdown = signal(5);
  private redirectTimer: any = null;

  ngOnInit() {
    this.loadPricingPlans();
  }

  loadPricingPlans() {
    this.sysAdminService.getPricingPlans().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.pricingPlans.set(res.data);
        }
      },
      error: (err) => {
        console.error('Failed to load pricing plans', err);
      }
    });
  }

  goToStep2() {
    this.fieldErrors.set({});
    const errors: Record<string, string> = {};
    const isAr = this.i18n.currentLang() === 'ar';

    if (!this.companyName.trim()) {
      errors['companyName'] = isAr ? 'اسم الشركة مطلوب' : 'Company name is required';
    }
    if (!this.selectedPlanId()) {
      errors['subscriptionPlan'] = isAr ? 'يرجى اختيار باقة الاشتراك' : 'Please select a subscription plan';
    }

    this.fieldErrors.set(errors);

    if (Object.keys(errors).length === 0) {
      this.currentStep.set(2);
    }
  }

  goToStep1() {
    this.fieldErrors.set({});
    this.currentStep.set(1);
  }

  onPasswordChange() {
    const pw = this.ownerPassword;
    if (!pw) {
      this.passwordStrength = null;
      return;
    }

    let score = 0;
    if (pw.length >= 6) score += 20;
    if (pw.length >= 10) score += 10;
    if (/[a-z]/.test(pw)) score += 15;
    if (/[A-Z]/.test(pw)) score += 15;
    if (/[0-9]/.test(pw)) score += 20;
    if (/[^a-zA-Z0-9]/.test(pw)) score += 20;

    const isAr = this.i18n.currentLang() === 'ar';
    if (score < 40) {
      this.passwordStrength = { level: 'weak', percent: score, labelAr: 'ضعيفة', labelEn: 'Weak' };
    } else if (score < 70) {
      this.passwordStrength = { level: 'medium', percent: score, labelAr: 'متوسطة', labelEn: 'Medium' };
    } else {
      this.passwordStrength = { level: 'strong', percent: score, labelAr: 'قوية', labelEn: 'Strong' };
    }
  }

  validateStep2(): boolean {
    const errors: Record<string, string> = {};
    const isAr = this.i18n.currentLang() === 'ar';

    if (!this.ownerFirstName.trim()) {
      errors['ownerFirstName'] = isAr ? 'الاسم الأول مطلوب' : 'First name is required';
    }
    if (!this.ownerLastName.trim()) {
      errors['ownerLastName'] = isAr ? 'الاسم الأخير مطلوب' : 'Last name is required';
    }
    if (!this.ownerEmail.trim()) {
      errors['ownerEmail'] = isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.ownerEmail)) {
      errors['ownerEmail'] = isAr ? 'البريد الإلكتروني غير صالح' : 'Invalid email format';
    }
    if (!this.ownerPhone.trim()) {
      errors['ownerPhone'] = isAr ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    } else if (!/^[\d\s+\-()]{7,20}$/.test(this.ownerPhone)) {
      errors['ownerPhone'] = isAr ? 'رقم الهاتف غير صالح' : 'Invalid phone number';
    }
    if (!this.ownerPassword) {
      errors['ownerPassword'] = isAr ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (this.ownerPassword.length < 6) {
      errors['ownerPassword'] = isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    } else if (this.passwordStrength && this.passwordStrength.level === 'weak') {
      errors['ownerPassword'] = isAr ? 'كلمة المرور ضعيفة جداً' : 'Password is too weak';
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  onSubmit() {
    this.errorMessage = '';

    if (!this.validateStep2()) {
      return;
    }

    const isAr = this.i18n.currentLang() === 'ar';

    if (!this.termsAccepted) {
      this.errorMessage = isAr ? 'يرجى الموافقة على شروط الخدمة وسياسة الخصوصية' : 'Please agree to the Terms of Service and Privacy Policy';
      return;
    }

    this.isSubmitting.set(true);

    const plan = this.selectedPlan();
    const payload = {
      companyName: this.companyName.trim(),
      subscriptionPlan: this.selectedPlanId(),
      price: plan ? plan.price : 0,
      aiLimit: this.computedAiLimit(),
      address: this.address.trim(),
      ownerFirstName: this.ownerFirstName.trim(),
      ownerLastName: this.ownerLastName.trim(),
      ownerEmail: this.ownerEmail.trim(),
      ownerPhone: this.ownerPhone.trim(),
      ownerPassword: this.ownerPassword
    };

    this.tenantService.registerTenant(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.showApprovalModal.set(true);
        this.startRedirectTimer();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage = err.error?.message || (isAr ? 'فشل تسجيل الشركة. الرجاء المحاولة مرة أخرى.' : 'Company registration failed. Please try again.');
        this.toastService.error(this.errorMessage, isAr ? 'خطأ في التسجيل' : 'Registration Error');
      }
    });
  }

  private startRedirectTimer() {
    this.redirectCountdown.set(5);
    this.redirectTimer = setInterval(() => {
      this.redirectCountdown.update(v => v - 1);
      if (this.redirectCountdown() <= 0) {
        this.closeApprovalModal();
      }
    }, 1000);
  }

  private resetForm() {
    this.companyName = '';
    this.address = '';
    this.ownerFirstName = '';
    this.ownerLastName = '';
    this.ownerEmail = '';
    this.ownerPhone = '';
    this.ownerPassword = '';
    this.termsAccepted = false;
    this.selectedPlanId.set('');
    this.passwordStrength = null;
    this.fieldErrors.set({});
    this.errorMessage = '';
    this.currentStep.set(1);
  }

  closeApprovalModal() {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }
    this.showApprovalModal.set(false);
    this.resetForm();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}
