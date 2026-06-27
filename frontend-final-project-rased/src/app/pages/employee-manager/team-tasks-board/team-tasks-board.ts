import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  getTasksByStage(stageKey: string) {
    return this.tasks().filter(t => t.stage === stageKey);
  }

  moveTask(taskId: number, direction: 'forward' | 'backward') {
    const stageOrder: ('todo' | 'inprogress' | 'review' | 'done')[] = ['todo', 'inprogress', 'review', 'done'];

    this.tasks.update(prev => 
      prev.map(t => {
        if (t.id === taskId) {
          const currentIndex = stageOrder.indexOf(t.stage);
          let newIndex = currentIndex;
          if (direction === 'forward' && currentIndex < stageOrder.length - 1) {
            newIndex++;
          } else if (direction === 'backward' && currentIndex > 0) {
            newIndex--;
          }
          return { ...t, stage: stageOrder[newIndex] };
        }
        return t;
      })
    );
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
      alert('يرجى ملء جميع الحقول المطلوبة');
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

