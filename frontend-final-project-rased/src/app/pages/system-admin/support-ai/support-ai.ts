import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-support-ai',
  imports: [CommonModule],
  templateUrl: './support-ai.html',
  styleUrl: './support-ai.css'
})
export class SupportAi implements OnInit, OnDestroy {
  private systemAdminService = inject(SystemAdminService);
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);
  i18n = inject(I18nService);

  issues = signal<any[]>([]);
  isLoading = signal(false);
  isScanning = signal(false);
  scanningTenantId = signal<string | null>(null);
  activeFilter = signal<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  selectedCompany = signal<string>('All');
  expandedIds = signal<Set<string>>(new Set());
  autoRefresh = signal(false);
  lastScanned = signal<Date | null>(null);

  private refreshTimer: any;

  companyNames = computed(() =>
    [...new Set(this.issues().map((i: any) => i.tenantName as string))].sort()
  );

  filteredIssues = computed(() => {
    let list = this.issues();
    const f = this.activeFilter();
    const co = this.selectedCompany();
    if (f !== 'All') list = list.filter((i: any) => i.status === f);
    if (co !== 'All') list = list.filter((i: any) => i.tenantName === co);
    return list;
  });

  pendingCount  = computed(() => this.issues().filter((i: any) => i.status === 'Pending').length);
  approvedCount = computed(() => this.issues().filter((i: any) => i.status === 'Approved').length);
  rejectedCount = computed(() => this.issues().filter((i: any) => i.status === 'Rejected').length);

  ngOnInit() { this.loadIssues(); }

  ngOnDestroy() { this.stopAutoRefresh(); }

  loadIssues() {
    this.isLoading.set(true);
    this.systemAdminService.getSupportIssues().subscribe({
      next: (res) => {
        if (res?.success && res.data) this.issues.set(res.data);
        this.lastScanned.set(new Date());
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في تحميل طلبات الدعم.' : 'Failed to load support requests.'
        );
        this.isLoading.set(false);
      }
    });
  }

  runScan() {
    this.isScanning.set(true);
    this.systemAdminService.runAiScan().subscribe({
      next: (res) => {
        this.isScanning.set(false);
        if (res?.success) {
          this.toastService.success(
            res.message,
            this.i18n.currentLang() === 'ar' ? 'فحص الذكاء الاصطناعي' : 'AI Scan'
          );
          this.loadIssues();
        }
      },
      error: () => {
        this.isScanning.set(false);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في تشغيل الفحص.' : 'Scan failed.'
        );
      }
    });
  }

  runTenantScan(tenantId: string) {
    this.scanningTenantId.set(tenantId);
    this.systemAdminService.runTenantScan(tenantId).subscribe({
      next: (res) => {
        this.scanningTenantId.set(null);
        this.toastService.success(
          res?.message ?? '',
          this.i18n.currentLang() === 'ar' ? 'فحص الشركة' : 'Company Scan'
        );
        if ((res?.count ?? 0) > 0) this.loadIssues();
      },
      error: () => this.scanningTenantId.set(null)
    });
  }

  takeAction(issueId: string, actionName: string) {
    this.issues.update(list =>
      list.map((i: any) => i.id === issueId ? { ...i, status: actionName } : i)
    );
    this.systemAdminService.resolveIssue(issueId, actionName).subscribe({
      next: () => {
        const ar = actionName === 'Approved' ? 'تم الموافقة وتطبيق الحل!' : 'تم رفض الإجراء.';
        const en = actionName === 'Approved' ? 'Action approved and applied!' : 'Action rejected.';
        this.toastService.success(
          this.i18n.currentLang() === 'ar' ? ar : en,
          this.i18n.currentLang() === 'ar' ? 'قرار النظام' : 'System Decision'
        );
        const saved = localStorage.getItem('rasd_user_session');
        const user = saved ? JSON.parse(saved) : null;
        if (user) this.notificationService.loadNotificationsForUser(user.role);
      },
      error: () => this.loadIssues()
    });
  }

  bulkAction(actionName: string) {
    const count = this.pendingCount();
    if (count === 0) return;
    this.issues.update(list =>
      list.map((i: any) => i.status === 'Pending' ? { ...i, status: actionName } : i)
    );
    this.systemAdminService.bulkAction(actionName).subscribe({
      next: (res) => {
        this.toastService.success(
          res?.message ?? '',
          this.i18n.currentLang() === 'ar' ? 'إجراء مجمّع' : 'Bulk Action'
        );
      },
      error: () => this.loadIssues()
    });
  }

  deleteIssue(id: string) {
    this.issues.update(list => list.filter((i: any) => i.id !== id));
    this.systemAdminService.deleteIssue(id).subscribe({
      next: () => this.toastService.success(
        this.i18n.currentLang() === 'ar' ? 'تم حذف المشكلة.' : 'Issue deleted.',
        ''
      ),
      error: () => this.loadIssues()
    });
  }

  toggleAutoRefresh() {
    if (this.autoRefresh()) {
      this.stopAutoRefresh();
    } else {
      this.autoRefresh.set(true);
      this.refreshTimer = setInterval(() => this.loadIssues(), 60000);
    }
  }

  private stopAutoRefresh() {
    this.autoRefresh.set(false);
    if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; }
  }

  isExpanded(id: string): boolean { return this.expandedIds().has(id); }

  toggleExpand(id: string) {
    const s = new Set(this.expandedIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.expandedIds.set(s);
  }

  getSeverity(issue: any): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (issue.severity && ['Critical','High','Medium','Low'].includes(issue.severity))
      return issue.severity;
    const t = ((issue.issueDescription ?? '') + ' ' + (issue.aiActionDetails ?? '')).toLowerCase();
    if (t.includes('95%') || t.includes('انقطاع') || t.includes('توقف')) return 'Critical';
    if (t.includes('فواتير') || t.includes('فشل') || t.includes('تجاوز')) return 'High';
    if (t.includes('ارتفاع') || t.includes('استهلاك')) return 'Medium';
    return 'Low';
  }

  exportCsv() {
    const ar = this.i18n.currentLang() === 'ar';
    const header = ar
      ? ['الشركة', 'الحالة', 'الخطورة', 'وصف المشكلة', 'توصية الذكاء الاصطناعي', 'التاريخ']
      : ['Company', 'Status', 'Severity', 'Issue Description', 'AI Recommendation', 'Date'];
    const rows = [
      header,
      ...this.filteredIssues().map((i: any) => [
        i.tenantName,
        i.status,
        this.getSeverity(i),
        `"${(i.issueDescription ?? '').replace(/"/g, '""')}"`,
        `"${(i.aiActionDetails ?? '').replace(/"/g, '""')}"`,
        new Date(i.createdAt).toLocaleDateString()
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-issues-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  setFilter(f: 'All' | 'Pending' | 'Approved' | 'Rejected') { this.activeFilter.set(f); }
}
