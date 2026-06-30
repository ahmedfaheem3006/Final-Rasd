import { Component, signal, inject, OnInit, Input, Output, EventEmitter, Renderer2, ElementRef, ViewChild, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ClientFinancialService } from '../../../services/client-financial.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-client-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.css'
})
export class ClientDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientFinancialService);
  private toastService = inject(ToastService);
  themeService = inject(ThemeService);
  i18n = inject(I18nService);
  private renderer = inject(Renderer2);

  @Input() clientId: string | number | null = null;
  @Output() close = new EventEmitter<void>();

  @ViewChild('modalOverlay') overlayRef!: ElementRef;
  private overlayMoved = false;

  client = signal<any>(null);
  loading = signal(true);
  activeTab = signal<'overview' | 'contracts' | 'invoices' | 'payments' | 'deals' | 'notes'>('overview');

  constructor() {
    effect(() => {
      if (!this.overlayMoved && this.overlayRef?.nativeElement) {
        this.renderer.appendChild(document.body, this.overlayRef.nativeElement);
        this.overlayMoved = true;
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }

  ngOnInit() {
    const id = this.clientId || this.route.snapshot.paramMap.get('id');
    if (id) this.loadClient(+id);
  }

  private loadClient(id: number) {
    this.loading.set(true);
    this.clientService.getClientById(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.success && res.data) this.client.set(res.data);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error(this.i18n.t('common.error'), this.i18n.t('common.error'));
      }
    });
  }

  setTab(tab: 'overview' | 'contracts' | 'invoices' | 'payments' | 'deals' | 'notes') {
    this.activeTab.set(tab);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const locale = this.i18n.isRtl() ? 'ar-SA' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
