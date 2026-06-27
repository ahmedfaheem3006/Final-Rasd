import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-tenants',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tenants.html',
  styleUrl: './tenants.css'
})
export class Tenants implements OnInit {
  private systemAdminService = inject(SystemAdminService);
  private toastService = inject(ToastService);
  i18n = inject(I18nService);

  tenants = signal<any[]>([]);
  searchQuery = signal('');
  filteredTenants = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.tenants();
    if (!query) return list;
    return list.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.owner.toLowerCase().includes(query) ||
      t.plan.toLowerCase().includes(query)
    );
  });

  // Statistics computed dynamically from the tenants list
  stats = computed(() => {
    const list = this.tenants();
    const total = list.length;
    const active = list.filter(t => t.status === 'active').length;
    const suspended = list.filter(t => t.status === 'suspended').length;
    const monthlyRevenue = list.reduce((sum, t) => sum + Number(t.price || 0), 0);
    const isAr = this.i18n.currentLang() === 'ar';

    return [
      { label: isAr ? 'إجمالي الشركات' : 'Total Companies', value: total.toString(), color: 'primary' },
      { label: isAr ? 'شركات نشطة' : 'Active Companies', value: active.toString(), color: 'success' },
      { label: isAr ? 'معلقة / موقوفة' : 'Suspended / Suspended', value: suspended.toString(), color: 'warning' },
      { label: isAr ? 'الإيرادات المتوقعة' : 'Expected Revenue', value: `$${monthlyRevenue}/${isAr ? 'شهر' : 'mo'}`, color: 'info' }
    ];
  });

  // Modal states
  showCreateModal = signal(false);
  showEditPricingModal = signal(false);

  // Form Fields - New Company
  newCompanyName = '';
  newOwnerFullName = '';
  newOwnerEmail = '';
  newOwnerPassword = '';
  newPrice = 100;
  newAiLimit = 100;

  // Form Fields - Edit Pricing
  selectedTenantId = '';
  selectedTenantName = '';
  editPrice = 0;
  editAiLimit = 100;

  ngOnInit() {
    this.loadTenants();
  }

  loadTenants() {
    const isAr = this.i18n.currentLang() === 'ar';
    this.systemAdminService.getTenants().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.tenants.set(res.data.map((t: any) => ({
            id: t.tenantId,
            name: t.name,
            owner: t.ownerName || (isAr ? 'مالك الشركة' : 'Company Owner'),
            plan: this.mapPriceToPlan(t.price),
            users: 1, // Default or generic
            status: t.isActive ? 'active' : 'suspended',
            date: new Date(t.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            revenue: `$${t.price}/${isAr ? 'شهر' : 'mo'}`,
            price: t.price,
            aiLimit: t.aiLimit
          })));
        }
      },
      error: (err) => {
        console.error('Failed to load tenants', err);
        this.toastService.error(
          isAr ? 'فشل في تحميل قائمة الشركات المسجلة.' : 'Failed to load registered companies.'
        );
      }
    });
  }

  mapPriceToPlan(price: number): string {
    const isAr = this.i18n.currentLang() === 'ar';
    if (price < 100) return isAr ? 'أساسي' : 'Basic';
    if (price < 300) return isAr ? 'احترافي' : 'Professional';
    return isAr ? 'مؤسسات' : 'Enterprise';
  }

  onToggleStatus(tenant: any) {
    const isAr = this.i18n.currentLang() === 'ar';
    const newActiveState = tenant.status !== 'active';
    this.systemAdminService.updateTenantStatus(tenant.id, newActiveState).subscribe({
      next: (res) => {
        const msg = isAr 
          ? (newActiveState ? `تم تفعيل حساب شركة "${tenant.name}" بنجاح!` : `تم إيقاف حساب شركة "${tenant.name}" بنجاح!`)
          : (newActiveState ? `Company "${tenant.name}" activated successfully!` : `Company "${tenant.name}" suspended successfully!`);
        this.toastService.success(msg, isAr ? 'تحديث الحالة' : 'Status Update');
        this.loadTenants();
      },
      error: (err) => {
        console.error('Failed to update tenant status', err);
        this.toastService.error(isAr ? 'فشل في تعديل حالة الشركة.' : 'Failed to modify company status.');
      }
    });
  }

  openCreateModal() {
    this.newCompanyName = '';
    this.newOwnerFullName = '';
    this.newOwnerEmail = '';
    this.newOwnerPassword = '';
    this.newPrice = 100;
    this.newAiLimit = 100;
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  onCreateTenant() {
    const isAr = this.i18n.currentLang() === 'ar';
    if (!this.newCompanyName || !this.newOwnerFullName || !this.newOwnerEmail || !this.newOwnerPassword) {
      this.toastService.warning(
        isAr ? 'الرجاء إدخال كافة الحقول المطلوبة لتسجيل الشركة.' : 'Please fill all required fields to register the company.'
      );
      return;
    }

    const payload = {
      companyName: this.newCompanyName,
      ownerFullName: this.newOwnerFullName,
      ownerEmail: this.newOwnerEmail,
      ownerPassword: this.newOwnerPassword,
      price: Number(this.newPrice),
      aiLimit: Number(this.newAiLimit)
    };

    this.systemAdminService.createTenant(payload).subscribe({
      next: (res) => {
        this.toastService.success(
          isAr ? `تم تسجيل شركة "${this.newCompanyName}" وتعيين المالك بنجاح!` : `Company "${this.newCompanyName}" registered and owner assigned successfully!`,
          isAr ? 'تسجيل شركة' : 'Register Tenant'
        );
        this.loadTenants();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Failed to create tenant', err);
        const errMsg = err.error?.message || 
          (isAr ? 'فشل تسجيل الشركة الجديدة. تأكد من البيانات.' : 'Failed to register the new company. Please check input details.');
        this.toastService.error(errMsg, isAr ? 'خطأ في العملية' : 'Error');
      }
    });
  }

  openEditPricingModal(tenant: any) {
    this.selectedTenantId = tenant.id;
    this.selectedTenantName = tenant.name;
    this.editPrice = tenant.price;
    this.editAiLimit = tenant.aiLimit;
    this.showEditPricingModal.set(true);
  }

  closeEditPricingModal() {
    this.showEditPricingModal.set(false);
  }

  onSavePricing() {
    const isAr = this.i18n.currentLang() === 'ar';
    if (this.editPrice < 0 || this.editAiLimit < 0) {
      this.toastService.warning(
        isAr ? 'الرجاء إدخال قيم صحيحة للأسعار وحدود الذكاء الاصطناعي.' : 'Please enter valid values for pricing and AI limits.'
      );
      return;
    }

    const payload = {
      price: Number(this.editPrice),
      aiLimit: Number(this.editAiLimit)
    };

    this.systemAdminService.updateTenantPricing(this.selectedTenantId, payload).subscribe({
      next: (res) => {
        this.toastService.success(
          isAr ? `تم تحديث خطة وأسعار شركة "${this.selectedTenantName}" بنجاح!` : `Plan and pricing for company "${this.selectedTenantName}" updated successfully!`,
          isAr ? 'تعديل الأسعار' : 'Update Pricing'
        );
        this.loadTenants();
        this.closeEditPricingModal();
      },
      error: (err) => {
        console.error('Failed to update pricing', err);
        this.toastService.error(
          isAr ? 'فشل تحديث الإعدادات المالية والذكاء الاصطناعي للشركة.' : 'Failed to update company financial and AI settings.'
        );
      }
    });
  }

  onDeleteTenant(id: string, name: string) {
    const isAr = this.i18n.currentLang() === 'ar';
    const confirmMsg = isAr
      ? `هل أنت متأكد من حذف شركة "${name}" وكل بياناتها وموظفيها نهائياً من النظام؟`
      : `Are you sure you want to permanently delete company "${name}" along with all its data and employees from the system?`;

    if (confirm(confirmMsg)) {
      this.systemAdminService.deleteTenant(id).subscribe({
        next: (res) => {
          this.toastService.success(
            isAr ? `تم حذف شركة "${name}" بنجاح من النظام.` : `Company "${name}" successfully deleted from the system.`,
            isAr ? 'حذف شركة' : 'Delete Tenant'
          );
          this.loadTenants();
        },
        error: (err) => {
          console.error('Failed to delete tenant', err);
          this.toastService.error(
            isAr ? 'فشل في حذف الشركة. قد يكون هناك قيود أمان.' : 'Failed to delete company. There might be safety restrictions.'
          );
        }
      });
    }
  }
}

