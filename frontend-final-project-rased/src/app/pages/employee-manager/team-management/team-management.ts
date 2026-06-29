import { Component, signal, computed, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-team-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './team-management.html',
  styleUrl: './team-management.css'
})
export class TeamManagement implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  i18n = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);

  employees = signal<any[]>([]);
  loading = signal(true);
  isModalOpen = signal(false);
  isSubmitting = signal(false);

  // Form Fields
  newName = '';
  newEmail = '';
  newPassword = '123456';
  newRoleId = 7; // Employee role by default

  roles = [
    { id: 7, nameAr: 'موظف', nameEn: 'Employee' },
    { id: 5, nameAr: 'مندوب مبيعات', nameEn: 'Sales Rep' },
    { id: 4, nameAr: 'مدير مبيعات', nameEn: 'Sales Manager' },
    { id: 3, nameAr: 'محاسب', nameEn: 'Accountant' },
  ];

  totalCount = computed(() => this.employees().length);
  activeCount = computed(() => this.employees().filter(e => e.status === 'Active' || e.status === 'active').length);
  leaveCount = computed(() => this.employees().filter(e => e.status === 'OnLeave' || e.status === 'leave').length);

  ngOnInit() {
    this.loadEmployees();
  }

  private loadEmployees() {
    this.loading.set(true);
    this.authService.getUsers().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.success && res.data) {
          this.employees.set(res.data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load employees', err);
      }
    });
  }

  getAvatar(name: string): string {
    if (!name) return 'مظ';
    const parts = name.trim().split(/\s+/);
    return parts.map((p: string) => p[0]).join('').toUpperCase().substring(0, 2);
  }

  translateRole(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'owner': return this.i18n.isRtl() ? 'مالك النظام' : 'Owner';
      case 'accountant': return this.i18n.isRtl() ? 'محاسب' : 'Accountant';
      case 'salesmanager': return this.i18n.isRtl() ? 'مدير مبيعات' : 'Sales Manager';
      case 'sales': return this.i18n.isRtl() ? 'مندوب مبيعات' : 'Sales Rep';
      case 'employeemanager': return this.i18n.isRtl() ? 'مدير الموظفين' : 'Employee Manager';
      case 'employee': return this.i18n.isRtl() ? 'موظف' : 'Employee';
      case 'hr': return this.i18n.isRtl() ? 'موارد بشرية' : 'HR';
      default: return roleName || (this.i18n.isRtl() ? 'موظف' : 'Employee');
    }
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'Active': case 'active': return this.i18n.isRtl() ? 'على رأس العمل' : 'Active';
      case 'OnLeave': case 'leave': return this.i18n.isRtl() ? 'في إجازة' : 'On Leave';
      case 'Inactive': case 'absent': return this.i18n.isRtl() ? 'غير نشط' : 'Inactive';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': case 'active': return 'badge-success';
      case 'OnLeave': case 'leave': return 'badge-warning';
      case 'Inactive': case 'absent': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  openModal() {
    console.log('openModal called');
    this.resetForm();
    this.isModalOpen.set(true);
    this.cdr.detectChanges();
  }

  closeModal() {
    console.log('closeModal called');
    this.isModalOpen.set(false);
    this.resetForm();
    this.cdr.detectChanges();
  }

  addEmployee() {
    if (!this.newName || !this.newEmail) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'يرجى كتابة الاسم والبريد الإلكتروني' : 'Please enter name and email'
      );
      return;
    }

    this.isSubmitting.set(true);

    const dto = {
      fullName: this.newName,
      email: this.newEmail,
      password: this.newPassword || '123456',
      roleId: this.newRoleId
    };

    this.authService.registerUser(dto).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.success) {
          this.toastService.success(
            this.i18n.isRtl() ? `تم تسجيل الموظف "${this.newName}" بنجاح` : `Employee "${this.newName}" registered successfully`,
            this.i18n.isRtl() ? 'تسجيل موظف' : 'Register Employee'
          );
          this.loadEmployees();
          this.closeModal();
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || (this.i18n.isRtl() ? 'فشل تسجيل الموظف' : 'Failed to register employee');
        this.toastService.error(msg);
      }
    });
  }

  private resetForm() {
    this.newName = '';
    this.newEmail = '';
    this.newPassword = '123456';
    this.newRoleId = 7;
    this.isSubmitting.set(false);
  }
}
