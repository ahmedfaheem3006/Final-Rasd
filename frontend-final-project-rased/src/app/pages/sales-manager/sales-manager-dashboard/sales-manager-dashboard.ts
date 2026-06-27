import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-manager-dashboard',
  imports: [CommonModule],
  templateUrl: './sales-manager-dashboard.html',
  styleUrl: './sales-manager-dashboard.css'
})
export class SalesManagerDashboard {
  stats = signal([
    { title: 'إجمالي مبيعات الفريق', value: '$142,300', change: '+18.2%', positive: true, color: 'primary', desc: 'مقارنة بالشهر الماضي' },
    { title: 'الصفقات النشطة', value: '23 صفقة', change: '+5 صفقات', positive: true, color: 'info', desc: 'في المراحل المختلفة' },
    { title: 'معدل التحويل الكلي', value: '34.5%', change: '+4.1%', positive: true, color: 'success', desc: 'من فرص إلى صفقات' },
    { title: 'متوسط قيمة الصفقة', value: '$6,187', change: '-2.3%', positive: false, color: 'warning', desc: 'حسب حجم الصفقات الأخير' },
  ]);

  teamPerformance = signal([
    { name: 'فهد المطيري', deals: 8, revenue: '$47,500', target: 95, avatar: 'FM', status: 'أعلى مندوب مبيعات' },
    { name: 'نورة السعيد', deals: 6, revenue: '$32,200', target: 82, avatar: 'NS', status: 'أداء مستقر' },
    { name: 'خالد الدوسري', deals: 5, revenue: '$28,100', target: 74, avatar: 'KD', status: 'صفقات قيد التفاوض' },
    { name: 'منى العسيري', deals: 4, revenue: '$34,500', target: 88, avatar: 'MA', status: 'معدل إغلاق سريع' },
  ]);

  recentDeals = signal([
    { client: 'سعودي كورب للخدمات', amount: '$24,000', stage: 'مرحلة التفاوض', agent: 'خالد الدوسري', status: 'negotiation' },
    { client: 'مجموعة التكامل التقني', amount: '$12,500', stage: 'العملاء المحتملون', agent: 'فهد المطيري', status: 'lead' },
    { client: 'شركة الأمل للاستشارات', amount: '$8,800', stage: 'الصفقات المغلقة', agent: 'نورة السعيد', status: 'won' },
    { client: 'منظومة الأعمال الذكية', amount: '$18,500', stage: 'مرحلة التفاوض', agent: 'منى العسيري', status: 'negotiation' },
  ]);
}
