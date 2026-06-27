import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'leave' | 'absent';
  attendanceRate: number;
  joinDate: string;
  avatar: string;
}

@Component({
  selector: 'app-team-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './team-management.html',
  styleUrl: './team-management.css'
})
export class TeamManagement {
  employees = signal<Employee[]>([
    { id: 1, name: 'فهد المطيري', role: 'مندوب مبيعات شرفي', email: 'fahad@company.sa', status: 'active', attendanceRate: 98, joinDate: '2026-01-10', avatar: 'فم' },
    { id: 2, name: 'نورة السعيد', role: 'مندوب مبيعات ميداني', email: 'noura@company.sa', status: 'active', attendanceRate: 95, joinDate: '2026-06-12', avatar: 'نس' },
    { id: 3, name: 'رنا علي', role: 'مندوب مبيعات أول', email: 'sales@rasd.com', status: 'active', attendanceRate: 96, joinDate: '2026-02-15', avatar: 'رع' },
    { id: 4, name: 'يوسف حسن', role: 'موظف دعم فني', email: 'employee@rasd.com', status: 'leave', attendanceRate: 92, joinDate: '2025-11-20', avatar: 'يح' },
    { id: 5, name: 'خالد الدوسري', role: 'أخصائي تطوير أعمال', email: 'khalid@company.sa', status: 'active', attendanceRate: 97, joinDate: '2026-05-01', avatar: 'خد' }
  ]);

  isModalOpen = signal(false);

  // Form Fields
  newName = '';
  newRole = 'مندوب مبيعات';
  newEmail = '';
  newStatus: 'active' | 'leave' | 'absent' = 'active';
  newAttendance = 100;

  totalCount = computed(() => this.employees().length);
  activeCount = computed(() => this.employees().filter(e => e.status === 'active').length);
  leaveCount = computed(() => this.employees().filter(e => e.status === 'leave').length);

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  addEmployee() {
    if (!this.newName || !this.newEmail) {
      alert('يرجى كتابة الاسم والبريد الإلكتروني');
      return;
    }

    const initials = this.newName.split(' ').map(n => n[0]).join('').slice(0, 2);

    const newEmp: Employee = {
      id: Date.now(),
      name: this.newName,
      role: this.newRole,
      email: this.newEmail,
      status: this.newStatus,
      attendanceRate: this.newAttendance || 100,
      joinDate: new Date().toISOString().split('T')[0],
      avatar: initials || 'مظ'
    };

    this.employees.update(prev => [newEmp, ...prev]);
    this.closeModal();
  }

  private resetForm() {
    this.newName = '';
    this.newRole = 'مندوب مبيعات';
    this.newEmail = '';
    this.newStatus = 'active';
    this.newAttendance = 100;
  }
}

