import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({ selector: 'app-customers-readonly', imports: [CommonModule], templateUrl: './customers-readonly.html', styleUrl: './customers-readonly.css' })
export class CustomersReadonly {
  customers = signal([
    { name: 'مجموعة الفوزان للتجارة', contact: 'فهد الفوزان', email: 'fahad@fawzan.sa', totalInvoices: '$87,200', lastPayment: '15 يونيو 2026', status: 'active' },
    { name: 'شركة الأمل للاستشارات', contact: 'منى الشهري', email: 'mona@amal.sa', totalInvoices: '$34,500', lastPayment: '12 يونيو 2026', status: 'active' },
    { name: 'سعودي كورب للخدمات', contact: 'خالد العمري', email: 'khalid@scorp.sa', totalInvoices: '$52,800', lastPayment: '8 يونيو 2026', status: 'overdue' },
    { name: 'مؤسسة النجاح التقني', contact: 'عبد الرحمن السيد', email: 'abdo@najah.sa', totalInvoices: '$61,000', lastPayment: '3 يونيو 2026', status: 'active' },
    { name: 'الشركة الوطنية للحلول', contact: 'سارة المطيري', email: 'sara@natl.sa', totalInvoices: '$18,400', lastPayment: '28 مايو 2026', status: 'active' },
  ]);
}
