import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Task {
  id: number;
  text: string;
  client: string;
  repName: string;
  dueDate: string;
  type: 'call' | 'proposal' | 'meeting' | 'followup';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class SalesManagerTasks {
  filterTab = signal<'all' | 'pending' | 'completed'>('all');
  selectedRepFilter = signal<string>('all');

  reps = signal([
    { name: 'فهد المطيري' },
    { name: 'نورة السعيد' },
    { name: 'خالد الدوسري' },
    { name: 'منى العسيري' },
    { name: 'ريم الجهني' }
  ]);

  tasks = signal<Task[]>([
    { id: 1, text: 'متابعة العرض المالي الجديد لشركة التكامل التقني', client: 'مجموعة التكامل التقني', repName: 'فهد المطيري', dueDate: '2026-06-16', type: 'proposal', priority: 'high', completed: false },
    { id: 2, text: 'جدولة مكالمة تفاوض لشروط عقد الخدمات الفنية', client: 'سعودي كورب للخدمات', repName: 'خالد الدوسري', dueDate: '2026-06-17', type: 'call', priority: 'high', completed: false },
    { id: 3, text: 'إعداد عرض السعر الاستشاري النهائي للشركة', client: 'شركة الأمل للاستشارات', repName: 'نورة السعيد', dueDate: '2026-06-18', type: 'proposal', priority: 'medium', completed: true },
    { id: 4, text: 'اجتماع ربع سنوي مراجعة الأداء والاحتياجات', client: 'منظومة الأعمال الذكية', repName: 'منى العسيري', dueDate: '2026-06-19', type: 'meeting', priority: 'medium', completed: false },
    { id: 5, text: 'مكالمة ترحيبية للتعريف بالخدمات والعروض المتوفرة', client: 'ريم للتقنية', repName: 'ريم الجهني', dueDate: '2026-06-20', type: 'call', priority: 'low', completed: false },
  ]);

  // Modal control
  isModalOpen = signal(false);
  newText = '';
  newClient = '';
  newRepName = 'فهد المطيري';
  newType: 'call' | 'proposal' | 'meeting' | 'followup' = 'call';
  newPriority: 'high' | 'medium' | 'low' = 'medium';
  newDueDate = '';

  filteredTasks = computed(() => {
    let list = this.tasks();

    // Filter by tab
    const tab = this.filterTab();
    if (tab === 'pending') {
      list = list.filter(t => !t.completed);
    } else if (tab === 'completed') {
      list = list.filter(t => t.completed);
    }

    // Filter by rep
    const rep = this.selectedRepFilter();
    if (rep !== 'all') {
      list = list.filter(t => t.repName === rep);
    }

    return list;
  });

  // Stats computed values
  stats = computed(() => {
    const all = this.tasks();
    const total = all.length;
    const completed = all.filter(t => t.completed).length;
    const pending = total - completed;
    const highPriority = all.filter(t => t.priority === 'high' && !t.completed).length;

    return { total, completed, pending, highPriority };
  });

  toggleTask(id: number) {
    this.tasks.update(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  deleteTask(id: number) {
    this.tasks.update(prev => prev.filter(t => t.id !== id));
  }

  openModal() {
    this.newText = '';
    this.newClient = '';
    this.newRepName = this.reps()[0]?.name || '';
    this.newType = 'call';
    this.newPriority = 'medium';
    this.newDueDate = new Date().toISOString().split('T')[0];
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  addTask() {
    if (!this.newText.trim() || !this.newClient.trim()) {
      alert('الرجاء إدخال تفاصيل المهمة والعميل.');
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      text: this.newText,
      client: this.newClient,
      repName: this.newRepName,
      dueDate: this.newDueDate || new Date().toISOString().split('T')[0],
      type: this.newType,
      priority: this.newPriority,
      completed: false
    };

    this.tasks.update(prev => [newTask, ...prev]);
    this.closeModal();
  }
}
