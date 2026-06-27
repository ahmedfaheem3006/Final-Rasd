import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

interface TeamTask {
  id: number;
  title: string;
  desc: string;
  assignee: string;
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
export class TeamTasksBoard {
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);
  tasks = signal<TeamTask[]>([
    { id: 1, title: 'تحديث عقود الموظفين الجدد', desc: 'مراجعة وتعديل عقود العمل بما يتناسب مع نظام العمل لعام 2026.', assignee: 'سارة القحطاني', priority: 'high', stage: 'todo', date: '2026-06-20' },
    { id: 2, title: 'تصميم هيكل الحوافز الجديد', desc: 'إعداد مقترح لهيكل العمولات والحوافز لفريق المبيعات.', assignee: 'فهد المطيري', priority: 'medium', stage: 'inprogress', date: '2026-06-22' },
    { id: 3, title: 'إعداد تقرير الحضور الشهري', desc: 'تجميع بيانات البصمة وإعداد التقرير المالي للرواتب.', assignee: 'يوسف حسن', priority: 'high', stage: 'review', date: '2026-06-15' },
    { id: 4, title: 'حجز قاعة تدريب وتجهيز الحقائب', desc: 'ترتيبات الدورة التدريبية القادمة لخدمة العملاء.', assignee: 'خالد الدوسري', priority: 'low', stage: 'done', date: '2026-06-12' }
  ]);

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
  newAssignee = 'فهد المطيري';
  newPriority: 'high' | 'medium' | 'low' = 'medium';
  newStage: 'todo' | 'inprogress' | 'review' | 'done' = 'todo';

  // Drag and drop states
  draggedTaskId = signal<number | null>(null);
  draggedOverColumn = signal<string | null>(null);

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
    let taskName = '';

    this.tasks.update(prev => 
      prev.map(t => {
        if (t.id === taskId) {
          taskName = t.title;
          return { ...t, stage: targetStage };
        }
        return t;
      })
    );

    if (taskName) {
      const stageName = this.stages.find(s => s.key === targetStage)?.name || '';
      const successMsg = this.i18n.isRtl()
        ? `تم نقل المهمة "${taskName}" بنجاح إلى [${stageName}]`
        : `Task "${taskName}" moved to [${stageName}]`;
      this.toastService.success(successMsg, this.i18n.isRtl() ? 'تحديث حالة المهمة' : 'Task Board');
    }

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

    const newTask: TeamTask = {
      id: Date.now(),
      title: this.newTitle,
      desc: this.newDesc,
      assignee: this.newAssignee,
      priority: this.newPriority,
      stage: this.newStage,
      date: new Date().toISOString().split('T')[0]
    };

    this.tasks.update(prev => [...prev, newTask]);
    this.toastService.success(`تم إسناد المهمة "${newTask.title}" بنجاح إلى ${newTask.assignee}`, 'إسناد مهمة جديدة');
    this.closeModal();
  }

  private resetForm() {
    this.newTitle = '';
    this.newDesc = '';
    this.newAssignee = 'فهد المطيري';
    this.newPriority = 'medium';
    this.newStage = 'todo';
  }
}

