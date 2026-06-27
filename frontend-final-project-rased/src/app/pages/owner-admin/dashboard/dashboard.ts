import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { CrmService } from '../../../services/crm.service';
import { TaskService } from '../../../services/task.service';
import { InvoiceService } from '../../../services/invoice.service';
import { AuthService } from '../../../services/auth.service';
import { DashboardApiService, MonthlyData } from '../../../services/dashboard-api.service';
import { I18nService } from '../../../services/i18n.service';
import { ToastService } from '../../../services/toast.service';
import { LeaveRequestModal } from '../../../shared/leave-request-modal/leave-request-modal';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LeaveRequestModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  private crmService = inject(CrmService);
  private taskService = inject(TaskService);
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);
  private dashboardApi = inject(DashboardApiService);
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  showLeaveModal = signal(false);

  // Revenue chart signals
  chartMonths = signal<{label: string; sales: number; invoices: number}[]>([]);
  chartMaxVal = signal(0);
  salesPath = signal('');
  salesAreaPath = signal('');
  invoicesPath = signal('');
  chartPoints = signal<{cx: number; cySales: number; cyInvoices: number}[]>([]);
  growthPercentage = signal('0%');
  growthPositive = signal(true);
  chartEmpty = signal(true);

  // Stats signals
  stats = signal([
    { title: 'إجمالي المبيعات والصفقات', value: '$0', desc: 'مقارنة بالشهر الماضي', change: '0%', isPositive: true, color: 'primary' },
    { title: 'الفواتير المعلقة', value: '$0', desc: 'بانتظار السداد الفوري', change: '0%', isPositive: true, color: 'warning' },
    { title: 'نسبة الحضور اليومي', value: '0%', desc: 'متوسط حضور الموظفين', change: '0%', isPositive: true, color: 'success' },
    { title: 'المهام قيد الإنجاز', value: '0 / 0', desc: 'معدل إتمام 0%', change: '0%', isPositive: true, color: 'info' }
  ]);

  recentDeals = signal<any[]>([]);
  topEmployees = signal<any[]>([]);

  private pollingSubscription?: Subscription;

  ngOnInit() {
    this.loadRealDashboardData();
    this.pollingSubscription = interval(30000).subscribe(() => this.refreshDashboardStats());
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
  }

  private loadRealDashboardData() {
    this.refreshDashboardStats();
    this.loadDealsForTable();
    this.loadInvoiceStats();
    this.loadTasks();
    this.loadUsers();
  }

  private refreshDashboardStats() {
    this.dashboardApi.getStats().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const d = res.data;
          this.updateStatValue('primary', `$${Number(d.totalSales).toLocaleString()}`);
          this.updateStatValue('الفواتير المعلقة', `$${Number(d.outstandingInvoices).toLocaleString()}`);
          this.buildChartFromBackend(d.salesByMonth, d.invoicesByMonth, d.growthPercentage);
        }
      },
      error: (err) => console.error('Dashboard stats fetch failed', err)
    });
  }

  private loadDealsForTable() {
    this.crmService.getDeals().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const apiDeals = res.data;
          // Map to recentDeals signal
          const mappedDeals = apiDeals.slice(0, 4).map((d: any) => ({
            client: d.clientName || d.client?.name || this.i18n.t('dashboard.unknown_client'),
            amount: `$${Number(d.amount).toLocaleString()}`,
            stage: this.mapDealStatus(d.status),
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : this.i18n.t('dashboard.recently'),
            status: d.status?.toLowerCase() === 'won' ? 'completed' : d.status?.toLowerCase() === 'lost' ? 'failed' : 'active'
          }));
          this.recentDeals.set(mappedDeals);

          // Update Sales Stat
          const totalWon = apiDeals
            .filter((d: any) => d.status?.toLowerCase() === 'won')
            .reduce((sum: number, d: any) => sum + d.amount, 0);

          this.updateStatValue('primary', `$${totalWon.toLocaleString()}`);
        }
      },
      error: (err) => console.error('Dashboard Deals fetch failed', err)
    });
  }

  private loadInvoiceStats() {
    this.invoiceService.getInvoices().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const apiInvoices = res.data;
          const unpaidTotal = apiInvoices
            .filter((inv: any) => inv.status?.toLowerCase() === 'unpaid')
            .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

          this.updateStatValue('warning', `$${unpaidTotal.toLocaleString()}`);
        }
      },
      error: (err) => console.error('Dashboard Invoices fetch failed', err)
    });
  }

  // 3. Fetch Tasks
  private loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const apiTasks = res.data;
          const total = apiTasks.length;
          const completed = apiTasks.filter((t: any) => t.status?.toLowerCase() === 'done' || t.status === 'مكتمل').length;
          const rate = total > 0 ? Math.round((completed / total) * 100) : 100;
          const desc = this.i18n.currentLang() === 'ar' ? `معدل إتمام ${rate}%` : `${rate}% Completion Rate`;
          this.updateStatValue('info', `${completed} / ${total}`, desc);
        }
      },
      error: (err) => console.error('Dashboard Tasks fetch failed', err)
    });
  }

  private loadUsers() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const apiUsers = res.data;
          const mappedUsers = apiUsers.slice(0, 3).map((u: any) => ({
            name: u.fullName,
            role: this.translateRole(u.roleName),
            progress: 100,
            target: this.i18n.t('dashboard.full_target'),
            sales: this.i18n.t('dashboard.sales_active_status'),
            avatar: this.getInitials(u.fullName)
          }));
          this.topEmployees.set(mappedUsers);
        }
      },
      error: (err) => console.error('Dashboard Users fetch failed', err)
    });
  }

  private buildChartFromBackend(salesByMonth: MonthlyData[], invoicesByMonth: MonthlyData[], backendGrowth: number) {
    const now = new Date();
    const months: { label: string; sales: number; invoices: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const sale = salesByMonth.find(s => s.year === d.getFullYear() && s.month === d.getMonth() + 1);
      const invoice = invoicesByMonth.find(s => s.year === d.getFullYear() && s.month === d.getMonth() + 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        sales: sale?.total || 0,
        invoices: invoice?.total || 0
      });
    }

    const allZero = months.every(m => m.sales === 0 && m.invoices === 0);
    this.chartEmpty.set(allZero);

    if (!allZero) {
      const maxVal = Math.max(...months.map(m => Math.max(m.sales, m.invoices)), 1);
      const chartH = 160;
      const N = months.length;
      const step = N > 1 ? 700 / (N - 1) : 0;

      const points = months.map((m, i) => ({
        cx: 50 + i * step,
        cySales: 210 - (m.sales / maxVal * chartH),
        cyInvoices: 210 - (m.invoices / maxVal * chartH)
      }));

      const sp = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx} ${p.cySales}`).join(' ');
      this.salesPath.set(sp);
      this.salesAreaPath.set(`${sp} L${points[points.length - 1].cx} 210 L${points[0].cx} 210 Z`);
      this.invoicesPath.set(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx} ${p.cyInvoices}`).join(' '));
      this.chartPoints.set(points);
      this.chartMaxVal.set(maxVal);

      this.growthPercentage.set(`${backendGrowth >= 0 ? '+' : ''}${backendGrowth.toFixed(1)}%`);
      this.growthPositive.set(backendGrowth >= 0);
    }

    this.chartMonths.set(months);
  }

  private translateRole(roleName: string): string {
    const key = 'dashboard.role.' + roleName?.toLowerCase();
    const translated = this.i18n.t(key);
    if (translated === key) {
      return roleName || this.i18n.t('dashboard.role.default');
    }
    return translated;
  }

  private getInitials(name: string): string {
    if (!name) return this.i18n.currentLang() === 'ar' ? 'م' : '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return name[0] || (this.i18n.currentLang() === 'ar' ? 'م' : '?');
  }

  private updateStatValue(color: string, value: string, desc?: string) {
    this.stats.update(prev => prev.map(s => {
      if (s.color === color) {
        return { ...s, value, desc: desc || s.desc };
      }
      return s;
    }));
  }

  private mapDealStatus(status: string): string {
    switch (status?.toLowerCase()) {
      case 'won': return this.i18n.currentLang() === 'ar' ? 'تم الإغلاق بنجاح' : 'Won';
      case 'lost': return this.i18n.currentLang() === 'ar' ? 'خسارة الصفقة' : 'Lost';
      case 'negotiation': return this.i18n.currentLang() === 'ar' ? 'تفاوض نهائي' : 'Negotiation';
      case 'proposal': return this.i18n.currentLang() === 'ar' ? 'تقديم العرض' : 'Proposal';
      default: return this.i18n.currentLang() === 'ar' ? 'قيد الدراسة' : 'In Study';
    }
  }

  getArabicMonth(shortName: string): string {
    const map: Record<string, string> = {
      'Jan': 'يناير', 'Feb': 'فبراير', 'Mar': 'مارس', 'Apr': 'إبريل',
      'May': 'مايو', 'Jun': 'يونيو', 'Jul': 'يوليو', 'Aug': 'أغسطس',
      'Sep': 'سبتمبر', 'Oct': 'أكتوبر', 'Nov': 'نوفمبر', 'Dec': 'ديسمبر'
    };
    return map[shortName] || shortName;
  }

  onFilterDates() {
    this.toastService.info(
      this.i18n.currentLang() === 'ar' ? 'تم تطبيق فلتر التواريخ بنجاح' : 'Dates filter applied successfully',
      this.i18n.currentLang() === 'ar' ? 'تصفية التواريخ' : 'Filter Dates'
    );
  }

  onExport() {
    const isAr = this.i18n.currentLang() === 'ar';
    const statsData = this.stats();
    const dealsData = this.recentDeals();
    const employeesData = this.topEmployees();
    const now = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const statTitleForExport = (s: typeof statsData[0]): string => {
      const map: Record<string, string> = {
        primary: this.i18n.t('dashboard.total_sales'),
        warning: this.i18n.t('sidebar.invoices'),
        success: this.i18n.t('sidebar.attendance_monitor'),
        info: this.i18n.t('sidebar.tasks')
      };
      return map[s.color] || s.title;
    };
    const statDescForExport = (s: typeof statsData[0]): string => {
      const map: Record<string, string> = {
        primary: this.i18n.t('dashboard.since_last_month'),
        warning: this.i18n.t('dashboard.stat.desc.awaiting_payment'),
        success: this.i18n.t('dashboard.stat.desc.avg_attendance'),
      };
      return map[s.color] || s.desc;
    };
    const statRows = statsData.map(s => `
      <div class="pdf-stat-card">
        <div class="pdf-stat-title">${statTitleForExport(s)}</div>
        <div class="pdf-stat-value">${s.value}</div>
        <div class="pdf-stat-change ${s.isPositive ? 'positive' : 'negative'}">${s.change}</div>
        <div class="pdf-stat-desc">${statDescForExport(s)}</div>
      </div>
    `).join('');

    const dealRows = dealsData.map(d => `
      <tr>
        <td>${d.client}</td>
        <td>${d.amount}</td>
        <td>${d.stage}</td>
        <td>${d.date}</td>
        <td class="status-${d.status}">${d.status === 'completed' ? (isAr ? 'مكتملة' : 'Won') :
        d.status === 'failed' ? (isAr ? 'خسارة' : 'Lost') :
          (isAr ? 'نشطة' : 'Active')
      }</td>
      </tr>
    `).join('');

    const empRows = employeesData.map(e => `
      <tr>
        <td>${e.name}</td>
        <td>${e.role}</td>
        <td>${e.progress}%</td>
        <td>${e.sales}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
<head>
  <meta charset="UTF-8">
  <title>${isAr ? 'تقرير لوحة التحكم' : 'Dashboard Report'} - RASD AI</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', Arial, sans-serif; background: #fff; color: #1b2559; font-size: 13px; padding: 0; }
    
    .pdf-header { background: linear-gradient(135deg, #4318ff 0%, #868cff 100%); color: white; padding: 36px 40px; display: flex; justify-content: space-between; align-items: center; }
    .pdf-logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .pdf-logo span { opacity: 0.7; font-weight: 400; font-size: 14px; display: block; margin-top: 4px; }
    .pdf-meta { text-align: ${isAr ? 'left' : 'right'}; opacity: 0.9; font-size: 12px; line-height: 1.8; }
    
    .pdf-body { padding: 32px 40px; }
    
    .section-title { font-size: 15px; font-weight: 700; color: #1b2559; margin: 28px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #4318ff; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; display: inline-block; width: 4px; height: 18px; background: #4318ff; border-radius: 2px; }
    
    .pdf-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 8px; }
    .pdf-stat-card { background: #f8f9ff; border: 1px solid #e8edff; border-radius: 12px; padding: 18px 16px; }
    .pdf-stat-title { font-size: 11px; font-weight: 600; color: #718096; margin-bottom: 8px; }
    .pdf-stat-value { font-size: 22px; font-weight: 800; color: #1b2559; margin-bottom: 6px; }
    .pdf-stat-change { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; display: inline-block; margin-bottom: 4px; }
    .pdf-stat-change.positive { background: #e6faf2; color: #01b574; }
    .pdf-stat-change.negative { background: #fdecea; color: #e31a1a; }
    .pdf-stat-desc { font-size: 10px; color: #a0aec0; }
    
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #4318ff; color: white; }
    thead th { padding: 10px 14px; font-weight: 600; text-align: ${isAr ? 'right' : 'left'}; }
    tbody tr { border-bottom: 1px solid #f0f2f5; }
    tbody tr:nth-child(even) { background: #f8f9ff; }
    tbody td { padding: 10px 14px; color: #4a5568; }
    tbody td:first-child { font-weight: 700; color: #1b2559; }
    .status-completed { color: #01b574; font-weight: 700; }
    .status-failed { color: #e31a1a; font-weight: 700; }
    .status-active { color: #4318ff; font-weight: 700; }
    
    .pdf-footer { background: #f8f9ff; border-top: 1px solid #e8edff; padding: 18px 40px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #a0aec0; margin-top: 40px; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .pdf-header { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div class="pdf-logo">
      RASD AI
      <span>${isAr ? 'نظام إدارة الأعمال الذكي' : 'Smart Business Management System'}</span>
    </div>
    <div class="pdf-meta">
      <div><strong>${isAr ? 'تقرير لوحة التحكم' : 'Dashboard Report'}</strong></div>
      <div>${isAr ? 'تاريخ الإصدار:' : 'Generated:'} ${now}</div>
      <div>${isAr ? 'النظام: راصد للذكاء الاصطناعي' : 'System: RASD AI Platform'}</div>
    </div>
  </div>
  
  <div class="pdf-body">
    <div class="section-title">${isAr ? 'ملخص الأداء' : 'Performance Summary'}</div>
    <div class="pdf-stats-grid">${statRows}</div>
    
    <div class="section-title">${isAr ? 'أحدث الصفقات' : 'Recent Deals'}</div>
    <table>
      <thead><tr>
        <th>${isAr ? 'العميل' : 'Client'}</th>
        <th>${isAr ? 'المبلغ' : 'Amount'}</th>
        <th>${isAr ? 'المرحلة' : 'Stage'}</th>
        <th>${isAr ? 'التاريخ' : 'Date'}</th>
        <th>${isAr ? 'الحالة' : 'Status'}</th>
      </tr></thead>
      <tbody>${dealRows || `<tr><td colspan="5" style="text-align:center;color:#a0aec0;padding:20px">${isAr ? 'لا توجد بيانات' : 'No data available'}</td></tr>`}</tbody>
    </table>
    
    <div class="section-title">${isAr ? 'أبرز الموظفين' : 'Top Employees'}</div>
    <table>
      <thead><tr>
        <th>${isAr ? 'الاسم' : 'Name'}</th>
        <th>${isAr ? 'الدور الوظيفي' : 'Role'}</th>
        <th>${isAr ? 'نسبة الإنجاز' : 'Progress'}</th>
        <th>${isAr ? 'حالة المبيعات' : 'Sales Status'}</th>
      </tr></thead>
      <tbody>${empRows || `<tr><td colspan="4" style="text-align:center;color:#a0aec0;padding:20px">${isAr ? 'لا توجد بيانات' : 'No data available'}</td></tr>`}</tbody>
    </table>
  </div>
  
  <div class="pdf-footer">
    <span>RASD AI © ${new Date().getFullYear()}</span>
    <span>${isAr ? 'هذا التقرير سري ومخصص للاستخدام الداخلي فقط' : 'This report is confidential and for internal use only'}</span>
    <span>${isAr ? 'صفحة 1 من 1' : 'Page 1 of 1'}</span>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    if (!printWindow) {
      this.toastService.warning(
        isAr ? 'يرجى السماح بالنوافذ المنبثقة لتصدير PDF' : 'Please allow popups to export PDF',
        isAr ? 'تحذير' : 'Warning'
      );
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      this.toastService.success(
        isAr ? 'تم فتح نافذة تصدير PDF بنجاح' : 'PDF export window opened successfully',
        isAr ? 'تصدير PDF' : 'PDF Export'
      );
    }, 600);
  }

  onCreateInvoice() {
    this.toastService.info(
      this.i18n.currentLang() === 'ar' ? 'جاري الانتقال لإصدار فاتورة جديدة...' : 'Navigating to invoice creation...',
      this.i18n.currentLang() === 'ar' ? 'الفواتير' : 'Invoices'
    );
    this.router.navigate(['/app/accountant/invoices']);
  }

  onScheduleMeeting() {
    this.toastService.info(
      this.i18n.currentLang() === 'ar' ? 'جاري الانتقال لجدولة اجتماع جديد...' : 'Navigating to team meeting scheduling...',
      this.i18n.currentLang() === 'ar' ? 'الاجتماعات' : 'Meetings'
    );
    this.router.navigate(['/app/owner/meetings']);
  }

  onRequestLeave() {
    this.showLeaveModal.set(true);
  }

  onLeaveCreated() {
    this.showLeaveModal.set(false);
  }

  onViewReports() {
    this.toastService.info(
      this.i18n.currentLang() === 'ar' ? 'جاري الانتقال لصفحة التقارير والتحليلات...' : 'Navigating to reports page...',
      this.i18n.currentLang() === 'ar' ? 'التقارير' : 'Reports'
    );
    this.router.navigate(['/app/owner/reports']);
  }
}
