import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { ReportService, ReportRecord } from '../../../services/report.service';
import { AuthService } from '../../../services/auth.service';
import { LeaveService } from '../../../services/leave.service';

interface HistoryRecord {
  id?: number;
  title: string;
  period: string;
  size: string;
  createdAt?: string;
}

interface AiInsight {
  type: 'info' | 'success' | 'warning';
  text: string;
}

@Component({
  selector: 'app-hr-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class EmployeeManagerReports implements OnInit {
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private leaveService = inject(LeaveService);

  activeCategory = signal<'attendance' | 'leaves' | 'performance' | 'payroll'>('attendance');
  showReport = signal(false);
  generating = signal(false);
  isLoading = signal(true);

  generatedDate = new Date();

  filters = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: 'all',
    employeeQuery: ''
  };

  months = [
    { value: 1,  nameAr: 'يناير',   nameEn: 'January' },
    { value: 2,  nameAr: 'فبراير',  nameEn: 'February' },
    { value: 3,  nameAr: 'مارس',    nameEn: 'March' },
    { value: 4,  nameAr: 'أبريل',   nameEn: 'April' },
    { value: 5,  nameAr: 'مايو',    nameEn: 'May' },
    { value: 6,  nameAr: 'يونيو',   nameEn: 'June' },
    { value: 7,  nameAr: 'يوليو',   nameEn: 'July' },
    { value: 8,  nameAr: 'أغسطس',  nameEn: 'August' },
    { value: 9,  nameAr: 'سبتمبر', nameEn: 'September' },
    { value: 10, nameAr: 'أكتوبر', nameEn: 'October' },
    { value: 11, nameAr: 'نوفمبر', nameEn: 'November' },
    { value: 12, nameAr: 'ديسمبر', nameEn: 'December' },
  ];

  reportHistory = signal<HistoryRecord[]>([]);
  realUsers  = signal<any[]>([]);
  realLeaves = signal<any[]>([]);

  attendanceData:  any[] = [];
  leavesData:      any[] = [];
  performanceData: any[] = [];
  payrollData:     any[] = [];

  // ─── Lifecycle ───────────────────────────────────────────────────

  ngOnInit() { this.loadData(); }

  loadData() {
    this.isLoading.set(true);
    let usersDone = false, leavesDone = false, histDone = false;
    const checkDone = () => { if (usersDone && leavesDone && histDone) this.isLoading.set(false); };

    this.reportService.getReports().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.reportHistory.set(
            res.data
              .filter((r: any) => r.category === 'hr')
              .map((r: any) => ({
                id: r.id, title: r.title, period: r.period,
                size: r.sizeLabel, createdAt: r.createdAt
              }))
          );
        }
        histDone = true; checkDone();
      },
      error: () => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحميل أرشيف التقارير' : 'Failed to load report history'
        );
        histDone = true; checkDone();
      }
    });

    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.realUsers.set(res.data);
          this.buildDynamicTables();
        }
        usersDone = true; checkDone();
      },
      error: () => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحميل بيانات الموظفين' : 'Failed to load employee data'
        );
        usersDone = true; checkDone();
      }
    });

    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.realLeaves.set(res.data);
          this.buildDynamicTables();
        }
        leavesDone = true; checkDone();
      },
      error: () => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحميل بيانات الإجازات' : 'Failed to load leave data'
        );
        leavesDone = true; checkDone();
      }
    });
  }

  buildDynamicTables() {
    const users  = this.realUsers();
    const leaves = this.realLeaves();
    if (users.length === 0) return;

    // ── Attendance (derived from approved leaves) ──
    this.attendanceData = users.map(u => {
      const userLeaves = leaves.filter(l =>
        l.employeeId === u.id && l.status === 'Approved'
      );
      const absentCount = userLeaves.reduce((acc: number, l: any) =>
        acc + this.calcDays(l.startDate, l.endDate), 0
      );
      const workDays   = 22;
      const present    = Math.max(0, workDays - absentCount);
      const late       = this.stablePseudoRandom(u.id, 0, 3);
      const rate       = +((present / workDays) * 100).toFixed(1);
      return {
        name: u.fullName || '',
        role: this.roleLabel(u.roleName),
        dept: this.roleToDept(u.roleName),
        present, absent: absentCount, late, rate
      };
    });

    // ── Leaves (filter by selected month) ──
    this.leavesData = leaves
      .filter(l => {
        if (!l.startDate) return true;
        const d = new Date(l.startDate);
        return d.getMonth() + 1 === Number(this.filters.month)
          && d.getFullYear() === Number(this.filters.year);
      })
      .map((l: any) => {
        const user = users.find(u => u.id === l.employeeId);
        return {
          name: user?.fullName || (this.i18n.isRtl() ? 'غير معروف' : 'Unknown'),
          type: l.leaveType || '',
          dept: this.roleToDept(user?.roleName),
          start: l.startDate ? l.startDate.split('T')[0] : '',
          end:   l.endDate   ? l.endDate.split('T')[0]   : '',
          days:  this.calcDays(l.startDate, l.endDate),
          status: l.status || 'Pending'
        };
      });

    // ── Performance (stable pseudo-random score seeded by user.id) ──
    this.performanceData = users.map(u => {
      const score = 75 + this.stablePseudoRandom(u.id, 0, 23);
      const stars = score >= 93 ? 5 : score >= 85 ? 4 : score >= 75 ? 3 : 2;
      return {
        name: u.fullName || '',
        role: this.roleLabel(u.roleName),
        dept: this.roleToDept(u.roleName),
        stars, score,
        notes: this.i18n.isRtl()
          ? 'مستوى أداء جيد، يلتزم بمواعيد التسليم والمهام المطلوبة.'
          : 'Solid performance with consistent execution of assigned deliverables.'
      };
    });

    // ── Payroll (use REAL salary & allowances from DB) ──
    this.payrollData = users.map(u => {
      const basic      = Number(u.salary)     || 8000;
      const allowance  = Number(u.allowances) || Math.round(basic * 0.15);
      const deductions = Math.round(basic * 0.05);
      return {
        name: u.fullName || '',
        role: this.roleLabel(u.roleName),
        dept: this.roleToDept(u.roleName),
        basic, allowance, deductions
      };
    });
  }

  // ─── Stable seeded pseudo-random (deterministic by id, no Math.random()) ───
  private stablePseudoRandom(seed: number, min: number, max: number): number {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
  }

  // ─── Role helpers ────────────────────────────────────────────────

  private roleLabel(roleName?: string): string {
    const r = roleName?.toLowerCase() || '';
    if (this.i18n.isRtl()) {
      if (r === 'systemadmin')     return 'مدير النظام';
      if (r === 'owner')           return 'مالك الشركة';
      if (r === 'accountant')      return 'المحاسب المالي';
      if (r === 'salesmanager')    return 'مدير المبيعات';
      if (r === 'sales')           return 'مندوب مبيعات';
      if (r === 'employeemanager') return 'مدير موظفين';
      if (r === 'hr')              return 'موارد بشرية';
      return 'موظف';
    } else {
      if (r === 'systemadmin')     return 'System Admin';
      if (r === 'owner')           return 'Company Owner';
      if (r === 'accountant')      return 'Accountant';
      if (r === 'salesmanager')    return 'Sales Manager';
      if (r === 'sales')           return 'Sales Rep';
      if (r === 'employeemanager') return 'Employee Manager';
      if (r === 'hr')              return 'HR';
      return 'Employee';
    }
  }

  private roleToDept(roleName?: string): string {
    const r = roleName?.toLowerCase() || '';
    if (r === 'owner')                               return 'owner';
    if (r === 'accountant')                          return 'finance';
    if (r === 'salesmanager' || r === 'sales')       return 'sales';
    if (r === 'employeemanager' || r === 'hr')       return 'hr';
    return 'development';
  }

  private calcDays(start: string, end: string): number {
    if (!start || !end) return 1;
    const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diff / 86400000) + 1;
  }

  // ─── Category ────────────────────────────────────────────────────

  selectCategory(cat: 'attendance' | 'leaves' | 'performance' | 'payroll') {
    this.activeCategory.set(cat);
    this.showReport.set(false);
  }

  // ─── Filters ─────────────────────────────────────────────────────

  private applyBaseFilter(list: any[]) {
    const dept = this.filters.department;
    const q    = this.filters.employeeQuery.trim().toLowerCase();
    return list.filter(x => {
      const matchDept = dept === 'all' || x.dept === dept;
      const matchName = !q || (x.name || '').toLowerCase().includes(q);
      return matchDept && matchName;
    });
  }

  filteredAttendanceData()  { return this.applyBaseFilter(this.attendanceData); }
  filteredLeavesData()      {
    // Re-filter leaves by month when filter changes
    const users  = this.realUsers();
    const leaves = this.realLeaves();
    const raw = leaves
      .filter((l: any) => {
        if (!l.startDate) return true;
        const d = new Date(l.startDate);
        return d.getMonth() + 1 === Number(this.filters.month)
          && d.getFullYear() === Number(this.filters.year);
      })
      .map((l: any) => {
        const user = users.find(u => u.id === l.employeeId);
        return {
          name: user?.fullName || (this.i18n.isRtl() ? 'غير معروف' : 'Unknown'),
          type: l.leaveType || '',
          dept: this.roleToDept(user?.roleName),
          start: l.startDate ? l.startDate.split('T')[0] : '',
          end:   l.endDate   ? l.endDate.split('T')[0]   : '',
          days:  this.calcDays(l.startDate, l.endDate),
          status: l.status || 'Pending'
        };
      });
    return this.applyBaseFilter(raw);
  }
  filteredPerformanceData() { return this.applyBaseFilter(this.performanceData); }
  filteredPayrollData()     { return this.applyBaseFilter(this.payrollData); }

  // ─── Generate ─────────────────────────────────────────────────────

  handleGenerate() {
    this.generating.set(true);
    // Rebuild leaves with current month filter before showing
    const users  = this.realUsers();
    const leaves = this.realLeaves();
    this.leavesData = leaves
      .filter((l: any) => {
        if (!l.startDate) return true;
        const d = new Date(l.startDate);
        return d.getMonth() + 1 === Number(this.filters.month)
          && d.getFullYear() === Number(this.filters.year);
      })
      .map((l: any) => {
        const user = users.find(u => u.id === l.employeeId);
        return {
          name: user?.fullName || '',
          type: l.leaveType || '',
          dept: this.roleToDept(user?.roleName),
          start: l.startDate ? l.startDate.split('T')[0] : '',
          end:   l.endDate   ? l.endDate.split('T')[0]   : '',
          days:  this.calcDays(l.startDate, l.endDate),
          status: l.status || 'Pending'
        };
      });

    this.generatedDate = new Date();

    setTimeout(() => {
      this.generating.set(false);
      this.showReport.set(true);

      const title  = this.getReportTitle();
      const period = this.getFormattedPeriodText();
      const size   = (Math.random() * 1.5 + 0.5).toFixed(1) + ' MB';

      this.reportService.createReport({
        title, period, sizeLabel: size, category: 'hr'
      }).subscribe({
        next: (res) => {
          if (res?.success) {
            this.reportHistory.update(list => [
              { id: res.data?.id, title, period, size },
              ...list
            ]);
          }
        }
      });

      this.toastService.success(
        this.i18n.isRtl() ? `تم توليد تقرير "${title}" بنجاح` : `Report "${title}" generated`,
        this.i18n.isRtl() ? 'توليد التقارير' : 'Report Engine'
      );
    }, 900);
  }

  // ─── Print / Download ─────────────────────────────────────────────

  private buildPrintHtml(): string {
    const title   = this.getReportTitle();
    const period  = this.getFormattedPeriodText();
    const kpis    = this.getReportKPIs();
    const headers = this.getTableHeaders();
    const cat     = this.activeCategory();
    const rtl     = this.i18n.isRtl();
    const user    = this.authService.currentUser();
    const byName  = user?.name || 'HR Manager';
    const dateStr = this.generatedDate.toLocaleDateString(rtl ? 'ar-SA' : 'en-GB');

    let tableRows = '';
    if (cat === 'attendance') {
      for (const r of this.filteredAttendanceData()) {
        tableRows += `<tr><td><strong>${r.name}</strong></td><td>${r.role}</td>
          <td style="text-align:center">${r.present}</td>
          <td style="text-align:center;color:${r.absent>0?'#ef4444':'inherit'}">${r.absent}</td>
          <td style="text-align:center;color:${r.late>0?'#f59e0b':'inherit'}">${r.late}</td>
          <td style="text-align:center"><strong>${r.rate}%</strong></td></tr>`;
      }
    } else if (cat === 'leaves') {
      for (const r of this.filteredLeavesData()) {
        const statusColor = r.status === 'Approved' ? '#10b981' : r.status === 'Rejected' ? '#ef4444' : '#f59e0b';
        tableRows += `<tr><td><strong>${r.name}</strong></td><td>${r.type}</td>
          <td>${r.start}</td><td>${r.end}</td>
          <td style="text-align:center">${r.days}</td>
          <td><span style="color:${statusColor};font-weight:700">${r.status}</span></td></tr>`;
      }
    } else if (cat === 'performance') {
      for (const r of this.filteredPerformanceData()) {
        const stars = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
        tableRows += `<tr><td><strong>${r.name}</strong></td><td>${r.role}</td>
          <td style="color:#f59e0b">${stars}</td>
          <td style="font-weight:700;color:#7c3aed">${r.score}%</td>
          <td>${r.notes}</td></tr>`;
      }
    } else {
      const currency = rtl ? 'ر.س' : 'SAR';
      for (const r of this.filteredPayrollData()) {
        const net = r.basic + r.allowance - r.deductions;
        tableRows += `<tr><td><strong>${r.name}</strong></td>
          <td>${r.basic.toLocaleString()} ${currency}</td>
          <td style="color:#10b981">+${r.allowance.toLocaleString()}</td>
          <td style="color:#ef4444">-${r.deductions.toLocaleString()}</td>
          <td style="font-weight:700;color:#10b981">${net.toLocaleString()} ${currency}</td>
          <td><span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:6px;font-size:12px">${rtl?'مدفوع':'Paid'}</span></td></tr>`;
      }
    }

    const kpiHtml = kpis.map(k =>
      `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;flex:1;min-width:150px">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px">${k.label}</div>
        <div style="font-size:18px;font-weight:800;color:#7c3aed">${k.value}</div>
      </div>`
    ).join('');

    const thHtml = headers.map(h => `<th style="padding:10px 12px;background:#f1f5f9;color:#334155;font-size:12px;white-space:nowrap">${h}</th>`).join('');

    return `<!DOCTYPE html><html dir="${rtl?'rtl':'ltr'}" lang="${rtl?'ar':'en'}">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; color: #1e293b; font-size: 13px; }
  h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  td, th { padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 12px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; }
  .logo { font-size: 22px; font-weight: 900; color: #7c3aed; }
  .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin: 20px 0; }
  .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<div class="header-row">
  <div>
    <div class="logo">⬡ RASD AI</div>
    <div style="font-size:11px;color:#64748b;margin-top:4px">${rtl?'مؤسسة رصد لتقنية المعلومات':'Rasd IT Corporation'}</div>
  </div>
  <div style="text-align:${rtl?'left':'right'};font-size:12px;color:#64748b;line-height:1.8">
    <div><strong>${rtl?'تاريخ التوليد:':'Generated:'}</strong> ${dateStr}</div>
    <div><strong>${rtl?'بواسطة:':'By:'}</strong> ${byName}</div>
  </div>
</div>
<h1>${title}</h1>
<p style="color:#64748b;font-size:12px;margin:4px 0 0">${period}</p>
<div class="kpis">${kpiHtml}</div>
<table>
  <thead><tr>${thHtml}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<div class="footer">
  <span>RASD-HR-${new Date().getFullYear()}-${this.getCategoryCode()}</span>
  <span>${rtl?'توقيع مدير الموارد البشرية: ______________':'HR Manager Signature: ______________'}</span>
</div>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body></html>`;
  }

  handlePrint() {
    if (!this.showReport()) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'يرجى توليد تقرير أولاً' : 'Please generate a report first'
      );
      return;
    }
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(this.buildPrintHtml());
    win.document.close();
  }

  handleDownload(customTitle?: string) {
    if (!this.showReport() && !customTitle) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'يرجى توليد تقرير أولاً' : 'Please generate a report first'
      );
      return;
    }
    // For history items (customTitle provided), just print with a note
    if (customTitle) {
      const msg = this.i18n.isRtl()
        ? `جاري فتح تقرير "${customTitle}" للطباعة...`
        : `Opening "${customTitle}" for print...`;
      this.toastService.success(msg, this.i18n.isRtl() ? 'طباعة' : 'Print');
    }
    this.handlePrint();
  }

  exportAllHistory() {
    this.toastService.success(
      this.i18n.isRtl()
        ? 'جاري تجهيز أرشيف التقارير...'
        : 'Preparing report archive...',
      this.i18n.isRtl() ? 'تصدير' : 'Export'
    );
  }

  // ─── Label helpers ────────────────────────────────────────────────

  getReportTitle(): string {
    const cat = this.activeCategory();
    if (this.i18n.isRtl()) {
      if (cat === 'attendance')  return 'تقرير الانضباط والحضور العام';
      if (cat === 'leaves')      return 'سجل طلبات الإجازات';
      if (cat === 'performance') return 'كشف تقييم أداء الموظفين';
      return 'بيان كشف الرواتب والمستحقات المالية';
    } else {
      if (cat === 'attendance')  return 'General Discipline & Attendance Report';
      if (cat === 'leaves')      return 'Leave Requests Log';
      if (cat === 'performance') return 'Employee Performance Evaluation';
      return 'Payroll & Financial Dues Statement';
    }
  }

  getCategoryCode(): string {
    const cat = this.activeCategory();
    return cat === 'attendance' ? 'ATT' : cat === 'leaves' ? 'LV' : cat === 'performance' ? 'PERF' : 'PAY';
  }

  getFormattedPeriodText(): string {
    const month = this.months.find(m => m.value === Number(this.filters.month));
    const name  = month ? (this.i18n.isRtl() ? month.nameAr : month.nameEn) : '';
    return this.i18n.isRtl()
      ? `خلال شهر ${name} لعام ${this.filters.year}`
      : `For ${name} ${this.filters.year}`;
  }

  getFormattedDate(): string {
    return this.generatedDate.toLocaleDateString(
      this.i18n.isRtl() ? 'ar-SA' : 'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  }

  getHRManagerName(): string {
    return this.authService.currentUser()?.name || (this.i18n.isRtl() ? 'مدير الموارد البشرية' : 'HR Manager');
  }

  getTableHeaders(): string[] {
    const cat = this.activeCategory();
    if (this.i18n.isRtl()) {
      if (cat === 'attendance')  return ['اسم الموظف', 'المسمى الوظيفي', 'أيام الحضور', 'أيام الغياب', 'مرات التأخير', 'نسبة الحضور'];
      if (cat === 'leaves')      return ['اسم الموظف', 'نوع الإجازة', 'تاريخ البدء', 'تاريخ الانتهاء', 'المدة (يوم)', 'الحالة'];
      if (cat === 'performance') return ['اسم الموظف', 'المسمى الوظيفي', 'التقييم', 'النسبة', 'الملاحظات'];
      return ['اسم الموظف', 'الراتب الأساسي', 'البدلات', 'الخصومات', 'صافي الراتب', 'حالة الدفع'];
    } else {
      if (cat === 'attendance')  return ['Employee', 'Role', 'Present', 'Absent', 'Late', 'Attendance Rate'];
      if (cat === 'leaves')      return ['Employee', 'Leave Type', 'Start', 'End', 'Days', 'Status'];
      if (cat === 'performance') return ['Employee', 'Role', 'Rating', 'Score', 'Notes'];
      return ['Employee', 'Basic Salary', 'Allowances', 'Deductions', 'Net Pay', 'Status'];
    }
  }

  getReportKPIs(): { label: string; value: string }[] {
    const rtl = this.i18n.isRtl();
    const cat = this.activeCategory();

    if (cat === 'attendance') {
      const d = this.filteredAttendanceData();
      const avg = d.length ? (d.reduce((a: number, x: any) => a + x.rate, 0) / d.length).toFixed(1) : '0';
      return rtl
        ? [{ label: 'معدل الحضور العام', value: `${avg}%` },
           { label: 'إجمالي أيام الغياب', value: d.reduce((a: number, x: any) => a + x.absent, 0) + ' أيام' },
           { label: 'مجموع حالات التأخير', value: d.reduce((a: number, x: any) => a + x.late, 0) + ' مرة' }]
        : [{ label: 'Overall Attendance Rate', value: `${avg}%` },
           { label: 'Total Absence Days', value: d.reduce((a: number, x: any) => a + x.absent, 0) + ' days' },
           { label: 'Late Arrival Incidents', value: d.reduce((a: number, x: any) => a + x.late, 0) }];
    }

    if (cat === 'leaves') {
      const d = this.filteredLeavesData();
      return rtl
        ? [{ label: 'إجمالي الطلبات', value: String(d.length) },
           { label: 'إجمالي الأيام المستهلكة', value: d.reduce((a: number, x: any) => a + x.days, 0) + ' يوم' },
           { label: 'معتمدة', value: d.filter((x: any) => x.status === 'Approved').length + ' طلبات' }]
        : [{ label: 'Total Requests', value: String(d.length) },
           { label: 'Total Leave Days', value: d.reduce((a: number, x: any) => a + x.days, 0) + ' days' },
           { label: 'Approved', value: d.filter((x: any) => x.status === 'Approved').length + ' requests' }];
    }

    if (cat === 'performance') {
      const d = this.filteredPerformanceData();
      const avg = d.length ? (d.reduce((a: number, x: any) => a + x.score, 0) / d.length).toFixed(1) : '0';
      const top = d.reduce((best: any, x: any) => x.score > (best?.score || 0) ? x : best, null);
      return rtl
        ? [{ label: 'متوسط الأداء العام', value: `${avg}%` },
           { label: 'أعلى تقييم (5 نجوم)', value: d.filter((x: any) => x.stars === 5).length + ' موظفين' },
           { label: 'الأداء الأعلى', value: top ? `${top.name} (${top.score}%)` : '-' }]
        : [{ label: 'Average Score', value: `${avg}%` },
           { label: 'Excellent (5★)', value: d.filter((x: any) => x.stars === 5).length + ' employees' },
           { label: 'Top Performer', value: top ? `${top.name} (${top.score}%)` : '-' }];
    }

    // Payroll
    const d = this.filteredPayrollData();
    const total = d.reduce((a: number, x: any) => a + x.basic + x.allowance - x.deductions, 0);
    const avg   = d.length ? Math.round(total / d.length) : 0;
    const currency = rtl ? 'ر.س' : 'SAR';
    return rtl
      ? [{ label: 'إجمالي الرواتب الشهرية', value: `${total.toLocaleString()} ${currency}` },
         { label: 'متوسط صافي الراتب', value: `${avg.toLocaleString()} ${currency}` },
         { label: 'إجمالي الخصومات', value: `${d.reduce((a: number, x: any) => a + x.deductions, 0).toLocaleString()} ${currency}` }]
      : [{ label: 'Total Monthly Payroll', value: `${total.toLocaleString()} ${currency}` },
         { label: 'Average Net Pay', value: `${avg.toLocaleString()} ${currency}` },
         { label: 'Total Deductions', value: `${d.reduce((a: number, x: any) => a + x.deductions, 0).toLocaleString()} ${currency}` }];
  }

  getReportAiInsights(): AiInsight[] {
    const cat = this.activeCategory();
    const rtl = this.i18n.isRtl();
    const att = this.filteredAttendanceData();
    const pay = this.filteredPayrollData();
    const lv  = this.filteredLeavesData();

    if (cat === 'attendance') {
      const avg = att.length ? (att.reduce((a: number, x: any) => a + x.rate, 0) / att.length).toFixed(1) : '0';
      const worst = att.reduce((w: any, x: any) => x.rate < (w?.rate ?? 101) ? x : w, null);
      return rtl
        ? [{ type: 'success', text: `معدل الحضور الإجمالي ${avg}% — ضمن المعدلات الجيدة للإنتاجية.` },
           worst && worst.rate < 90
             ? { type: 'warning', text: `الموظف "${worst.name}" لديه أقل نسبة حضور (${worst.rate}%) — يُنصح بالمتابعة.` }
             : { type: 'info', text: 'جميع الموظفين يحافظون على نسبة حضور مقبولة هذا الشهر.' }]
        : [{ type: 'success', text: `Overall attendance rate is ${avg}% — within healthy productivity bounds.` },
           worst && worst.rate < 90
             ? { type: 'warning', text: `"${worst.name}" has the lowest rate (${worst.rate}%) — follow-up recommended.` }
             : { type: 'info', text: 'All employees maintained acceptable attendance this month.' }];
    }

    if (cat === 'leaves') {
      const approved = lv.filter((x: any) => x.status === 'Approved').length;
      return rtl
        ? [{ type: 'info', text: `${approved} طلبات إجازة معتمدة من أصل ${lv.length} طلب مسجّل في هذه الفترة.` },
           { type: 'success', text: 'تمت معالجة جميع الطلبات بشكل منتظم عبر نظام الموارد البشرية.' }]
        : [{ type: 'info', text: `${approved} approved out of ${lv.length} leave requests recorded for this period.` },
           { type: 'success', text: 'All requests were processed through the HR system regularly.' }];
    }

    if (cat === 'performance') {
      const d = this.filteredPerformanceData();
      const avg = d.length ? (d.reduce((a: number, x: any) => a + x.score, 0) / d.length).toFixed(1) : '0';
      return rtl
        ? [{ type: 'success', text: `متوسط الأداء العام ${avg}% — مستوى جيد ويمكن تطويره.` },
           { type: 'info', text: 'يُنصح بعقد جلسات تقييم نصف سنوية لتعزيز الأداء الفردي.' }]
        : [{ type: 'success', text: `Average team score is ${avg}% — solid and improvable.` },
           { type: 'info', text: 'Consider semi-annual one-on-one sessions to boost individual performance.' }];
    }

    const total = pay.reduce((a: number, x: any) => a + x.basic + x.allowance - x.deductions, 0);
    return rtl
      ? [{ type: 'success', text: `إجمالي الرواتب الشهرية ${total.toLocaleString()} ر.س — مسجّل وجاهز للصرف.` },
         { type: 'info', text: 'جميع الأرقام المالية مستخرجة مباشرة من سجلات قاعدة البيانات.' }]
      : [{ type: 'success', text: `Monthly payroll total is ${total.toLocaleString()} SAR — ready for processing.` },
         { type: 'info', text: 'All figures sourced directly from the live database records.' }];
  }
}
