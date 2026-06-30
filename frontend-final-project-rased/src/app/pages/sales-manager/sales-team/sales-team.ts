import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { CrmService } from '../../../services/crm.service';

interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  roleId: number;
  roleName: string;
  status: string;
  // computed from deals
  activeDeals: number;
  wonDeals: number;
  totalRevenue: number;
  winRate: number;
}

@Component({
  selector: 'app-sales-team',
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-team.html',
  styleUrl: './sales-team.css'
})
export class SalesTeam implements OnInit {
  private authService = inject(AuthService);
  private crmService = inject(CrmService);

  isLoading = signal(true);
  members = signal<TeamMember[]>([]);
  searchQuery = signal('');
  statusFilter = signal('all');

  stats = computed(() => {
    const all = this.members();
    const active = all.filter(m => m.status === 'Active');
    const totalRev = all.reduce((s, m) => s + m.totalRevenue, 0);
    const avgWin = all.length ? Math.round(all.reduce((s, m) => s + m.winRate, 0) / all.length) : 0;
    return { total: all.length, active: active.length, totalRevenue: totalRev, avgWinRate: avgWin };
  });

  filtered = computed(() => {
    let list = this.members();
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    if (q) list = list.filter(m => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    if (s !== 'all') list = list.filter(m => m.status === s);
    return list;
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.isLoading.set(true);
    let users: any[] = [];
    let deals: any[] = [];
    let done = 0;

    const tryBuild = () => {
      done++;
      if (done < 2) return;
      // Filter to sales roles: 4 = SalesManager, 5 = Sales
      const salesUsers = users.filter(u => u.roleId === 4 || u.roleId === 5);

      const members: TeamMember[] = salesUsers.map(u => {
        const userDeals = deals.filter(d => d.assignedUserId === u.id);
        const wonDeals  = userDeals.filter(d => d.status === 'Won');
        const activeDeals = userDeals.filter(d => d.status !== 'Won' && d.status !== 'Lost');
        const totalRevenue = wonDeals.reduce((s: number, d: any) => s + (d.amount ?? 0), 0);
        const winRate = userDeals.length > 0 ? Math.round((wonDeals.length / userDeals.length) * 100) : 0;
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          roleId: u.roleId,
          roleName: u.roleName,
          status: u.status ?? 'Active',
          activeDeals: activeDeals.length,
          wonDeals: wonDeals.length,
          totalRevenue,
          winRate
        };
      });

      this.members.set(members);
      this.isLoading.set(false);
    };

    this.authService.getEmployees().subscribe({
      next: (r: any) => { users = r?.data ?? r ?? []; tryBuild(); },
      error: () => { tryBuild(); }
    });

    this.crmService.getDeals().subscribe({
      next: (r: any) => { deals = r?.data ?? r ?? []; tryBuild(); },
      error: () => { tryBuild(); }
    });
  }

  initials(name: string): string {
    return (name ?? '').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '؟';
  }

  formatAmount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toFixed(0);
  }

  roleLabel(roleId: number): string {
    return roleId === 4 ? 'مدير مبيعات' : 'مندوب مبيعات';
  }

  progressColor(rate: number): string {
    if (rate >= 70) return 'var(--success)';
    if (rate >= 40) return 'var(--warning)';
    return 'var(--danger)';
  }

  exportCSV() {
    const headers = ['الاسم', 'البريد', 'الدور', 'الحالة', 'صفقات نشطة', 'صفقات مكتملة', 'الإيراد (ر.س)', 'نسبة الفوز %'];
    const rows = this.filtered().map(m => [
      m.fullName, m.email, this.roleLabel(m.roleId), m.status,
      m.activeDeals, m.wonDeals, m.totalRevenue.toFixed(0), m.winRate
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sales-team.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
