import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { TenantService } from '../../../services/tenant.service';

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

  tenantId = '';
  tenant = signal<any>({
    name: 'جاري التحميل...', owner: 'جاري التحميل...', email: '...', phone: '...',
    plan: '...', status: 'active', users: 1, date: '...', location: 'المملكة العربية السعودية',
    modules: ['CRM', 'HR', 'المحاسبة', 'AI Assistant', 'التقارير'],
    price: 0,
    aiLimit: 100
  });

  usageStats = signal<any[]>([]);

  recentActivity = signal([
    { action: 'تسجيل دخول المالك', time: 'منذ 5 دقائق', type: 'info' },
    { action: 'تحديث إعدادات الفوترة', time: 'منذ ساعتين', type: 'warning' },
  ]);

  // Modal edit fields
  showEditModal = signal(false);
  editPrice = 0;
  editAiLimit = 100;

  ngOnInit() {
    this.tenantId = this.route.snapshot.paramMap.get('id') || '';
    if (this.tenantId) {
      this.loadTenantDetails();
    }
  }

  loadTenantDetails() {
    this.tenantService.getTenantById(this.tenantId).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const t = res.data;
          this.tenant.set({
            name: t.name,
            owner: 'مالك الشركة',
            email: 'owner@' + t.name.replace(/\s+/g, '').toLowerCase() + '.com',
            phone: '+966 11 000 0000',
            plan: this.mapPriceToPlan(t.price),
            status: t.isActive ? 'active' : 'suspended',
            users: 1,
            date: new Date(t.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
            location: 'الرياض، المملكة العربية السعودية',
            modules: ['CRM', 'HR', 'المحاسبة', 'AI Assistant', 'التقارير'],
            price: t.price,
            aiLimit: t.aiLimit
          });

          this.usageStats.set([
            { label: 'الحد الأقصى للذكاء الاصطناعي', value: `0 / ${t.aiLimit} طلب`, percent: 0, color: 'primary' },
            { label: 'سعر الباقة شهرياً', value: `$${t.price}`, percent: 100, color: 'success' },
            { label: 'حالة الترخيص', value: t.isActive ? 'نشط' : 'معلق', percent: t.isActive ? 100 : 0, color: t.isActive ? 'success' : 'warning' }
          ]);
        }
      },
      error: (err) => {
        console.error('Failed to load tenant details', err);
        this.toastService.error('فشل في تحميل بيانات الشركة.');
      }
    });
  }

  mapPriceToPlan(price: number): string {
    if (price < 100) return 'أساسي';
    if (price < 300) return 'احترافي';
    return 'مؤسسات';
  }

  onToggleStatus() {
    const currentStatus = this.tenant().status;
    const newActiveState = currentStatus !== 'active';
    this.systemAdminService.updateTenantStatus(this.tenantId, newActiveState).subscribe({
      next: (res) => {
        const msg = newActiveState ? `تم تفعيل حساب الشركة بنجاح!` : `تم إيقاف حساب الشركة بنجاح!`;
        this.toastService.success(msg, 'تحديث الحالة');
        this.loadTenantDetails();
      },
      error: (err) => {
        console.error('Failed to toggle status', err);
        this.toastService.error('فشل في تعديل حالة الشركة.');
      }
    });
  }

  openEditModal() {
    this.editPrice = this.tenant().price;
    this.editAiLimit = this.tenant().aiLimit;
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  onSavePricing() {
    if (this.editPrice < 0 || this.editAiLimit < 0) {
      this.toastService.warning('الرجاء إدخال قيم صحيحة للأسعار والذكاء الاصطناعي.');
      return;
    }

    const payload = {
      price: Number(this.editPrice),
      aiLimit: Number(this.editAiLimit)
    };

    this.systemAdminService.updateTenantPricing(this.tenantId, payload).subscribe({
      next: (res) => {
        this.toastService.success('تم تحديث إعدادات التسعير والذكاء الاصطناعي بنجاح!', 'تعديل الخطة');
        this.loadTenantDetails();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Failed to update pricing', err);
        this.toastService.error('فشل تحديث الخطة المالية للشركة.');
      }
    });
  }
}

