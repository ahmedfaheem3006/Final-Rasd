import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

interface PricingFeature {
  textAr: string;
  textEn: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  periodAr: string;
  periodEn: string;
  taglineAr: string;
  taglineEn: string;
  features: PricingFeature[];
}

@Component({
  selector: 'app-pricing-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css'
})
export class PricingMgmt implements OnInit {
  private systemAdminService = inject(SystemAdminService);
  private toastService = inject(ToastService);
  i18n = inject(I18nService);

  plans = signal<PricingPlan[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  showAddFeatureModal = signal(false);
  newFeatureAr = '';
  newFeatureEn = '';
  private targetPlanIndex = -1;

  ngOnInit() {
    this.loadPricingPlans();
  }

  loadPricingPlans() {
    this.isLoading.set(true);
    this.systemAdminService.getPricingPlans().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.plans.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في تحميل خطط الأسعار' : 'Failed to load pricing plans'
        );
        this.isLoading.set(false);
      }
    });
  }

  openAddFeatureModal(planIndex: number) {
    this.targetPlanIndex = planIndex;
    this.newFeatureAr = '';
    this.newFeatureEn = '';
    this.showAddFeatureModal.set(true);
  }

  closeAddFeatureModal() {
    this.showAddFeatureModal.set(false);
    this.targetPlanIndex = -1;
  }

  confirmAddFeature() {
    if (!this.newFeatureAr.trim() || !this.newFeatureEn.trim() || this.targetPlanIndex < 0) return;

    const currentPlans = [...this.plans()];
    currentPlans[this.targetPlanIndex].features.push({
      textAr: this.newFeatureAr.trim(),
      textEn: this.newFeatureEn.trim(),
      included: true
    });
    this.plans.set(currentPlans);
    this.closeAddFeatureModal();
  }

  removeFeature(planIndex: number, featureIndex: number) {
    const currentPlans = [...this.plans()];
    currentPlans[planIndex].features.splice(featureIndex, 1);
    this.plans.set(currentPlans);
  }

  savePricing() {
    this.isSaving.set(true);
    this.systemAdminService.updatePricingPlans(this.plans()).subscribe({
      next: () => {
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? 'تم حفظ الأسعار والخطط بنجاح!' : 'Pricing plans updated successfully!',
          this.i18n.currentLang() === 'ar' ? 'إدارة الأسعار' : 'Pricing Settings'
        );
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في حفظ التعديلات' : 'Failed to save changes'
        );
        this.isSaving.set(false);
      }
    });
  }
}
