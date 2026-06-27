import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SalesTask {
  id: number;
  text: string;
  client: string;
  dueDate: string;
  completed: boolean;
  type: 'call' | 'proposal' | 'meeting' | 'followup';
}

@Component({
  selector: 'app-sales-tasks',
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-tasks.html',
  styleUrl: './sales-tasks.css'
})
export class SalesTasks {
  tasks = signal<SalesTask[]>([
    { id: 1, text: 'الاتصال بمجموعة التكامل للاتفاق على الموعد', client: 'مجموعة التكامل التقني', dueDate: '2026-06-16', completed: false, type: 'call' },
    { id: 2, text: 'إعداد وثيقة العرض المالي والفني للبرنامج المشترك', client: 'شركة الأمل للاستشارات', dueDate: '2026-06-18', completed: false, type: 'proposal' },
    { id: 3, text: 'اجتماع مناقشة بنود العقد عبر زووم', client: 'سعودي كورب للخدمات', dueDate: '2026-06-15', completed: true, type: 'meeting' },
    { id: 4, text: 'إرسال التعديلات المقترحة للبريد المالي للشركة', client: 'الشركة الوطنية للحلول', dueDate: '2026-06-17', completed: false, type: 'followup' }
  ]);

  filterTab = signal<'all' | 'pending' | 'completed'>('all');
  isModalOpen = signal(false);

  // Form fields
  newText = '';
  newClient = '';
  newDueDate = '';
  newType: 'call' | 'proposal' | 'meeting' | 'followup' = 'call';

  filteredTasks = computed(() => {
    const tab = this.filterTab();
    const list = this.tasks();

    if (tab === 'pending') {
      return list.filter(t => !t.completed);
    } else if (tab === 'completed') {
      return list.filter(t => t.completed);
    }
    return list;
  });

  toggleTask(taskId: number) {
    this.tasks.update(prev => 
      prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
  }

  deleteTask(taskId: number) {
    this.tasks.update(prev => prev.filter(t => t.id !== taskId));
  }

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  addTask() {
    if (!this.newText || !this.newClient) {
      alert('يرجى ملء الحقول المطلوبة');
      return;
    }

    const newTask: SalesTask = {
      id: Date.now(),
      text: this.newText,
      client: this.newClient,
      dueDate: this.newDueDate || new Date().toISOString().split('T')[0],
      completed: false,
      type: this.newType
    };

    this.tasks.update(prev => [newTask, ...prev]);
    this.closeModal();
  }

  private resetForm() {
    this.newText = '';
    this.newClient = '';
    this.newDueDate = '';
    this.newType = 'call';
  }
}

