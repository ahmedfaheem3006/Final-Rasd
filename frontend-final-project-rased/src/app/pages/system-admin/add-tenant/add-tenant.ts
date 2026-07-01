import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-add-tenant',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-tenant.html',
  styleUrl: './add-tenant.css'
})
export class AddTenant implements OnInit {
  private systemAdminService = inject(SystemAdminService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  i18n = inject(I18nService);

  // Form Fields
  companyName = '';
  ownerFullName = '';
  ownerEmail = '';
  ownerPassword = '';
  phone = '';
  location = '';
  price = 50;
  aiLimit = 200;
  maxUsers = 3;

  // Module check boxes
  isCrmEnabled = true;
  isInvoicesEnabled = true;
  isTasksEnabled = true;
  isMeetingsEnabled = true;
  isAiEnabled = true;

  isSubmitting = signal(false);

  availablePlans: any[] = [];

  ngOnInit() {
    this.loadPricingPlans();
  }

  loadPricingPlans() {
    this.systemAdminService.getPricingPlans().subscribe({
      next: (res) => {
        if (res && res.success && res.data && Array.isArray(res.data)) {
          // Paid plans only — free trial tenants are created via self-service registration, not by an admin.
          this.availablePlans = res.data
            .filter((p: any) => p.id !== 'free' && p.price > 0)
            .map((p: any) => ({
              id: p.id,
              nameAr: p.nameAr,
              nameEn: p.nameEn,
              price: p.price,
              aiLimit: p.aiLimit ?? 200,
              maxUsers: p.maxUsers ?? 3,
              periodAr: p.periodAr || 'شهر',
              periodEn: p.periodEn || 'mo'
            }));

          // Set default selected price and aiLimit
          if (this.availablePlans.length > 0) {
            this.price = this.availablePlans[0].price;
            this.aiLimit = this.availablePlans[0].aiLimit;
            this.maxUsers = this.availablePlans[0].maxUsers ?? 3;
          }
        } else {
          this.setFallbackPlans();
        }
      },
      error: (err) => {
        console.warn('Failed to load dynamic pricing plans, using fallbacks.', err);
        this.setFallbackPlans();
      }
    });
  }

  setFallbackPlans() {
    this.availablePlans = [
      { id: 'starter', nameAr: 'المبتدئ', nameEn: 'Starter', price: 50, aiLimit: 200, maxUsers: 3, periodAr: 'شهر', periodEn: 'mo' },
      { id: 'professional', nameAr: 'الاحترافية', nameEn: 'Professional', price: 200, aiLimit: 5000, maxUsers: 15, periodAr: 'شهر', periodEn: 'mo' },
      { id: 'enterprise', nameAr: 'المؤسسات', nameEn: 'Enterprise', price: 350, aiLimit: 999999, maxUsers: 999999, periodAr: 'شهر', periodEn: 'mo' }
    ];
    this.price = 50;
    this.aiLimit = 200;
    this.maxUsers = 3;
  }

  onPricePlanChange() {
    const selected = this.availablePlans.find(p => p.price === Number(this.price));
    if (selected) {
      this.aiLimit = selected.aiLimit;
      this.maxUsers = selected.maxUsers ?? 3;
    }
  }

  onSubmit() {
    if (!this.companyName || !this.ownerFullName || !this.ownerEmail || !this.ownerPassword) {
      this.toastService.warning(
        this.i18n.currentLang() === 'ar' ? 'الرجاء إدخال الحقول المطلوبة' : 'Please fill all required fields'
      );
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      companyName: this.companyName,
      ownerFullName: this.ownerFullName,
      ownerEmail: this.ownerEmail,
      ownerPassword: this.ownerPassword,
      price: Number(this.price),
      aiLimit: Number(this.aiLimit),
      maxUsers: Number(this.maxUsers),
      isCrmEnabled: this.isCrmEnabled,
      isInvoicesEnabled: this.isInvoicesEnabled,
      isTasksEnabled: this.isTasksEnabled,
      isMeetingsEnabled: this.isMeetingsEnabled,
      isAiEnabled: this.isAiEnabled
    };

    this.systemAdminService.createTenant(payload).subscribe({
      next: (res) => {
        const tenantId = res.data?.tenantId || '';
        if (tenantId) {
          localStorage.setItem(`tenant_phone_${tenantId}`, this.phone);
          localStorage.setItem(`tenant_location_${tenantId}`, this.location);
        }

        this.toastService.success(
          this.i18n.currentLang() === 'ar' 
            ? `تم تسجيل شركة "${this.companyName}" بنجاح!` 
            : `Company "${this.companyName}" registered successfully!`,
          this.i18n.currentLang() === 'ar' ? 'تسجيل شركة' : 'Register Tenant'
        );
        this.isSubmitting.set(false);
        this.router.navigate(['/app/sys-admin/tenants']);
      },
      error: (err) => {
        console.error('Failed to register tenant', err);
        const errMsg = err.error?.message || 
          (this.i18n.currentLang() === 'ar' ? 'فشل تسجيل الشركة. تأكد من البيانات.' : 'Failed to register company.');
        this.toastService.error(errMsg, this.i18n.currentLang() === 'ar' ? 'خطأ في العملية' : 'Error');
        this.isSubmitting.set(false);
      }
    });
  }
}
