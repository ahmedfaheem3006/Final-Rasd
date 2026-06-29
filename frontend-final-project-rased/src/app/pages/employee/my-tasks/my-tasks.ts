import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-my-tasks',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-tasks.html',
  styleUrl: './my-tasks.css'
})
export class MyTasks implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  loading = signal(false);
  allTasks = signal<any[]>([]);

  stats = signal([
    { title: 'إجمالي المهام', value: '0', color: 'primary', icon: 'tasks' },
    { title: 'قيد التنفيذ', value: '0', color: 'info', icon: 'progress' },
    { title: 'مكتملة', value: '0', color: 'success', icon: 'done' },
    { title: 'معلقة', value: '0', color: 'warning', icon: 'late' }
  ]);

  activeFilter = signal('all');

  // Request Task Modal Fields
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  newTitle = '';
  newDesc = '';
  newDueDate = '';

  ngOnInit() {
    this.loadMyTasks();
  }

  loadMyTasks() {
    this.loading.set(true);
    const currentUser = this.authService.currentUser();
    const currentUserId = currentUser?.id;

    this.taskService.getTasks().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.success && res.data) {
          // Filter tasks assigned to this employee
          const myTasksList = res.data.filter((t: any) => t.assignedUserId === currentUserId);

          // Map to display structure
          const mapped = myTasksList.map((t: any) => {
            let status = 'pending';
            const s = t.status?.toLowerCase();
            if (s === 'inprogress' || s === 'in-progress') status = 'in-progress';
            else if (s === 'done' || s === 'completed') status = 'completed';

            return {
              id: t.id,
              title: t.title,
              project: 'القسم الرئيسي',
              priority: 'medium',
              status: status,
              dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('ar-SA') : 'بدون تاريخ',
              progress: status === 'completed' ? 100 : (status === 'in-progress' ? 50 : 0),
              assignedBy: 'عمر فاروق'
            };
          });

          this.allTasks.set(mapped);
          this.updateStats(mapped);
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load my tasks', err);
      }
    });
  }

  updateStats(tasksList: any[]) {
    const total = tasksList.length;
    const progress = tasksList.filter(t => t.status === 'in-progress').length;
    const completed = tasksList.filter(t => t.status === 'completed').length;
    const pending = tasksList.filter(t => t.status === 'pending').length;

    this.stats.set([
      { title: 'إجمالي المهام', value: total.toString(), color: 'primary', icon: 'tasks' },
      { title: 'قيد التنفيذ', value: progress.toString(), color: 'info', icon: 'progress' },
      { title: 'مكتملة', value: completed.toString(), color: 'success', icon: 'done' },
      { title: 'معلقة', value: pending.toString(), color: 'warning', icon: 'late' }
    ]);
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  filteredTasks() {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allTasks();
    return this.allTasks().filter(t => t.status === filter);
  }

  openModal() {
    this.newTitle = '';
    this.newDesc = '';
    this.newDueDate = '';
    this.isSubmitting.set(false);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  requestTask() {
    if (!this.newTitle || !this.newDesc) {
      this.toastService.warning('يرجى ملء جميع الحقول المطلوبة لإرسال الطلب', 'حقول مطلوبة');
      return;
    }

    const currentUser = this.authService.currentUser();
    const currentUserId = currentUser?.id;
    if (!currentUserId) {
      this.toastService.error('فشل تحديد هوية المستخدم النشط', 'خطأ');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      title: this.newTitle,
      description: this.newDesc,
      assignedUserId: currentUserId,
      dueDate: this.newDueDate ? new Date(this.newDueDate).toISOString() : new Date(Date.now() + 3*24*60*60*1000).toISOString(),
      status: 'Todo'
    };

    this.taskService.createTask(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          this.toastService.success('تم تقديم طلب المهمة بنجاح وإرسالها للمشرف', 'طلب مهمة');
          this.loadMyTasks();
          this.closeModal();
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error(err.error?.message || 'فشل تقديم طلب المهمة', 'خطأ');
      }
    });
  }
}
