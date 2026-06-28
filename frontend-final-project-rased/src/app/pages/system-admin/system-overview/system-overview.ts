import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemAdminService } from '../../../services/system-admin.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-system-overview',
  imports: [CommonModule],
  templateUrl: './system-overview.html',
  styleUrl: './system-overview.css'
})
export class SystemOverview implements OnInit {
  private systemAdminService = inject(SystemAdminService);
  i18n = inject(I18nService);

  // Admin System Health Metrics
  cpuVal = signal(28);
  cpuStatus = signal('Normal');
  ramVal = signal(8.4);
  ramStatus = signal('Stable');
  uptimePercent = signal('99.98% Uptime');
  healthStatus = signal('Excellent');
  totalAiRequests = signal(0);

  healthMetrics = computed(() => {
    const isAr = this.i18n.currentLang() === 'ar';
    return [
      { name: isAr ? 'حالة الخوادم الرئيسية' : 'Main Servers Health', status: isAr ? (this.healthStatus() === 'Excellent' ? 'ممتازة' : 'تنبيه') : this.healthStatus(), value: this.uptimePercent(), color: this.healthStatus() === 'Excellent' ? 'success' : 'warning' },
      { name: isAr ? 'استهلاك المعالج (CPU)' : 'Processor Usage (CPU)', status: isAr ? (this.cpuStatus() === 'Normal' ? 'طبيعي' : 'مرتفع') : this.cpuStatus(), value: `${this.cpuVal()}% Usage`, color: this.cpuStatus() === 'Normal' ? 'primary' : 'danger' },
      { name: isAr ? 'استهلاك الذاكرة (RAM)' : 'Memory Usage (RAM)', status: isAr ? (this.ramStatus() === 'Stable' ? 'مستقر' : 'حرج') : this.ramStatus(), value: `${this.ramVal()} GB / 16 GB`, color: this.ramStatus() === 'Stable' ? 'info' : 'danger' },
      { name: isAr ? 'إجمالي طلبات الذكاء الاصطناعي' : 'Total AI Requests', status: isAr ? 'نشط' : 'Active', value: `${this.totalAiRequests()} Requests`, color: 'success' }
    ];
  });

  // System Tenants (Companies registered)
  tenants = signal<any[]>([]);

  // System Logs
  systemLogs = signal<any[]>([]);

  private statsInterval: any;

  ngOnInit() {
    this.loadSystemData();
    this.loadLiveStats();
    // Poll stats every 5 seconds for real-time live update
    this.statsInterval = setInterval(() => {
      this.loadLiveStats();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  loadLiveStats() {
    this.systemAdminService.getDashboardStats().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const d = res.data;
          this.cpuVal.set(d.cpuUsage);
          this.cpuStatus.set(d.cpuStatus);
          this.ramVal.set(d.ramUsageGb);
          this.ramStatus.set(d.ramStatus);
          this.healthStatus.set(d.healthStatus);
          this.uptimePercent.set(d.uptimePercent);
          this.totalAiRequests.set(d.totalAiRequests);

          if (d.recentLogs && d.recentLogs.length > 0) {
            const isAr = this.i18n.currentLang() === 'ar';
            this.systemLogs.set(d.recentLogs.map((l: any) => {
              // Localize log times/descriptions roughly
              let eventText = l.event;
              if (isAr) {
                eventText = l.event
                  .replace("New company registered:", "تسجيل شركة جديدة:")
                  .replace("Suspended company account:", "تعليق حساب شركة:");
              } else {
                eventText = l.event
                  .replace("تسجيل شركة جديدة:", "New company registered:")
                  .replace("تعليق حساب شركة:", "Suspended company account:")
                  .replace("خطأ تم رصده في شركة", "Error detected in company");
              }
              const dt = new Date(l.time);
              const formattedTime = dt.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                month: 'short',
                day: 'numeric'
              }) + ' ' + dt.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return {
                event: eventText,
                time: formattedTime,
                type: l.type
              };
            }));
          }
        }
      },
      error: (err) => console.error('Failed to load live server stats', err)
    });
  }

  loadSystemData() {
    this.systemAdminService.getTenants().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const raw = res.data;
          const isAr = this.i18n.currentLang() === 'ar';
          
          const sorted = [...raw].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.tenants.set(sorted.slice(0, 5).map(t => ({
            name: t.name,
            owner: t.ownerName || (isAr ? 'مالك الشركة' : 'Company Owner'),
            plan: t.price >= 300 ? (isAr ? 'الباقة المؤسسية' : 'Enterprise Plan') : t.price >= 100 ? (isAr ? 'الباقة الاحترافية' : 'Professional Plan') : (isAr ? 'الباقة الأساسية' : 'Basic Plan'),
            status: t.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق سداد' : 'Suspended'),
            date: new Date(t.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          })));
        }
      },
      error: (err) => {
        console.error('Failed to load tenants list', err);
      }
    });
  }
}

