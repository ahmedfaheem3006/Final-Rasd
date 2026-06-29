import { Component, signal, inject } from '@angular/core';
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
export class AddTenant {
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
  price = 49;
  aiLimit = 200;

  // Module check boxes
  isCrmEnabled = true;
  isInvoicesEnabled = true;
  isTasksEnabled = true;
  isMeetingsEnabled = true;
  isAiEnabled = true;

  isSubmitting = signal(false);

  availablePlans = [
    { id: 'starter', nameAr: 'المبتدئ', nameEn: 'Starter', price: 49, aiLimit: 200, periodAr: 'شهر', periodEn: 'mo' },
    { id: 'professional', nameAr: 'الاحترافية', nameEn: 'Professional', price: 199, aiLimit: 5000, periodAr: 'شهر', periodEn: 'mo' },
    { id: 'enterprise', nameAr: 'المؤسسات', nameEn: 'Enterprise', price: 300, aiLimit: 999999, periodAr: 'شهر', periodEn: 'mo' }
  ];

  onPricePlanChange() {
    const selected = this.availablePlans.find(p => p.price === Number(this.price));
    if (selected) {
      this.aiLimit = selected.aiLimit;
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
