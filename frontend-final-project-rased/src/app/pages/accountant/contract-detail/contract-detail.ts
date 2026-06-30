import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ContractService } from '../../../services/contract.service';
import { ThemeService } from '../../../services/theme.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contract-detail',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contract-detail.html',
  styleUrl: './contract-detail.css'
})
export class ContractDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private contractService = inject(ContractService);
  private location = inject(Location);
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);

  contractId = signal<number | null>(null);
  contract = signal<any>(null);
  isLoading = signal(true);

  get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contractId.set(Number(id));
      this.loadContract(Number(id));
    }
  }

  loadContract(id: number) {
    this.isLoading.set(true);
    this.contractService.getContract(id).subscribe({
      next: (res: any) => {
        if (res) {
          this.contract.set({
            ...res,
            idFormatted: `CTR-${String(res.id).padStart(3, '0')}`,
            dateFormatted: new Date(res.createdAt).toLocaleDateString(),
            dueDateFormatted: new Date(res.endDate).toLocaleDateString(),
            startDateFormatted: new Date(res.startDate).toLocaleDateString(),
            statusClass: res.status?.toLowerCase() || 'draft'
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load contract', err);
        this.isLoading.set(false);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل تحميل تفاصيل العقد' : 'Failed to load contract details'
        );
      }
    });
  }

  goBack() {
    this.location.back();
  }

  updateStatus(newStatus: string) {
    if (!this.contract()) return;

    const payload = {
      ...this.contract(),
      status: newStatus
    };

    this.contractService.updateContract(this.contract().id, payload).subscribe({
      next: () => {
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? 'تم تحديث حالة العقد' : 'Contract status updated'
        );
        this.loadContract(this.contract().id);
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status'
        );
      }
    });
  }
}
