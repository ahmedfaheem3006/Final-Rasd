import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({ selector: 'app-finance-overview', imports: [CommonModule], templateUrl: './finance-overview.html', styleUrl: './finance-overview.css' })
export class FinanceOverview {
  stats = signal([
    { label: 'إجمالي الإيرادات', value: '$284,500', change: '+14.2%', positive: true, color: 'primary' },
    { label: 'إجمالي المصروفات', value: '$98,700', change: '+3.1%', positive: false, color: 'danger' },
    { label: 'صافي الربح', value: '$185,800', change: '+22.5%', positive: true, color: 'success' },
    { label: 'فواتير مستحقة', value: '$32,400', change: '-8.3%', positive: true, color: 'warning' },
  ]);
  transactions = signal([
    { desc: 'سداد فاتورة - مجموعة الفوزان', amount: '+$24,500', date: '15 يونيو', type: 'income' },
    { desc: 'رواتب الموظفين - يونيو', amount: '-$42,000', date: '10 يونيو', type: 'expense' },
    { desc: 'سداد فاتورة - سعودي كورب', amount: '+$15,200', date: '8 يونيو', type: 'income' },
    { desc: 'إيجار المكتب - يونيو', amount: '-$8,500', date: '5 يونيو', type: 'expense' },
    { desc: 'سداد فاتورة - مؤسسة النجاح', amount: '+$31,000', date: '3 يونيو', type: 'income' },
  ]);
}
