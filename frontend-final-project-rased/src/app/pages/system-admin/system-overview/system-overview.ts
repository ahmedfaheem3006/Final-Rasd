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
      { name: isAr ? 'استهلاك الذاكرة (RAM)' : 'Memory Usage (RAM)', status: isAr ? (this.ramStatus() === 'Stable' ? 'مستقر' : 'حرج') : this.ramStatus(), value: `${this.ramVal()} GB / 16 GB`, color: this.ramStatus() === 'Stable' ? 'info' : 'danger' }
    ];
  });

  // System Tenants (Companies registered)
  tenants = signal<any[]>([]);

  // System Logs
  systemLogs = signal<any[]>([]);

  exportLogs() {
    const isAr = this.i18n.currentLang() === 'ar';
    const logsList = this.systemLogs();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(isAr ? 'الرجاء السماح بالنوافذ المنبثقة لتصدير السجلات' : 'Please allow popups to export logs');
      return;
    }

    const direction = isAr ? 'rtl' : 'ltr';
    const title = isAr ? 'سجلات النظام الفنية - رصد AI' : 'Rasd AI - Technical System Logs';
    
    let logsHtml = '';
    logsList.forEach(log => {
      const typeLabel = log.type === 'error' ? (isAr ? 'خطأ' : 'ERROR') : log.type === 'warning' ? (isAr ? 'تحذير' : 'WARNING') : (isAr ? 'معلومة' : 'INFO');
      const badgeClass = log.type;
      logsHtml += `
        <tr class="log-row ${badgeClass}">
          <td class="log-time" style="font-family: monospace;">${log.time}</td>
          <td class="log-type"><span class="badge ${badgeClass}">${typeLabel}</span></td>
          <td class="log-event">${log.event}</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
            body {
              font-family: ${isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif"};
              direction: ${direction};
              padding: 40px;
              background-color: #ffffff;
              color: #1e293b;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #0f172a;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 14px;
              color: #64748b;
            }
            .meta {
              font-size: 12px;
              color: #94a3b8;
              text-align: ${isAr ? 'left' : 'right'};
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px 16px;
              text-align: ${isAr ? 'right' : 'left'};
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            th {
              background-color: #f8fafc;
              font-weight: 700;
              color: #475569;
            }
            .badge {
              padding: 4px 8px;
              font-size: 11px;
              font-weight: 700;
              border-radius: 4px;
              display: inline-block;
            }
            .badge.info {
              background-color: #e0f2fe;
              color: #0369a1;
            }
            .badge.warning {
              background-color: #fef3c7;
              color: #b45309;
            }
            .badge.error {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            .log-row.error {
              background-color: #fffafb;
            }
            .log-row.warning {
              background-color: #fffdfa;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${isAr ? 'سجل الأحداث الفنية للنظام' : 'System Technical Event Logs'}</h1>
              <p>${isAr ? 'تقرير تشخيص خوادم منصة رصد AI' : 'Diagnostic report for Rasd AI servers'}</p>
            </div>
            <div class="meta">
              <div>${isAr ? 'تاريخ التصدير' : 'Export Date'}: ${new Date().toLocaleString(isAr ? 'ar-EG' : 'en-US')}</div>
              <div>${isAr ? 'المشرف' : 'Operator'}: System Admin</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25%;">${isAr ? 'التوقيت' : 'Time'}</th>
                <th style="width: 15%;">${isAr ? 'النوع' : 'Type'}</th>
                <th style="width: 60%;">${isAr ? 'الحدث' : 'Event'}</th>
              </tr>
            </thead>
            <tbody>
              ${logsHtml}
            </tbody>
          </table>

          <div class="footer">
            ${isAr ? 'تم إنشاء هذا التقرير تلقائياً بواسطة لوحة تحكم رصد AI.' : 'This report was generated automatically by Rasd AI Admin Dashboard.'}
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

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

