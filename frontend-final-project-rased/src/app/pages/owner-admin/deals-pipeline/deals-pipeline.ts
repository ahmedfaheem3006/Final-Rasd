import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef, effect, Renderer2, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../services/i18n.service';
import { CrmService } from '../../../services/crm.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-deals-pipeline',
  imports: [CommonModule, FormsModule],
  templateUrl: './deals-pipeline.html',
  styleUrl: './deals-pipeline.css'
})
export class DealsPipeline implements OnInit {
  public i18n = inject(I18nService);
  private crmService = inject(CrmService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private renderer = inject(Renderer2);
  private themeService = inject(ThemeService);

  isLightTheme = false;

  @ViewChild('addModalOverlay', { static: false }) addModalOverlayRef!: ElementRef;
  @ViewChild('addPremiumModal', { static: false }) addPremiumModalRef!: ElementRef;
  @ViewChild('editModalOverlay', { static: false }) editModalOverlayRef!: ElementRef;
  @ViewChild('editPremiumModal', { static: false }) editPremiumModalRef!: ElementRef;

  stages = signal<any[]>([
    { key: 'initial', name: 'pipeline.stage_name.leads', color: 'primary', count: 0, value: '$0', deals: [] },
    { key: 'negotiation', name: 'pipeline.stage_name.negotiation', color: 'warning', count: 0, value: '$0', deals: [] },
    { key: 'proposal', name: 'pipeline.stage_name.proposal', color: 'info', count: 0, value: '$0', deals: [] },
    { key: 'won', name: 'pipeline.stage_name.won', color: 'success', count: 0, value: '$0', deals: [] }
  ]);

  stagesDisplay = computed(() => this.stages().map(s => ({
    ...s,
    displayName: this.i18n.t(s.name),
    displayValue: this.formatCurrency(s.rawTotal || 0),
    displayCount: this.formatDealCount(s.count)
  })));

  // Lists for dropdown options
  clientsList = signal<any[]>([]);
  usersList = signal<any[]>([]);

  // Modals Visibility
  showAddDealModal = signal(false);
  showEditDealModal = signal(false);
  isSubmitting = signal(false);

  constructor() {
    this.isLightTheme = !this.themeService.isDark();
    effect(() => {
      if (this.showAddDealModal() && this.addPremiumModalRef?.nativeElement) {
        this.renderer.appendChild(document.body, this.addModalOverlayRef.nativeElement);
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.addPremiumModalRef?.nativeElement?.focus(), 100);
      } else if (!this.showAddDealModal() && this.addPremiumModalRef?.nativeElement) {
        document.body.style.overflow = '';
      }
    });
    effect(() => {
      if (this.showEditDealModal() && this.editPremiumModalRef?.nativeElement) {
        this.renderer.appendChild(document.body, this.editModalOverlayRef.nativeElement);
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.editPremiumModalRef?.nativeElement?.focus(), 100);
      } else if (!this.showEditDealModal() && this.editPremiumModalRef?.nativeElement) {
        document.body.style.overflow = '';
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showAddDealModal()) this.closeAddModal();
    if (this.showEditDealModal()) this.closeEditModal();
  }

  // Form Fields - New Deal
  newDealClientId = 0;
  newDealAssignedUserId = 0;
  newDealAmount = 0;
  newDealStatus = 'Proposal'; // Default stage

  // Form Fields - Edit Status
  selectedDealId = 0;
  selectedDealClient = '';
  editDealStatus = '';

  ngOnInit() {
    this.loadDeals();
    this.loadDropdownData();
  }

  loadDropdownData() {
    // Load clients
    this.crmService.getClients().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.clientsList.set(res.data);
          // Set default client id if list is not empty
          if (res.data.length > 0) {
            this.newDealClientId = res.data[0].id;
          }
        }
      },
      error: (err) => console.error('Failed to load clients', err)
    });

    // Load users
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.usersList.set(res.data);
          if (res.data.length > 0) {
            this.newDealAssignedUserId = res.data[0].id;
          }
        }
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  loadDeals() {
    this.crmService.getDeals().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const apiDeals = res.data;

          const initialDeals: any[] = [];
          const negotiationDeals: any[] = [];
          const proposalDeals: any[] = [];
          const wonDeals: any[] = [];

          apiDeals.forEach((d: any) => {
            const mapped = {
              id: d.id,
              clientId: d.clientId,
              assignedUserId: d.assignedUserId,
              client: d.clientName || d.client?.name || this.i18n.t('pipeline.unknown_client'),
              rawAmount: Number(d.amount) || 0,
              agent: d.assignedUserName || this.i18n.t('pipeline.unknown_agent'),
              date: d.createdAt || null,
              status: d.status
            };

            const status = d.status?.toLowerCase();
            if (status === 'negotiation') {
              negotiationDeals.push(mapped);
            } else if (status === 'proposal') {
              proposalDeals.push(mapped);
            } else if (status === 'won') {
              wonDeals.push(mapped);
            } else {
              initialDeals.push(mapped);
            }
          });

          const rawTotal = (list: any[]) => list.reduce((sum, item) => sum + Number(item.rawAmount), 0);

          this.stages.set([
            { key: 'initial', name: 'pipeline.stage_name.leads', color: 'primary', count: initialDeals.length, rawTotal: rawTotal(initialDeals), deals: initialDeals },
            { key: 'negotiation', name: 'pipeline.stage_name.negotiation', color: 'warning', count: negotiationDeals.length, rawTotal: rawTotal(negotiationDeals), deals: negotiationDeals },
            { key: 'proposal', name: 'pipeline.stage_name.proposal', color: 'info', count: proposalDeals.length, rawTotal: rawTotal(proposalDeals), deals: proposalDeals },
            { key: 'won', name: 'pipeline.stage_name.won', color: 'success', count: wonDeals.length, rawTotal: rawTotal(wonDeals), deals: wonDeals }
          ]);
        }
      },
      error: (err) => {
        console.error('Failed to load deals in pipeline', err);
        this.toastService.error(this.i18n.t('pipeline.error.load'));
      }
    });
  }

  onViewList() {
    this.toastService.info(this.i18n.t('pipeline.warning.list_unavailable'), this.i18n.t('pipeline.warning.list_unavailable_title'));
  }

  openAddModal(defaultStatus?: string) {
    if (this.clientsList().length === 0) {
      this.toastService.warning(this.i18n.t('pipeline.warning.no_clients'));
      return;
    }
    this.newDealAmount = 0;
    this.newDealStatus = defaultStatus || 'Proposal';
    if (this.clientsList().length > 0) {
      this.newDealClientId = this.clientsList()[0].id;
    }
    if (this.usersList().length > 0) {
      this.newDealAssignedUserId = this.usersList()[0].id;
    }
    this.showAddDealModal.set(true);
  }

  closeAddModal() {
    this.showAddDealModal.set(false);
  }

  onAddDeal() {
    if (!this.newDealClientId || !this.newDealAmount || this.newDealAmount <= 0) {
      this.toastService.warning(this.i18n.t('pipeline.alert.validate_deal'));
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      clientId: Number(this.newDealClientId),
      assignedUserId: Number(this.newDealAssignedUserId) || undefined,
      amount: Number(this.newDealAmount),
      status: this.newDealStatus
    };

    this.crmService.createDeal(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const clientName = this.clientsList().find(c => c.id === Number(this.newDealClientId))?.name || this.i18n.t('pipeline.unknown_client');
        this.toastService.success(
          this.i18n.tFormat('pipeline.success.created', { name: clientName }),
          this.i18n.t('pipeline.success.created_title')
        );
        this.loadDeals();
        this.closeAddModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Failed to create deal', err);
        const errMsg = err.error?.message || this.i18n.t('pipeline.error.create');
        this.toastService.error(errMsg, this.i18n.t('pipeline.error.create_title'));
      }
    });
  }

  openEditModal(deal: any) {
    this.selectedDealId = deal.id;
    this.selectedDealClient = deal.client;
    this.editDealStatus = deal.status || 'Proposal';
    this.showEditDealModal.set(true);
  }

  closeEditModal() {
    this.showEditDealModal.set(false);
  }

  onUpdateDealStatus() {
    this.isSubmitting.set(true);
    this.crmService.updateDealStatus(this.selectedDealId, this.editDealStatus).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.success(
          this.i18n.tFormat('pipeline.success.updated', { name: this.selectedDealClient }),
          this.i18n.t('pipeline.success.updated_title')
        );
        this.loadDeals();
        this.closeEditModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Failed to update deal status', err);
        const errMsg = err.error?.message || this.i18n.t('pipeline.error.update');
        this.toastService.error(errMsg, this.i18n.t('pipeline.error.update_title'));
      }
    });
  }

  formatCurrency(amount: number): string {
    return '$' + Number(amount || 0).toLocaleString('en-US');
  }

  formatDealCount(count: number): string {
    if (count === 0) return this.i18n.t('pipeline.count.zero');
    if (this.i18n.isRtl()) {
      if (count === 1) return `1 ${this.i18n.t('pipeline.count.singular')}`;
      if (count === 2) return `2 ${this.i18n.t('pipeline.count.plural')}`;
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
