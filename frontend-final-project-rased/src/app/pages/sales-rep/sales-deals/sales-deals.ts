import { Component, signal, ViewChild, ElementRef, effect, Renderer2, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../services/theme.service';
import { I18nService } from '../../../services/i18n.service';

interface Deal {
  id: number;
  client: string;
  value: number;
  date: string;
  stage: 'prospects' | 'negotiation' | 'proposal' | 'closed';
}

@Component({
  selector: 'app-sales-deals',
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-deals.html',
  styleUrl: './sales-deals.css'
})
export class SalesDeals {
  public i18n = inject(I18nService);
  private renderer = inject(Renderer2);
  private themeService = inject(ThemeService);

  isLightTheme = false;

  @ViewChild('premiumModalOverlay', { static: false }) modalOverlayRef!: ElementRef;
  @ViewChild('premiumModal', { static: false }) premiumModalRef!: ElementRef;

  isSubmitting = signal(false);

  constructor() {
    this.isLightTheme = !this.themeService.isDark();
    effect(() => {
      if (this.isModalOpen() && this.premiumModalRef?.nativeElement) {
        this.renderer.appendChild(document.body, this.modalOverlayRef.nativeElement);
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.premiumModalRef?.nativeElement?.focus(), 100);
      } else if (!this.isModalOpen() && this.premiumModalRef?.nativeElement) {
        document.body.style.overflow = '';
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isModalOpen()) this.closeModal();
  }

  deals = signal<Deal[]>([
    { id: 1, client: 'Al-Takamul Al-Taqani Group', value: 12500, date: 'today', stage: 'prospects' },
    { id: 2, client: 'Al-Amal Consulting Company', value: 8800, date: 'yesterday', stage: 'prospects' },
    { id: 3, client: 'Saudi Corp Services', value: 24000, date: 'today', stage: 'negotiation' },
    { id: 4, client: 'Smart Business Systems', value: 18500, date: '10 Jun', stage: 'negotiation' },
    { id: 5, client: 'National Solutions Company', value: 15000, date: 'yesterday', stage: 'proposal' },
    { id: 6, client: 'Al-Fozan Distribution', value: 31000, date: '5 Jun', stage: 'closed' }
  ]);

  stages = [
    { key: 'prospects', name: 'sales_deals.stage.prospects', color: 'primary' },
    { key: 'negotiation', name: 'sales_deals.stage.negotiation', color: 'warning' },
    { key: 'proposal', name: 'sales_deals.stage.proposal', color: 'info' },
    { key: 'closed', name: 'sales_deals.stage.closed', color: 'success' }
  ];

  isModalOpen = signal(false);
  
  // Form Fields
  newClient = '';
  newValue: number | null = null;
  newStage: 'prospects' | 'negotiation' | 'proposal' | 'closed' = 'prospects';

  getDealsByStage(stageKey: string) {
    return this.deals().filter(d => d.stage === stageKey);
  }

  getStageSum(stageKey: string): string {
    const sum = this.deals()
      .filter(d => d.stage === stageKey)
      .reduce((acc, curr) => acc + curr.value, 0);
    return '$' + sum.toLocaleString('en-US');
  }

  formatCurrency(val: number): string {
    return '$' + Number(val || 0).toLocaleString('en-US');
  }

  moveDeal(dealId: number, direction: 'forward' | 'backward') {
    const stageOrder: ('prospects' | 'negotiation' | 'proposal' | 'closed')[] = [
      'prospects',
      'negotiation',
      'proposal',
      'closed'
    ];

    this.deals.update(prev => 
      prev.map(d => {
        if (d.id === dealId) {
          const currentIndex = stageOrder.indexOf(d.stage);
          let newIndex = currentIndex;
          if (direction === 'forward' && currentIndex < stageOrder.length - 1) {
            newIndex++;
          } else if (direction === 'backward' && currentIndex > 0) {
            newIndex--;
          }
          return { ...d, stage: stageOrder[newIndex] };
        }
        return d;
      })
    );
  }

  openModal(stageKey?: 'prospects' | 'negotiation' | 'proposal' | 'closed') {
    if (stageKey) {
      this.newStage = stageKey;
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  addDeal() {
    if (!this.newClient || !this.newValue) {
      alert(this.i18n.t('sales_deals.alert.validate'));
      return;
    }

    this.isSubmitting.set(true);

    const newDealItem: Deal = {
      id: Date.now(),
      client: this.newClient,
      value: this.newValue,
      date: 'today',
      stage: this.newStage
    };

    setTimeout(() => {
      this.deals.update(prev => [...prev, newDealItem]);
      this.isSubmitting.set(false);
      this.closeModal();
    }, 600);
  }

  getDateLabel(date: string): string {
    if (date === 'today') return this.i18n.t('dashboard.today');
    if (date === 'yesterday') return this.i18n.t('dashboard.yesterday');
    return date;
  }

  private resetForm() {
    this.newClient = '';
    this.newValue = null;
    this.newStage = 'prospects';
  }
}
