import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CrmService } from '../../../services/crm.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sales-manager-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './sales-manager-dashboard.html',
  styleUrl: './sales-manager-dashboard.css'
})
export class SalesManagerDashboard implements OnInit {
  private crmService = inject(CrmService);
  private authService = inject(AuthService);

  isLoading = signal(true);
  deals   = signal<any[]>([]);
  clients = signal<any[]>([]);
  users   = signal<any[]>([]);

  // ── Computed stats ────────────────────────────────────────────
  stats = computed(() => {
    const d = this.deals();
    const won       = d.filter(x => x.status === 'Won');
    const active    = d.filter(x => x.status !== 'Won' && x.status !== 'Lost');
    const closed    = d.filter(x => x.status === 'Won' || x.status === 'Lost');
    const winRate   = closed.length ? Math.round((won.length / closed.length) * 100) : 0;
    const wonRev    = won.reduce((s: number, x: any) => s + (x.amount ?? 0), 0);
    const activeRev = active.reduce((s: number, x: any) => s + (x.amount ?? 0), 0);
    return {
      wonRevenue: wonRev,
      activeDeals: active.length,
      activeRevenue: activeRev,
      winRate,
      totalClients: this.clients().length,
      totalDeals: d.length,
    };
  });

  // ── Pipeline by stage ─────────────────────────────────────────
  pipeline = computed(() => {
    const d = this.deals();
    const stages = [
      { key: 'Proposal',    label: 'عرض سعر',  color: 'primary' },
      { key: 'Negotiation', label: 'تفاوض',     color: 'warning' },
      { key: 'Won',         label: 'مكتملة',    color: 'success' },
      { key: 'Lost',        label: 'خسارة',     color: 'danger'  },
    ];
    return stages.map(s => ({
      ...s,
      count: d.filter(x => x.status === s.key).length,
      value: d.filter(x => x.status === s.key).reduce((t: number, x: any) => t + (x.amount ?? 0), 0),
    }));
  });

  // ── Team performance ──────────────────────────────────────────
  teamPerf = computed(() => {
    const salesUsers = this.users().filter((u: any) => u.roleId === 4 || u.roleId === 5);
    return salesUsers.map((u: any) => {
      const userDeals  = this.deals().filter(d => d.assignedUserId === u.id);
      const won        = userDeals.filter(d => d.status === 'Won');
      const active     = userDeals.filter(d => d.status !== 'Won' && d.status !== 'Lost');
      const revenue    = won.reduce((s: number, d: any) => s + (d.amount ?? 0), 0);
      const winRate    = userDeals.length ? Math.round((won.length / userDeals.length) * 100) : 0;
      return { id: u.id, name: u.fullName, initials: this.initials(u.fullName), activeDeals: active.length, wonDeals: won.length, revenue, winRate };
    }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);
  });

  // ── Recent deals ──────────────────────────────────────────────
  recentDeals = computed(() =>
    [...this.deals()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
  );

  // ── This month ────────────────────────────────────────────────
  thisMonth = computed(() => {
    const now = new Date();
    return this.deals().filter(d => {
      const dt = new Date(d.createdAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.isLoading.set(true);
    let done = 0;
    const tick = () => { if (++done === 3) this.isLoading.set(false); };

    this.crmService.getDeals().subscribe({
      next: (r: any) => { this.deals.set(r?.data ?? r ?? []); tick(); },
      error: () => tick()
    });
    this.crmService.getClients().subscribe({
      next: (r: any) => { this.clients.set(r?.data ?? r ?? []); tick(); },
      error: () => tick()
    });
    this.authService.getEmployees().subscribe({
      next: (r: any) => { this.users.set(r?.data ?? r ?? []); tick(); },
      error: () => tick()
    });
  }

  initials(name: string): string {
    return (name ?? '').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '؟';
  }

  fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toFixed(0);
  }

  stageClass(status: string): string {
    const m: Record<string, string> = { Proposal: 'badge-primary', Negotiation: 'badge-warning', Won: 'badge-success', Lost: 'badge-danger' };
    return m[status] ?? 'badge-secondary';
  }

  stageLabel(status: string): string {
    const m: Record<string, string> = { Proposal: 'عرض سعر', Negotiation: 'تفاوض', Won: 'مكتملة', Lost: 'خسارة' };
    return m[status] ?? status;
  }

  progressColor(r: number): string {
    if (r >= 70) return 'var(--success)';
    if (r >= 40) return 'var(--warning)';
    return 'var(--danger)';
  }

  pipelineMax(): number {
    return Math.max(...this.pipeline().map(p => p.count), 1);
  }
}
