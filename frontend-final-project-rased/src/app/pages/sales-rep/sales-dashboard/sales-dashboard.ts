import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sales-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './sales-dashboard.html',
  styleUrl: './sales-dashboard.css'
})
export class SalesDashboard {
  stats = signal([
    { label: 'إجمالي مبيعاتي (هذا الشهر)', value: '$24,500', icon: 'dollar', change: '+12%', positive: true },
    { label: 'صفقاتي النشطة', value: '8 صفقات', icon: 'briefcase', change: '+2', positive: true },
    { label: 'معدل إغلاق الصفقات', value: '68%', icon: 'percent', change: '+4%', positive: true },
    { label: 'العملاء المحتملون الجدد', value: '15 عميل', icon: 'users', change: '-3', positive: false }
  ]);

  targetPercent = signal(75); // Target achievement
  monthlyTarget = signal('$32,000');
  achievedTarget = signal('$24,500');

  recentActivities = signal([
    { text: 'أرسلت عرض سعر لشركة الخليج للتجارة بقيمة $12,000', time: 'منذ ساعتين', type: 'info' },
    { text: 'تم تسجيل العميل الجديد "مجموعة الفوزان للتوزيع"', time: 'أمس', type: 'success' },
    { text: 'قمت بجدولة مكالمة متابعة مع العميل خالد الدوسري', time: 'أمس', type: 'warning' },
    { text: 'تم نقل صفقة "تطوير نظام المحاسبة" لمرحلة التفاوض', time: 'منذ يومين', type: 'info' }
  ]);

  topDeals = signal([
    { name: 'مجموعة الفوزان للتوزيع', value: '$15,000', stage: 'مرحلة التفاوض', progress: 50 },
    { name: 'شركة الخليج للتجارة', value: '$12,000', stage: 'إرسال العروض', progress: 75 },
    { name: 'سعودي كورب للخدمات', value: '$8,500', stage: 'العملاء المحتملون', progress: 25 },
    { name: 'مؤسسة النجاح التقني', value: '$22,000', stage: 'الصفقات المغلقة', progress: 100 }
  ]);
}

