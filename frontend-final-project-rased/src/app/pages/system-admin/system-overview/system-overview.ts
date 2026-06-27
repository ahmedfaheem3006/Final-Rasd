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
  healthMetrics = computed(() => {
    const isAr = this.i18n.currentLang() === 'ar';
    return [
      { name: isAr ? 'حالة الخوادم الرئيسية' : 'Main Servers Health', status: isAr ? 'ممتازة' : 'Excellent', value: '99.98% Uptime', color: 'success' },
      { name: isAr ? 'استهلاك المعالج (CPU)' : 'Processor Usage (CPU)', status: isAr ? 'طبيعي' : 'Normal', value: '28% Usage', color: 'primary' },
      { name: isAr ? 'استهلاك الذاكرة (RAM)' : 'Memory Usage (RAM)', status: isAr ? 'مستقر' : 'Stable', value: '8.4 GB / 16 GB', color: 'info' }
    ];
  });

  // System Tenants (Companies registered)
  tenants = signal<any[]>([]);

  // System Logs
  systemLogs = signal<any[]>([]);

  ngOnInit() {
    this.loadSystemData();
  }

  loadSystemData() {
    this.systemAdminService.getTenants().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const raw = res.data;
          const isAr = this.i18n.currentLang() === 'ar';
          
          // Set last 3 tenants
          const sorted = [...raw].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.tenants.set(sorted.slice(0, 3).map(t => ({
            name: t.name,
            owner: t.ownerName || (isAr ? 'مالك الشركة' : 'Company Owner'),
            plan: t.price >= 300 ? (isAr ? 'الباقة المؤسسية' : 'Enterprise Plan') : t.price >= 100 ? (isAr ? 'الباقة الاحترافية' : 'Professional Plan') : (isAr ? 'الباقة الأساسية' : 'Basic Plan'),
            status: t.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق سداد' : 'Suspended'),
            date: new Date(t.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          })));

          // Set system logs dynamically
          const logs: any[] = [];
          sorted.slice(0, 4).forEach((t, index) => {
            const timeStr = isAr 
              ? (index === 0 ? 'منذ قليل' : index === 1 ? 'منذ ساعة' : 'منذ يوم') 
              : (index === 0 ? 'just now' : index === 1 ? 'an hour ago' : 'a day ago');
            
            logs.push({
              event: isAr ? `تسجيل شركة جديدة: ${t.name}` : `New company registered: ${t.name}`,
              time: timeStr,
              type: 'info'
            });
            if (!t.isActive) {
              logs.push({
                event: isAr ? `تعليق حساب شركة: ${t.name}` : `Suspended company account: ${t.name}`,
                time: isAr ? 'مؤخراً' : 'recently',
                type: 'warning'
              });
            }
          });
          
          if (logs.length === 0) {
            logs.push({ 
              event: isAr ? 'النظام يعمل بشكل مستقر، لا توجد تسجيلات حديثة.' : 'System running stably, no recent registrations.', 
              time: isAr ? 'الآن' : 'Now', 
              type: 'info' 
            });
          }
          this.systemLogs.set(logs);
        }
      },
      error: (err) => {
        console.error('Failed to load system overview data', err);
      }
    });
  }
}

