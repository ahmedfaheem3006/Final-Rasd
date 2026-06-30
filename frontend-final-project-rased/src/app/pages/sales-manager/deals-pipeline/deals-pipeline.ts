import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../../services/crm.service';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';

interface Deal {
  id: number;
  clientId: number;
  clientName: string;
  assignedUserId?: number | null;
  assignedUserName: string;
  amount: number;
  status: string;
  createdAt: string;
}

type ModalMode = 'create' | 'edit' | null;

const STAGES = [
  { key: 'Proposal',    label: 'عرض سعر',    color: 'primary' },
  { key: 'Negotiation', label: 'تفاوض',       color: 'warning' },
  { key: 'Won',         label: 'مكتملة',      color: 'success' },
  { key: 'Lost',        label: 'خسارة',       color: 'danger'  },
];

@Component({
  selector: 'app-deals-pipeline',
  imports: [CommonModule, FormsModule],
  templateUrl: './deals-pipeline.html',
  styleUrl: './deals-pipeline.css'
})
export class SalesManagerDealsPipeline implements OnInit {
  public i18n = inject(I18nService);
  private crmService = inject(CrmService);
  private authService = inject(AuthService);

  deals = signal<Deal[]>([]);
  clients = signal<any[]>([]);
  users = signal<any[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  modalMode = signal<ModalMode>(null);
  deleteTargetId = signal<number | null>(null);
  defaultStage = signal('Proposal');

  stages = STAGES;

  form = {
    id: 0,
    clientId: 0,
    assignedUserId: null as number | null,
    amount: 0,
    status: 'Proposal',
  };

  // Deals grouped by stage
  dealsByStage = computed(() => {
    const all = this.deals();
    const map: Record<string, Deal[]> = {};
    STAGES.forEach(s => { map[s.key] = all.filter(d => d.status === s.key); });
    return map;
  });

  // Stats
  stats = computed(() => {
    const all = this.deals();
    const total = all.length;
    const totalValue = all.reduce((s, d) => s + d.amount, 0);
    const won = all.filter(d => d.status === 'Won');
    const wonValue = won.reduce((s, d) => s + d.amount, 0);
    const winRate = total > 0 ? Math.round((won.length / total) * 100) : 0;
    return { total, totalValue, wonCount: won.length, wonValue, winRate };
  });

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.crmService.getDeals().subscribe({
      next: (r: any) => {
        const list = r?.data ?? r ?? [];
        this.deals.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.crmService.getClients().subscribe({ next: (r: any) => this.clients.set(r?.data ?? r ?? []) });
    this.authService.getUsers().subscribe({ next: (r: any) => this.users.set(r?.data ?? r ?? []) });
  }

  openCreate(stage = 'Proposal') {
    this.form = { id: 0, clientId: 0, assignedUserId: null, amount: 0, status: stage };
    this.modalMode.set('create');
  }

  openEdit(deal: Deal) {
    this.form = {
      id: deal.id,
      clientId: deal.clientId,
      assignedUserId: deal.assignedUserId ?? null,
      amount: deal.amount,
      status: deal.status,
    };
    this.modalMode.set('edit');
  }

  closeModal() { this.modalMode.set(null); }

  save() {
    if (!this.form.clientId || !this.form.amount) return;
    this.isSaving.set(true);

    const payload = {
      clientId: this.form.clientId,
      assignedUserId: this.form.assignedUserId,
      amount: +this.form.amount,
      status: this.form.status,
    };

    if (this.modalMode() === 'create') {
      this.crmService.createDeal(payload).subscribe({
        next: (r: any) => {
          const d = r?.data ?? r;
          if (d?.id) this.deals.update(list => [...list, d]);
          this.isSaving.set(false);
          this.closeModal();
        },
        error: () => this.isSaving.set(false)
      });
    } else {
      this.crmService.updateDeal(this.form.id, payload).subscribe({
        next: (r: any) => {
          const d = r?.data ?? r;
          if (d?.id) this.deals.update(list => list.map(x => x.id === d.id ? d : x));
          this.isSaving.set(false);
          this.closeModal();
        },
        error: () => this.isSaving.set(false)
      });
    }
  }

  moveStage(deal: Deal, status: string) {
    this.crmService.updateDealStatus(deal.id, status).subscribe({
      next: () => this.deals.update(list => list.map(d => d.id === deal.id ? { ...d, status } : d))
    });
  }

  confirmDelete(id: number) { this.deleteTargetId.set(id); }
  cancelDelete() { this.deleteTargetId.set(null); }

  deleteDeal() {
    const id = this.deleteTargetId();
    if (!id) return;
    this.crmService.deleteDeal(id).subscribe({
      next: () => {
        this.deals.update(list => list.filter(d => d.id !== id));
        this.deleteTargetId.set(null);
      }
    });
  }

  stageColor(key: string): string {
    return STAGES.find(s => s.key === key)?.color ?? 'primary';
  }

  stageTotal(key: string): number {
    return (this.dealsByStage()[key] ?? []).reduce((s, d) => s + d.amount, 0);
  }

  formatAmount(v: number): string {
    return v.toLocaleString('ar-SA');
  }
}
