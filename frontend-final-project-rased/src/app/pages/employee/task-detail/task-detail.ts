import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-task-detail',
  imports: [CommonModule],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.css'
})
export class TaskDetail {
  task = signal({
    id: 1,
    title: 'إعداد تقرير المبيعات الشهري',
    description: 'إعداد تقرير شامل يتضمن تحليل أداء المبيعات للشهر الحالي مع مقارنة بالأشهر السابقة، وتقديم توصيات لتحسين الأداء البيعي.',
    project: 'مشروع الرصد',
    priority: 'high',
    status: 'in-progress',
    dueDate: '18 يونيو 2026',
    createdDate: '5 يونيو 2026',
    progress: 65,
    assignedBy: 'أحمد المطيري',
    assignedByRole: 'مدير المبيعات',
    attachments: 3,
    comments: 5
  });

  timeline = signal([
    { action: 'تم إنشاء المهمة', user: 'أحمد المطيري', date: '5 يونيو 2026', time: '09:30 ص', type: 'created' },
    { action: 'تم بدء العمل على المهمة', user: 'أنت', date: '6 يونيو 2026', time: '10:15 ص', type: 'started' },
    { action: 'تم رفع ملف التقرير المبدئي', user: 'أنت', date: '10 يونيو 2026', time: '02:45 م', type: 'attachment' },
    { action: 'تعليق: يرجى إضافة بيانات الربع الثاني', user: 'أحمد المطيري', date: '11 يونيو 2026', time: '11:00 ص', type: 'comment' },
    { action: 'تم تحديث نسبة الإنجاز إلى 65%', user: 'أنت', date: '14 يونيو 2026', time: '04:20 م', type: 'progress' },
  ]);

  subtasks = signal([
    { title: 'جمع بيانات المبيعات', done: true },
    { title: 'تحليل الأداء الشهري', done: true },
    { title: 'مقارنة مع الأهداف المحددة', done: false },
    { title: 'إعداد التوصيات النهائية', done: false },
    { title: 'مراجعة وتسليم التقرير', done: false }
  ]);
}
