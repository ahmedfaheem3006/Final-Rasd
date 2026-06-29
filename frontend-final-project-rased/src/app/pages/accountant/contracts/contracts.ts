import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../../services/contract.service';
import { I18nService } from '../../../services/i18n.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-contracts',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css'
})
export class Contracts implements OnInit {
  private contractService = inject(ContractService);
  public i18n = inject(I18nService);
  private themeService = inject(ThemeService);

  searchQuery = signal('');
  rawContracts = signal<any[]>([]);
  contracts = signal<any[]>([]);

  stats = signal([
    { label: 'إجمالي العقود',  value: '0',  color: 'primary', icon: 'fa-file-signature' },
    { label: 'نشطة',           value: '0',  color: 'success', icon: 'fa-circle-check' },
    { label: 'منتهية',         value: '0',  color: 'danger',  icon: 'fa-circle-xmark' },
    { label: 'إجمالي القيمة',  value: '$0', color: 'warning', icon: 'fa-sack-dollar' },
  ]);

  get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
  }

  ngOnInit() {
    this.loadContracts();
  }

  loadContracts() {
    this.contractService.getContracts().subscribe({
      next: (apiContracts: any) => {
        const mapped = apiContracts.map((c: any) => ({
          id:             c.id,
          contractNumber: c.contractNumber,
          client:         c.clientName || 'عميل غير معروف',
          title:          c.contractTitle,
          amount:         `${Number(c.finalAmount).toLocaleString()} ${c.currency || 'SAR'}`,
          amountNum:      Number(c.finalAmount),
          date:           c.createdAt  ? new Date(c.createdAt).toLocaleDateString()  : '',
          startDate:      c.startDate  ? new Date(c.startDate).toLocaleDateString()  : '',
          endDate:        c.endDate    ? new Date(c.endDate).toLocaleDateString()    : '',
          status:         c.status?.toLowerCase() || 'draft'
        }));

        this.rawContracts.set(mapped);
        this.contracts.set(mapped);

        // Build Stats
        const isAr    = this.i18n.currentLang() === 'ar';
        const total      = apiContracts.length;
        const active     = apiContracts.filter((c: any) => c.status?.toLowerCase() === 'active').length;
        const expired    = apiContracts.filter((c: any) => c.status?.toLowerCase() === 'expired').length;
        const totalValue = apiContracts.reduce((s: number, c: any) => s + (c.finalAmount || 0), 0);

        this.stats.set([
          { label: isAr ? 'إجمالي العقود'  : 'Total Contracts',  value: total.toString(),                                        color: 'primary', icon: 'fa-file-signature' },
          { label: isAr ? 'نشطة'           : 'Active',            value: active.toString(),                                      color: 'success', icon: 'fa-circle-check' },
          { label: isAr ? 'منتهية'         : 'Expired',           value: expired.toString(),                                     color: 'danger',  icon: 'fa-circle-xmark' },
          { label: isAr ? 'إجمالي القيمة'  : 'Total Value',       value: `${totalValue.toLocaleString()} SAR`,                   color: 'warning', icon: 'fa-sack-dollar' }
        ]);
      },
      error: (err) => console.error('Failed to load contracts', err)
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.contracts.set(this.rawContracts());
      return;
    }
    const q = query.toLowerCase();
    this.contracts.set(
      this.rawContracts().filter(c =>
        c.contractNumber.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
      )
    );
  }
}
