import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';

interface Assignee {
  id?: number;
  fullName: string;
  role: string;
  initials: string;
}

interface TeamTask {
  id: number;
  title: string;
  desc: string;
  assignedTo: Assignee;
  priority: 'high' | 'medium' | 'low';
  stage: 'todo' | 'inprogress' | 'review' | 'done';
  date: string;
}

@Component({
  selector: 'app-team-tasks-board',
  imports: [CommonModule, FormsModule],
  templateUrl: './team-tasks-board.html',
  styleUrl: './team-tasks-board.css'
})
export class TeamTasksBoard implements OnInit {
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  assignees: Assignee[] = [];
  tasks = signal<TeamTask[]>([]);
  loading = signal(false);

  stages = [
    { key: 'todo', name: 'مهام معلقة', color: 'primary' },
    { key: 'inprogress', name: 'جاري العمل', color: 'warning' },
    { key: 'review', name: 'قيد المراجعة', color: 'info' },
    { key: 'done', name: 'مهام مكتملة', color: 'success' }
  ];

  isModalOpen = signal(false);

  // Form Fields
  newTitle = '';
  newDesc = '';
  newAssignee: Assignee | null = null;
  newPriority: 'high' | 'medium' | 'low' = 'medium';
  newStage: 'todo' | 'inprogress' | 'review' | 'done' = 'todo';

  // Drag and drop states
  draggedTaskId = signal<number | null>(null);
  draggedOverColumn = signal<string | null>(null);

  ngOnInit() {
    this.loadAssignees();
  }

  private loadAssignees() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const mapped = res.data.map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            role: this.translateRole(u.roleName),
            initials: this.getInitials(u.fullName)
          }));
          this.assignees = mapped;
          if (mapped.length > 0) {
            this.newAssignee = mapped[0];
          }
          // Now load tasks once assignees list is ready to resolve names
          this.loadTasks();
        }
      },
      error: () => {
        // Fallback if API fails
        this.assignees = [
          { id: 7, fullName: 'يوسف حسن', role: 'موظف', initials: 'يح' },
          { id: 19, fullName: 'رنا علي', role: 'مندوب مبيعات', initials: 'رع' }
        ];
        this.newAssignee = this.assignees[0];
        this.loadTasks();
      }
    });
  }

  private loadTasks() {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.success && res.data) {
          const mappedTasks = res.data.map((t: any) => {
            const userObj = this.assignees.find(a => a.id === t.assignedUserId) || {
              id: t.assignedUserId,
              fullName: t.assignedUserName || 'غير معين',
              role: 'موظف',
              initials: this.getInitials(t.assignedUserName || 'غم')
            };

            let stage: 'todo' | 'inprogress' | 'review' | 'done' = 'todo';
            const status = t.status?.toLowerCase();
            if (status === 'inprogress') stage = 'inprogress';
            else if (status === 'review') stage = 'review';
            else if (status === 'done' || status === 'completed') stage = 'done';

            return {
              id: t.id,
              title: t.title,
              desc: t.description || 'لا يوجد وصف للمهمة.',
              assignedTo: userObj,
              priority: 'medium' as const,
              stage: stage,
              date: t.dueDate ? t.dueDate.split('T')[0] : t.createdAt?.split('T')[0] || ''
            };
          });
          this.tasks.set(mappedTasks);
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load tasks', err);
      }
    });
  }

  getTasksByStage(stageKey: string) {
    return this.tasks().filter(t => t.stage === stageKey);
  }

  onDragStart(event: DragEvent, taskId: number) {
    this.draggedTaskId.set(taskId);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', taskId.toString());
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd() {
    this.draggedTaskId.set(null);
    this.draggedOverColumn.set(null);
  }

  onDragOver(event: DragEvent, stageKey: string) {
    event.preventDefault();
    this.draggedOverColumn.set(stageKey);
  }

  onDragLeave() {
    this.draggedOverColumn.set(null);
  }

  onDrop(event: DragEvent, targetStage: 'todo' | 'inprogress' | 'review' | 'done') {
    event.preventDefault();
    const taskIdStr = event.dataTransfer?.getData('text/plain') || this.draggedTaskId()?.toString();
    if (!taskIdStr) return;

    const taskId = Number(taskIdStr);
    
    let status = 'Todo';
    if (targetStage === 'inprogress') status = 'InProgress';
    else if (targetStage === 'review') status = 'Review';
    else if (targetStage === 'done') status = 'Done';

    this.taskService.updateTaskStatus(taskId, status).subscribe({
      next: (res) => {
        if (res && res.success) {
          const stageName = this.stages.find(s => s.key === targetStage)?.name || '';
          this.toastService.success(
            this.i18n.isRtl() ? `تم نقل المهمة بنجاح إلى [${stageName}]` : `Task status updated to [${stageName}]`,
            this.i18n.isRtl() ? 'تحديث حالة المهمة' : 'Task Board'
          );
          this.loadTasks();
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'فشل تحديث حالة المهمة');
      }
    });

    this.onDragEnd();
  }

  openModal(stageKey?: 'todo' | 'inprogress' | 'review' | 'done') {
    if (stageKey) {
      this.newStage = stageKey;
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  addTask() {
    if (!this.newTitle || !this.newDesc) {
      this.toastService.warning('يرجى ملء عنوان وتفاصيل المهمة لإتمام الإسناد', 'بيانات غير مكتملة');
      return;
    }

    if (!this.newAssignee || !this.newAssignee.id) {
      this.toastService.warning('يرجى اختيار الموظف المسند إليه المهمة', 'بيانات غير مكتملة');
      return;
    }

    let status = 'Todo';
    if (this.newStage === 'inprogress') status = 'InProgress';
    else if (this.newStage === 'review') status = 'Review';
    else if (this.newStage === 'done') status = 'Done';

    const payload = {
      title: this.newTitle,
      description: this.newDesc,
      assignedUserId: this.newAssignee.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: status
    };

    this.taskService.createTask(payload).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success(`تم إسناد المهمة "${this.newTitle}" بنجاح إلى ${this.newAssignee?.fullName}`, 'إسناد مهمة جديدة');
          this.loadTasks();
          this.closeModal();
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'فشل إضافة المهمة');
      }
    });
  }

  getRoleAvatarClass(role: string): string {
    if (!role) return 'avatar-employee';
    const formatted = role.replace(/\s+/g, '').toLowerCase();
    return `avatar-${formatted}`;
  }

  private translateRole(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'owner': return 'مالك الشركة';
      case 'accountant': return 'محاسب';
      case 'salesmanager': return 'مدير مبيعات';
      case 'sales': return 'مندوب مبيعات';
      case 'employeemanager': return 'مدير الموظفين (HR)';
      case 'employee': return 'موظف';
      case 'hr': return 'موارد بشرية';
      default: return roleName || 'موظف';
    }
  }

  private getInitials(name: string): string {
    if (!name) return 'مظ';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name[0] || 'مظ';
  }

  private resetForm() {
    this.newTitle = '';
    this.newDesc = '';
    if (this.assignees.length > 0) {
      this.newAssignee = this.assignees[0];
    }
    this.newPriority = 'medium';
    this.newStage = 'todo';
  }
}
