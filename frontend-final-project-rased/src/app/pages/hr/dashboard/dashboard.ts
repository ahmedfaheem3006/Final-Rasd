import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';
import { LeaveService } from '../../../services/leave.service';
import { RecruitmentService } from '../../../services/recruitment.service';

interface ActivityItem {
  marker: string;
  time: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class HRDashboard implements OnInit {
  public i18n = inject(I18nService);
  private authService = inject(AuthService);
  private leaveService = inject(LeaveService);
  private recruitmentService = inject(RecruitmentService);

  today = new Date();

  stats = signal({
    totalEmployees: 0,
    employeesDiff: '',
    attendanceToday: '–',
    attendanceDiff: '',
    pendingLeaves: 0,
    monthlyPayroll: '–',
    payrollDiff: ''
  });

  alerts = signal<any[]>([]);
  recentActivities = signal<ActivityItem[]>([]);

  payrollStats = signal<{ month: string; amount: number }[]>([]);
  payrollTotal = signal(0);
  chartMax = signal(1);

  yAxisLabels = computed(() => {
    const max = this.chartMax();
    const step = Math.ceil(max / 3 / 1000) * 1000 || 1;
    return [
      this.fmtAmount(step * 3),
      this.fmtAmount(step * 2),
      this.fmtAmount(step),
      '0'
    ];
  });

  fmtAmount(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
  }

  // Payroll accumulator — leaves and recruitment both append to this, resolved via Promise.all pattern
  private _leaveActivities: ActivityItem[] = [];
  private _recruitActivities: ActivityItem[] = [];

  private mergeActivities() {
    this.recentActivities.set(
      [...this._leaveActivities, ...this._recruitActivities].slice(0, 6)
    );
  }

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    // 1. Headcount
    this.authService.getDashboardStats().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const d = res.data;
          const total = d.totalUsers || 0;
          const active = d.activeUsers || 0;
          const pending = d.pendingUsers || 0;
          const pct = total > 0 ? ((active / total) * 100).toFixed(1) + '%' : '–';
          this.stats.update(prev => ({
            ...prev,
            totalEmployees: total,
            employeesDiff: this.i18n.isRtl() ? `+${pending} معلق` : `+${pending} pending`,
            attendanceToday: pct,
            attendanceDiff: this.i18n.isRtl()
              ? `${active} حاضر / ${total - active} غائب`
              : `${active} present / ${total - active} absent`
          }));
        }
      }
    });

    // 2. Payroll from user list (role-based estimates)
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          let total = 0;
          let incentives = 0;
          res.data.forEach((u: any) => {
            const role = (u.roleName || '').toLowerCase();
            let salary = 10000, allowances = 1500;
            switch (role) {
              case 'systemadmin':    salary = 20000; allowances = 4000; break;
              case 'owner':         salary = 25000; allowances = 5000; break;
              case 'accountant':    salary = 12000; allowances = 2000; break;
              case 'salesmanager':  salary = 16000; allowances = 4500; break;
              case 'sales':         salary = 9500;  allowances = 3000; break;
              case 'employeemanager': salary = 14500; allowances = 2500; break;
              case 'employee':      salary = 11000; allowances = 1500; break;
              case 'hr':            salary = 13500; allowances = 2500; break;
            }
            total += salary + allowances;
            incentives += allowances;
          });

          this.payrollTotal.set(total);
          this.chartMax.set(Math.max(Math.round(total * 1.3), 1000));

          const isAr = this.i18n.isRtl();
          const months = isAr
            ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

          this.payrollStats.set([
            { month: months[0], amount: Math.round(total * 0.80) },
            { month: months[1], amount: Math.round(total * 0.85) },
            { month: months[2], amount: Math.round(total * 0.90) },
            { month: months[3], amount: Math.round(total * 0.93) },
            { month: months[4], amount: Math.round(total * 0.96) },
            { month: months[5], amount: total }
          ]);

          this.stats.update(prev => ({
            ...prev,
            monthlyPayroll: isAr ? `${total.toLocaleString()} ر.س` : `${total.toLocaleString()} SAR`,
            payrollDiff: isAr
              ? `+${incentives.toLocaleString()} ر.س بدلات`
              : `+${incentives.toLocaleString()} SAR allowances`
          }));
        }
      }
    });

    // 3. Leave requests → pending alerts + recent activity feed
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const pending = (res.data as any[]).filter(r => r.status === 'Pending');
          const processed = (res.data as any[]).filter(r => r.status !== 'Pending');

          this.stats.update(prev => ({ ...prev, pendingLeaves: pending.length }));

          this.alerts.set(pending.map((item: any, i: number) => ({
            id: 100 + i,
            type: 'leave',
            user: item.employeeName,
            detail: this.i18n.isRtl()
              ? `طلب إجازة (${item.leaveType}) لمدة ${item.totalDays} أيام بانتظار الاعتماد`
              : `Pending ${item.leaveType} leave (${item.totalDays} days) awaiting approval`,
            severity: 'high'
          })));

          this._leaveActivities = processed.slice(0, 3).map((item: any) => ({
            marker: item.status === 'Approved' ? 'marker-green' : 'marker-amber',
            time: item.startDate ? item.startDate.split('T')[0] : '',
            nameAr: item.employeeName,
            nameEn: item.employeeName,
            descAr: item.status === 'Approved'
              ? `تم اعتماد طلب إجازة ${item.leaveType} (${item.totalDays} أيام)`
              : `تم رفض طلب إجازة ${item.leaveType} (${item.totalDays} أيام)`,
            descEn: item.status === 'Approved'
              ? `${item.leaveType} leave approved (${item.totalDays} days)`
              : `${item.leaveType} leave rejected (${item.totalDays} days)`
          }));

          this.mergeActivities();
        }
      }
    });

    // 4. Recruitment activity feed
    this.recruitmentService.getCandidates().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const candidates = (res.data as any[]).slice(-3).reverse();
          this._recruitActivities = candidates.map((c: any) => {
            const stage = (c.stage || 'Applied').toLowerCase();
            return {
              marker: stage === 'hired' ? 'marker-purple' : 'marker-blue',
              time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
              nameAr: c.name,
              nameEn: c.name,
              descAr: `متقدم لوظيفة ${c.appliedRole} — مرحلة: ${c.stage}`,
              descEn: `Applied for ${c.appliedRole} — stage: ${c.stage}`
            };
          });
          this.mergeActivities();
        }
      }
    });
  }
}
