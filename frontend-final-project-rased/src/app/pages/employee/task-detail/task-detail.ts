import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-task-detail',
  imports: [CommonModule],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.css'
})
export class TaskDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);

  task = signal<any>({
    id: 1,
    title: 'جاري تحميل المهمة...',
    description: '',
    project: 'القسم الرئيسي',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    createdDate: '',
    progress: 0,
    assignedBy: 'عمر فاروق',
    assignedByRole: 'مشرف القسم',
    attachments: 0,
    comments: 0
  });

  timeline = signal<any[]>([
    { action: 'تم إنشاء المهمة', user: 'نظام رصد', date: '', time: '', type: 'created' }
  ]);

  subtasks = signal([
    { title: 'جمع متطلبات المهمة', done: true },
    { title: 'بدء التنفيذ والعمل', done: false },
    { title: 'مراجعة المخرجات النهائية', done: false }
  ]);

  ngOnInit() {
    this.loadTaskDetail();
  }

  private loadTaskDetail() {
    const taskIdStr = this.route.snapshot.paramMap.get('id');
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);

    this.taskService.getTasks().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const matched = res.data.find((t: any) => t.id === taskId);
          if (matched) {
            let status = 'pending';
            const s = matched.status?.toLowerCase();
            if (s === 'inprogress' || s === 'in-progress') status = 'in-progress';
            else if (s === 'done' || s === 'completed') status = 'completed';

            this.task.set({
              id: matched.id,
              title: matched.title,
              description: matched.description || 'لا يوجد تفاصيل إضافية لهذه المهمة.',
              project: 'القسم الرئيسي',
              priority: 'medium',
              status: status,
              dueDate: matched.dueDate ? new Date(matched.dueDate).toLocaleDateString('ar-SA') : 'بدون تاريخ',
              createdDate: matched.createdAt ? new Date(matched.createdAt).toLocaleDateString('ar-SA') : 'مؤخراً',
              progress: status === 'completed' ? 100 : (status === 'in-progress' ? 50 : 0),
              assignedBy: 'عمر فاروق',
              assignedByRole: 'مشرف القسم',
              attachments: 0,
              comments: 0
            });

            this.timeline.set([
              { action: 'تم إنشاء المهمة وإسنادها', user: 'عمر فاروق', date: matched.createdAt ? new Date(matched.createdAt).toLocaleDateString('ar-SA') : 'مؤخراً', time: '10:00 ص', type: 'created' },
              { action: 'حالة المهمة الحالية في النظام هي: ' + this.translateStatus(status), user: 'نظام رصد', date: 'اليوم', time: 'محدث', type: 'progress' }
            ]);
          }
        }
      },
      error: (err) => console.error('Failed to load task details', err)
    });
  }

  private translateStatus(status: string): string {
    if (status === 'completed') return 'مكتملة';
    if (status === 'in-progress') return 'قيد التنفيذ';
    return 'معلقة';
  }
}
