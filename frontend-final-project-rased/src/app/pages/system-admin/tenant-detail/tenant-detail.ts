import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { TenantService } from '../../../services/tenant.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-tenant-detail',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tenant-detail.html',
  styleUrl: './tenant-detail.css'
})
export class TenantDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private systemAdminService = inject(SystemAdminService);
  private tenantService = inject(TenantService);
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);

  tenantId = '';
  tenant = signal<any>({
    name: 'جاري التحميل...', owner: 'جاري التحميل...', email: '...', phone: '...',
    plan: '...', status: 'active', users: 1, date: '...', location: 'المملكة العربية السعودية',
    modules: ['CRM', 'HR', 'المحاسبة', 'AI Assistant', 'التقارير'],
    price: 0,
    aiLimit: 100,
    isCrmEnabled: true,
    isInvoicesEnabled: true,
    isTasksEnabled: true,
    isMeetingsEnabled: true,
    isAiEnabled: true
  });

  usageStats = signal<any[]>([]);
  availablePlans = signal<any[]>([]);

  recentActivity = signal<any[]>([
    { action: 'تسجيل الشركة في النظام', time: 'جاري التحميل...', type: 'success' }
  ]);

  // Modal edit fields
  showEditModal = signal(false);
  editName = '';
  editOwnerName = '';
  editOwnerEmail = '';
  editPrice = 0;
  editAiLimit = 100;
  editMaxUsers = 3;
  editIsActive = true;
  editIsCrmEnabled = true;
  editIsInvoicesEnabled = true;
  editIsTasksEnabled = true;
  editIsMeetingsEnabled = true;
  editIsAiEnabled = true;
  editPhone = '';
  editLocation = '';

  ngOnInit() {
    this.tenantId = this.route.snapshot.paramMap.get('id') || '';
    if (this.tenantId) {
      this.loadTenantDetails();
      this.loadPricingPlans();
    }
  }

  loadPricingPlans() {
    this.systemAdminService.getPricingPlans().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.availablePlans.set(res.data);
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
    this.availablePlans.set([
      { id: 'free', nameAr: 'الباقة المجانية', nameEn: 'Free Trial', price: 0, aiLimit: 100, maxUsers: 1, periodAr: '3 أيام', periodEn: '3 days' },
      { id: 'starter', nameAr: 'المبتدئ', nameEn: 'Starter', price: 50, aiLimit: 200, maxUsers: 3, periodAr: 'شهر', periodEn: 'mo' },
      { id: 'professional', nameAr: 'الاحترافية', nameEn: 'Professional', price: 200, aiLimit: 5000, maxUsers: 15, periodAr: 'شهر', periodEn: 'mo' },
      { id: 'enterprise', nameAr: 'المؤسسات', nameEn: 'Enterprise', price: 350, aiLimit: 999999, maxUsers: 999999, periodAr: 'شهر', periodEn: 'mo' }
    ]);
  }

  loadTenantDetails() {
    this.tenantService.getTenantById(this.tenantId).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const t = res.data;
          const isAr = this.i18n.currentLang() === 'ar';
          
          const phone = t.phone || localStorage.getItem(`tenant_phone_${this.tenantId}`) || '+966 11 000 0000';
          const location = t.address || localStorage.getItem(`tenant_location_${this.tenantId}`) || (isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia');

          this.tenant.set({
            name: t.name,
            owner: t.ownerName || (isAr ? 'غير محدد' : 'Not Set'),
            email: t.ownerEmail || '...',
            phone: phone,
            plan: this.mapPriceToPlan(t.price),
            status: t.isActive ? 'active' : 'suspended',
            users: 1,
            date: new Date(t.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            location: location,
            modules: this.getActiveModules(t),
            price: t.price,
            aiLimit: t.aiLimit,
            maxUsers: t.maxUsers,
            currentUserCount: t.currentUserCount,
            isCrmEnabled: t.isCrmEnabled,
            isInvoicesEnabled: t.isInvoicesEnabled,
            isTasksEnabled: t.isTasksEnabled,
            isMeetingsEnabled: t.isMeetingsEnabled,
            isAiEnabled: t.isAiEnabled
          });

          // 1. AI requests progress calculation
          const isUnlimited = t.aiLimit >= 999999;
          const aiLimitText = isUnlimited 
            ? (isAr ? 'غير محدود' : 'Unlimited') 
            : `${t.aiLimit} (${isAr ? 'محدودة' : 'Limited'})`;
          const aiPercent = isUnlimited ? 0 : Math.min(100, Math.round((t.aiUsageCount / t.aiLimit) * 100));

          // 2. Billing cycle progress calculation — 3-day window for free trial, 30-day monthly cycle otherwise
          const isFreeTrial = t.price === 0;
          const cycleLength = isFreeTrial ? 3 : 30;
          const createdDate = new Date(t.createdAt);
          const now = new Date();
          const diffMs = now.getTime() - createdDate.getTime();
          const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          const billingDay = isFreeTrial ? Math.min(diffDays + 1, cycleLength) : (diffDays % cycleLength) + 1;
          const billingPercent = Math.min(100, Math.round((billingDay / cycleLength) * 100));

          this.usageStats.set([
            {
              label: isAr ? 'الحد الأقصى للذكاء الاصطناعي' : 'AI Consumption Limit',
              value: `${t.aiUsageCount} / ${aiLimitText} ${isAr ? 'طلب' : 'Requests'}`,
              percent: aiPercent,
              color: 'primary'
            },
            {
              label: isFreeTrial
                ? (isAr ? 'الفترة التجريبية المجانية (3 أيام)' : 'Free Trial Period (3 days)')
                : (isAr ? `دورة الاشتراك شهرياً ($${t.price})` : `Monthly Plan Billing ($${t.price})`),
              value: `${billingDay} / ${cycleLength} ${isAr ? 'يوم' : 'Days'}`,
              percent: billingPercent,
              color: isFreeTrial && billingDay >= cycleLength ? 'warning' : 'success'
            },
            { 
              label: isAr ? 'حالة الترخيص' : 'License Status', 
              value: t.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق / موقوف' : 'Suspended'), 
              percent: t.isActive ? 100 : 0, 
              color: t.isActive ? 'success' : 'warning' 
            }
          ]);

          if (t.recentActivities && t.recentActivities.length > 0) {
            const mappedActivities = t.recentActivities.map((act: any) => {
              let timeStr = act.time;
              if (timeStr && !timeStr.endsWith('Z') && !timeStr.includes('+') && !timeStr.includes('-')) {
                timeStr += 'Z';
              }
              const dt = new Date(timeStr);
              const relativeTime = this.getRelativeTimeString(dt);
              return {
                action: act.action,
                time: relativeTime,
                type: act.type
              };
            });
            this.recentActivity.set(mappedActivities);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load tenant details', err);
        this.toastService.error(this.i18n.currentLang() === 'ar' ? 'فشل في تحميل بيانات الشركة.' : 'Failed to load company details.');
      }
    });
  }

  getActiveModules(t: any): string[] {
    const isAr = this.i18n.currentLang() === 'ar';
    const list: string[] = [];
    if (t.isCrmEnabled) list.push('CRM');
    if (t.isInvoicesEnabled) list.push('HR');
    if (t.isTasksEnabled) list.push(isAr ? 'المحاسبة' : 'Accounting');
    if (t.isMeetingsEnabled) list.push('AI Assistant');
    if (t.isAiEnabled) list.push(isAr ? 'التقارير' : 'Reports');
    return list;
  }

  getRelativeTimeString(date: Date): string {
    const isAr = this.i18n.currentLang() === 'ar';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return isAr ? 'الآن' : 'just now';
    if (diffMins < 60) return isAr ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  }

  mapPriceToPlan(price: number): string {
    const isAr = this.i18n.currentLang() === 'ar';
    if (price === 0) return isAr ? 'تجريبية مجانية' : 'Free Trial';
    if (price < 100) return isAr ? 'أساسي' : 'Basic';
    if (price < 300) return isAr ? 'احترافي' : 'Professional';
    return isAr ? 'مؤسسات' : 'Enterprise';
  }

  onToggleStatus() {
    const currentStatus = this.tenant().status;
    const newActiveState = currentStatus !== 'active';
    const isAr = this.i18n.currentLang() === 'ar';
    this.systemAdminService.updateTenantStatus(this.tenantId, newActiveState).subscribe({
      next: (res) => {
        const msg = newActiveState 
          ? (isAr ? 'تم تفعيل حساب الشركة بنجاح!' : 'Company account activated successfully!') 
          : (isAr ? 'تم إيقاف حساب الشركة بنجاح!' : 'Company account suspended successfully!');
        this.toastService.success(msg, isAr ? 'تحديث الحالة' : 'Status Updated');
        this.loadTenantDetails();
      },
      error: (err) => {
        console.error('Failed to toggle status', err);
        this.toastService.error(isAr ? 'فشل في تعديل حالة الشركة.' : 'Failed to update company status.');
      }
    });
  }

  openEditModal() {
    const t = this.tenant();
    this.editName = t.name;
    this.editOwnerName = t.owner;
    this.editOwnerEmail = t.email;
    this.editPrice = t.price;
    this.editAiLimit = t.aiLimit;
    this.editMaxUsers = t.maxUsers ?? this.getPlanDefaultMaxUsers(t.price);
    this.editIsActive = t.status === 'active';
    this.editIsCrmEnabled = t.isCrmEnabled;
    this.editIsInvoicesEnabled = t.isInvoicesEnabled;
    this.editIsTasksEnabled = t.isTasksEnabled;
    this.editIsMeetingsEnabled = t.isMeetingsEnabled;
    this.editIsAiEnabled = t.isAiEnabled;
    this.editPhone = t.phone || '';
    this.editLocation = t.location || '';
    this.showEditModal.set(true);
  }

  onPricePlanChange() {
    this.editAiLimit = this.getPlanDefaultAiLimit(this.editPrice);
    this.editMaxUsers = this.getPlanDefaultMaxUsers(this.editPrice);
  }

  // Returns the standard AI limit for a given price tier — used both to
  // auto-fill on plan switch and to show admins the tier default vs. a
  // manually overridden value in the edit modal.
  getPlanDefaultAiLimit(price: number): number {
    const p = Number(price);
    const selected = this.availablePlans().find(plan => Number(plan.price) === p);
    if (selected) return selected.aiLimit;
    // Fallback if price doesn't match a known plan
    if (p === 0) return 100;
    if (p <= 50) return 200;
    if (p <= 200) return 5000;
    return 999999;
  }

  resetAiLimitToPlanDefault() {
    this.editAiLimit = this.getPlanDefaultAiLimit(this.editPrice);
  }

  getPlanDefaultMaxUsers(price: number): number {
    const p = Number(price);
    const selected = this.availablePlans().find(plan => Number(plan.price) === p);
    if (selected) return selected.maxUsers ?? 3;
    if (p === 0) return 1;
    if (p <= 50) return 3;
    if (p <= 200) return 15;
    return 999999;
  }

  resetMaxUsersToPlanDefault() {
    this.editMaxUsers = this.getPlanDefaultMaxUsers(this.editPrice);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  onSavePricing() {
    const isAr = this.i18n.currentLang() === 'ar';
    if (!this.editName || !this.editOwnerName || !this.editOwnerEmail) {
      this.toastService.warning(isAr ? 'الرجاء تعبئة جميع الحقول المطلوبة.' : 'Please fill all required fields.');
      return;
    }

    const payload = {
      name: this.editName,
      price: Number(this.editPrice),
      aiLimit: Number(this.editAiLimit),
      maxUsers: Number(this.editMaxUsers),
      isActive: this.editIsActive,
      ownerName: this.editOwnerName,
      ownerEmail: this.editOwnerEmail,
      isCrmEnabled: this.editIsCrmEnabled,
      isInvoicesEnabled: this.editIsInvoicesEnabled,
      isTasksEnabled: this.editIsTasksEnabled,
      isMeetingsEnabled: this.editIsMeetingsEnabled,
      isAiEnabled: this.editIsAiEnabled,
      address: this.editLocation,
      phone: this.editPhone
    };

    this.systemAdminService.updateTenantFull(this.tenantId, payload).subscribe({
      next: (res) => {
        // Save Phone and Location locally as fallback/cache
        localStorage.setItem(`tenant_phone_${this.tenantId}`, this.editPhone);
        localStorage.setItem(`tenant_location_${this.tenantId}`, this.editLocation);

        this.toastService.success(
          isAr ? 'تم تحديث بيانات الشركة والمالك بنجاح!' : 'Company and owner details updated successfully!',
          isAr ? 'تحديث البيانات' : 'Update Details'
        );
        this.loadTenantDetails();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Failed to update tenant details', err);
        this.toastService.error(isAr ? 'فشل تحديث بيانات الشركة.' : 'Failed to update company details.');
      }
    });
  }
}
