import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';

interface Task {
  id: number;
  title: string;
  assignedUserId: number | null;
  assignedUserName: string;
  status: 'Todo' | 'InProgress' | 'Done';
  dueDate: string;
  createdAt: string;
}

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class SalesManagerTasks implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  filterTab = signal<'all' | 'pending' | 'completed'>('all');
  selectedRepFilter = signal<string>('all');
  isLoading = signal(true);

  tasks = signal<Task[]>([]);
  users = signal<{ id: number; fullName: string }[]>([]);

  // Modal state
  isModalOpen = signal(false);
  isSaving = signal(false);
  newTitle = '';
  newAssignedUserId: number | null = null;
  newStatus: 'Todo' | 'InProgress' | 'Done' = 'Todo';
  newDueDate = '';

  filteredTasks = computed(() => {
    let list = this.tasks();
    const tab = this.filterTab();
    if (tab === 'pending') list = list.filter(t => t.status !== 'Done');
    else if (tab === 'completed') list = list.filter(t => t.status === 'Done');

    const rep = this.selectedRepFilter();
    if (rep !== 'all') list = list.filter(t => t.assignedUserName === rep);

    return list;
  });

  stats = computed(() => {
    const all = this.tasks();
    const today = new Date().toISOString().split('T')[0];
    return {
      total: all.length,
      completed: all.filter(t => t.status === 'Done').length,
      pending: all.filter(t => t.status !== 'Done').length,
      overdue: all.filter(t => t.status !== 'Done' && t.dueDate < today).length
    };
  });

  uniqueReps = computed(() => {
    const names = [...new Set(this.tasks().map(t => t.assignedUserName).filter(Boolean))];
    return names;
  });

  ngOnInit() {
    this.loadTasks();
    this.loadUsers();
  }

  loadTasks() {
    this.isLoading.set(true);
    this.taskService.getTasks().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.tasks.set(res.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            assignedUserId: t.assignedUserId,
            assignedUserName: t.assignedUserName || 'غير محدد',
            status: t.status as 'Todo' | 'InProgress' | 'Done',
            dueDate: t.dueDate?.split('T')[0] ?? '',
            createdAt: t.createdAt
          })));
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users.set(res.data.map((u: any) => ({ id: u.id, fullName: u.fullName })));
        }
      }
    });
  }

  updateStatus(id: number, status: string) {
    this.taskService.updateTaskStatus(id, status).subscribe({
      next: () => {
        this.tasks.update(prev =>
          prev.map(t => t.id === id ? { ...t, status: status as 'Todo' | 'InProgress' | 'Done' } : t)
        );
      }
    });
  }

  deleteTask(id: number) {
    this.taskService.deleteTask(id).subscribe({
      next: () => this.tasks.update(prev => prev.filter(t => t.id !== id))
    });
  }

  openModal() {
    this.newTitle = '';
    this.newAssignedUserId = null;
    this.newStatus = 'Todo';
    this.newDueDate = new Date().toISOString().split('T')[0];
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  addTask() {
    if (!this.newTitle.trim() || !this.newDueDate) return;

    this.isSaving.set(true);
    this.taskService.createTask({
      title: this.newTitle.trim(),
      assignedUserId: this.newAssignedUserId ?? undefined,
      dueDate: this.newDueDate
    }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success && res.data) {
          const t = res.data;
          this.tasks.update(prev => [{
            id: t.id,
            title: t.title,
            assignedUserId: t.assignedUserId,
            assignedUserName: t.assignedUserName || 'غير محدد',
            status: t.status as 'Todo' | 'InProgress' | 'Done',
            dueDate: t.dueDate?.split('T')[0] ?? this.newDueDate,
            createdAt: t.createdAt
          }, ...prev]);
        }
        this.closeModal();
      },
      error: () => this.isSaving.set(false)
    });
  }

  statusLabel(status: string): string {
    return status === 'Done' ? 'منجز' : status === 'InProgress' ? 'قيد التنفيذ' : 'قيد الانتظار';
  }

  isOverdue(task: Task): boolean {
    if (task.status === 'Done') return false;
    return task.dueDate < new Date().toISOString().split('T')[0];
  }
}
