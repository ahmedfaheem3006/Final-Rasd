import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialReportsService } from '../../../services/financial-reports.service';
import { I18nService } from '../../../services/i18n.service';
import { ThemeService } from '../../../services/theme.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(FinancialReportsService);
  private http = inject(HttpClient);
  public i18n = inject(I18nService);
  private themeService = inject(ThemeService);

  get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
  }

  activeTab = signal<'revenue' | 'profitloss' | 'cashflow' | 'clientstatement'>('revenue');

  revenueLoading = signal(true);
  plLoading = signal(true);
  cashflowLoading = signal(true);
  statementLoading = signal(false);
  clientsLoading = signal(true);

  revenueData = signal<any>(null);
  profitLossData = signal<any>(null);
  cashFlowData = signal<any>(null);
  statementData = signal<any>(null);
  clients = signal<any[]>([]);
  selectedClientId = signal<number | null>(null);

  revenueFrom = signal('');
  revenueTo = signal('');
  plFrom = signal('');
  plTo = signal('');
  cfFrom = signal('');
  cfTo = signal('');

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadRevenue();
    this.loadProfitLoss();
    this.loadCashFlow();
    this.loadClients();
  }

  private setDefaultDates(): void {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    this.revenueFrom.set(fmt(startOfYear));
    this.revenueTo.set(fmt(now));
    this.plFrom.set(fmt(startOfYear));
    this.plTo.set(fmt(now));
    this.cfFrom.set(fmt(startOfYear));
    this.cfTo.set(fmt(now));
  }

  switchTab(tab: 'revenue' | 'profitloss' | 'cashflow' | 'clientstatement'): void {
    this.activeTab.set(tab);
    if (tab === 'clientstatement' && this.selectedClientId()) {
      this.loadClientStatement(this.selectedClientId()!);
    }
  }

  loadRevenue(): void {
    this.revenueLoading.set(true);
    this.reportsService.getRevenueReport(this.revenueFrom() || undefined, this.revenueTo() || undefined).subscribe({
      next: (res) => { this.revenueData.set(res?.data ?? res); this.revenueLoading.set(false); },
      error: () => { this.revenueData.set(null); this.revenueLoading.set(false); }
    });
  }

  loadProfitLoss(): void {
    this.plLoading.set(true);
    this.reportsService.getProfitLoss(this.plFrom() || undefined, this.plTo() || undefined).subscribe({
      next: (res) => { this.profitLossData.set(res?.data ?? res); this.plLoading.set(false); },
      error: () => { this.profitLossData.set(null); this.plLoading.set(false); }
    });
  }

  loadCashFlow(): void {
    this.cashflowLoading.set(true);
    this.reportsService.getCashFlow(this.cfFrom() || undefined, this.cfTo() || undefined).subscribe({
      next: (res) => { this.cashFlowData.set(res?.data ?? res); this.cashflowLoading.set(false); },
      error: () => { this.cashFlowData.set(null); this.cashflowLoading.set(false); }
    });
  }

  loadClientStatement(clientId: number): void {
    this.statementLoading.set(true);
    this.reportsService.getClientStatement(clientId).subscribe({
      next: (res) => { this.statementData.set(res?.data ?? res); this.statementLoading.set(false); },
      error: () => { this.statementData.set(null); this.statementLoading.set(false); }
    });
  }

  onClientSelect(clientId: string): void {
    const id = Number(clientId);
    this.selectedClientId.set(id);
    if (id) this.loadClientStatement(id);
    else this.statementData.set(null);
  }

  private loadClients(): void {
    this.http.get<any>('http://localhost:5292/api/Clients').subscribe({
      next: (res) => {
        this.clients.set(res?.data ?? []);
        this.clientsLoading.set(false);
      },
      error: () => {
        this.clients.set([]);
        this.clientsLoading.set(false);
      }
    });
  }

  formatCurrency(amount: number | undefined | null): string {
    const isAr = this.i18n.currentLang() === 'ar';
    const val = amount == null ? 0 : Number(amount);
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isAr ? 'ريال' : 'SAR'}`;
  }

  getMonthName(monthIndex: number): string {
    const months = [
      'month.jan', 'month.feb', 'month.mar', 'month.apr',
      'month.may', 'month.jun', 'month.jul', 'month.aug',
      'month.sep', 'month.oct', 'month.nov', 'month.dec'
    ];
    const key = months[monthIndex] || '';
    if (!key) return '';
    const t = this.i18n.t(key);
    return t !== key ? t : key;
  }

  outstandingPercent(invoiced: number, collected: number): string {
    if (!invoiced || invoiced === 0) return '0%';
    return ((invoiced - collected) / invoiced * 100).toFixed(1) + '%';
  }

  profitMarginClass(margin: number): string {
    return margin >= 0 ? 'positive' : 'negative';
  }

  isPositive(value: number): boolean {
    return value >= 0;
  }
}
