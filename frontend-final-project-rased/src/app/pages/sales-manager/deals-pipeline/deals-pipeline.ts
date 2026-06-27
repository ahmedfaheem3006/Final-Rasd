import { Component, signal, computed, ViewChild, ElementRef, effect, Renderer2, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../services/theme.service';
import { I18nService } from '../../../services/i18n.service';

interface Deal {
  client: string;
  value: string;
  agent: string;
  date: string;
}

interface Stage {
  name: string;
  color: string;
  count: number;
  value: string;
  deals: Deal[];
}

@Component({
  selector: 'app-deals-pipeline',
  imports: [CommonModule, FormsModule],
  templateUrl: './deals-pipeline.html',
  styleUrl: './deals-pipeline.css'
})
export class SalesManagerDealsPipeline {
  public i18n = inject(I18nService);
  private renderer = inject(Renderer2);
  private themeService = inject(ThemeService);

  isLightTheme = false;

  @ViewChild('premiumModalOverlay', { static: false }) modalOverlayRef!: ElementRef;
  @ViewChild('premiumModal', { static: false }) premiumModalRef!: ElementRef;

  showModal = signal(false);
  isSubmitting = signal(false);

  newClient = '';
  newValue: number | null = null;
  newDealStatus = 'Proposal';

  constructor() {
    this.isLightTheme = !this.themeService.isDark();
    effect(() => {
      if (this.showModal() && this.premiumModalRef?.nativeElement) {
        this.renderer.appendChild(document.body, this.modalOverlayRef.nativeElement);
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.premiumModalRef?.nativeElement?.focus(), 100);
      } else if (!this.showModal() && this.premiumModalRef?.nativeElement) {
        document.body.style.overflow = '';
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showModal()) this.showModal.set(false);
  }

  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.newClient = '';
    this.newValue = null;
    this.newDealStatus = 'Proposal';
  }

  addDeal() {
    if (!this.newClient || !this.newValue) {
      alert(this.i18n.t('pipeline.alert.validate'));
      return;
    }
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.closeModal();
    }, 600);
  }

  stages = signal([
    {
      name: 'pipeline.stage_name.leads', color: 'primary', count: 0, value: '$0',
      deals: [] as Deal[]
    },
    {
      name: 'pipeline.stage_name.negotiation', color: 'warning', count: 0, value: '$0',
      deals: [] as Deal[]
    },
    {
      name: 'pipeline.stage_name.proposal', color: 'info', count: 0, value: '$0',
      deals: [] as Deal[]
    },
    {
      name: 'pipeline.stage_name.won', color: 'success', count: 0, value: '$0',
      deals: [] as Deal[]
    },
  ]);

  stagesDisplay = computed(() => this.stages().map(s => ({
    ...s,
    displayName: this.i18n.t(s.name),
    displayCount: this.formatDealCount(s.count)
  })));

  formatCurrency(amount: number): string {
    return '$' + Number(amount || 0).toLocaleString('en-US');
  }

  formatDealCount(count: number): string {
    if (count === 0) return this.i18n.t('pipeline.count.zero');
    if (this.i18n.isRtl()) {
      if (count === 1) return `1 ${this.i18n.t('pipeline.count.singular')}`;
      return `${count} ${this.i18n.t('pipeline.count.plural')}`;
    }
    if (count === 1) return `1 ${this.i18n.t('pipeline.count.singular')}`;
    return `${count} ${this.i18n.t('pipeline.count.plural')}`;
  }

  formatLocaleDate(dateStr: string | null): string {
    if (!dateStr) return this.i18n.t('pipeline.joined.recently');
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
