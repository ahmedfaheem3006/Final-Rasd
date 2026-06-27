import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-tasks',
  imports: [CommonModule, RouterModule],
  templateUrl: './my-tasks.html',
  styleUrl: './my-tasks.css'
})
export class MyTasks {
  stats = signal([
    { title: 'إجمالي المهام', value: '18', color: 'primary', icon: 'tasks' },
    { title: 'قيد التنفيذ', value: '6', color: 'info', icon: 'progress' },
    { title: 'مكتملة هذا الشهر', value: '9', color: 'success', icon: 'done' },
    { title: 'متأخرة', value: '3', color: 'danger', icon: 'late' }
  ]);

  tasks = signal([
    { id: 1, title: 'إعداد تقرير المبيعات الشهري', project: 'مشروع الرصد', priority: 'high', status: 'in-progress', dueDate: '18 يونيو 2026', progress: 65, assignedBy: 'أحمد المطيري' },
    { id: 2, title: 'مراجعة عقود العملاء الجدد', project: 'إدارة العقود', priority: 'high', status: 'pending', dueDate: '20 يونيو 2026', progress: 0, assignedBy: 'سارة القحطاني' },
    { id: 3, title: 'تحديث بيانات العملاء في النظام', project: 'مشروع الرصد', priority: 'medium', status: 'in-progress', dueDate: '22 يونيو 2026', progress: 40, assignedBy: 'أحمد المطيري' },
    { id: 4, title: 'حضور اجتماع فريق المبيعات', project: 'اجتماعات الفريق', priority: 'low', status: 'completed', dueDate: '14 يونيو 2026', progress: 100, assignedBy: 'خالد الدوسري' },
    { id: 5, title: 'تصميم عرض تقديمي للعميل', project: 'مشروع الرصد', priority: 'high', status: 'overdue', dueDate: '12 يونيو 2026', progress: 30, assignedBy: 'أحمد المطيري' },
    { id: 6, title: 'اختبار النظام الجديد وتوثيق الملاحظات', project: 'تطوير النظام', priority: 'medium', status: 'in-progress', dueDate: '25 يونيو 2026', progress: 55, assignedBy: 'سارة القحطاني' },
    { id: 7, title: 'إعداد فاتورة مشروع الحلول الرقمية', project: 'إدارة العقود', priority: 'medium', status: 'completed', dueDate: '10 يونيو 2026', progress: 100, assignedBy: 'خالد الدوسري' },
  ]);

  activeFilter = signal('all');

  setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  filteredTasks() {
    const filter = this.activeFilter();
    if (filter === 'all') return this.tasks();
    return this.tasks().filter(t => t.status === filter);
  }
}
