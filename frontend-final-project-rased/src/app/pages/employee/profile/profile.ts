import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  user = signal<any>({
    name: 'جاري التحميل...',
    email: '',
    phone: '+966 55 123 4567',
    role: 'موظف',
    department: 'قسم العمليات',
    joinDate: '10 يناير 2026',
    employeeId: 'EMP-0000',
    manager: 'عمر فاروق',
    avatar: 'مظ',
    address: 'الرياض، المملكة العربية السعودية',
    nationalId: '1098XXXXXX'
  });

  performanceStats = signal([
    { label: 'المهام المكتملة', value: '12', icon: 'tasks' },
    { label: 'نسبة الإنجاز', value: '94%', icon: 'progress' },
    { label: 'أيام الحضور', value: '22', icon: 'attendance' },
    { label: 'تقييم الأداء', value: '4.8/5', icon: 'rating' }
  ]);

  recentActivity = signal([
    { action: 'سجل حضور اليوم في النظام الساعة 08:15 ص', date: 'اليوم', type: 'attendance' },
    { action: 'أكمل مهمة: مراجعة العقود السنوية', date: 'أمس', type: 'task' },
    { action: 'حضر اجتماع الفريق الأسبوعي', date: 'قبل يومين', type: 'meeting' }
  ]);

  // Modal fields
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editPhone = '';
  editAddress = '';
  editNationalId = '';
  editCurrentPassword = '';
  editNewPassword = '';

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    const sessionUser = this.authService.currentUser();
    if (!sessionUser) return;

    // Load local stored profile details if any
    const savedExt = localStorage.getItem(`rasd_profile_ext_${sessionUser.email}`);
    let localPhone = '+966 55 123 4567';
    let localAddress = 'الرياض، المملكة العربية السعودية';
    let localNationalId = '1098XXXXXX';
    if (savedExt) {
      try {
        const parsed = JSON.parse(savedExt);
        localPhone = parsed.phone || localPhone;
        localAddress = parsed.address || localAddress;
        localNationalId = parsed.nationalId || localNationalId;
      } catch {}
    }

    this.user.set({
      name: sessionUser.name,
      email: sessionUser.email,
      phone: localPhone,
      role: sessionUser.roleLabel || 'موظف العمليات',
      department: sessionUser.workspaceName || 'إدارة العمليات',
      joinDate: '10 يناير 2026',
      employeeId: sessionUser.id ? `EMP-00${sessionUser.id}` : `EMP-${1000 + Math.floor(Math.random() * 9000)}`,
      manager: 'عمر فاروق',
      avatar: sessionUser.avatarInitials || 'مظ',
      address: localAddress,
      nationalId: localNationalId
    });

    // Fetch from database users list if possible (only for privileged roles to avoid 403 Forbidden)
    const isPrivileged = ['owner-admin', 'system-admin', 'employee-manager', 'hr'].includes(sessionUser.role);
    if (isPrivileged) {
      this.authService.getUsers().subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            const dbUser = res.data.find((u: any) => u.email?.toLowerCase() === sessionUser.email?.toLowerCase());
            if (dbUser) {
              this.user.update(prev => ({
                ...prev,
                name: dbUser.fullName,
                email: dbUser.email,
                role: this.translateRole(dbUser.roleName),
                employeeId: `EMP-00${dbUser.id}`
              }));
            }
          }
        },
        error: (err) => console.error('Failed to load DB profile details', err)
      });
    }
  }

  openModal() {
    this.editPhone = this.user().phone;
    this.editAddress = this.user().address;
    this.editNationalId = this.user().nationalId;
    this.editCurrentPassword = '';
    this.editNewPassword = '';
    this.isSubmitting.set(false);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveProfile() {
    this.isSubmitting.set(true);
    const sessionUser = this.authService.currentUser();
    if (!sessionUser) {
      this.toastService.error('بيانات الجلسة غير متوفرة', 'خطأ');
      this.isSubmitting.set(false);
      return;
    }

    // Save local details in localStorage
    const localData = {
      phone: this.editPhone,
      address: this.editAddress,
      nationalId: this.editNationalId
    };
    localStorage.setItem(`rasd_profile_ext_${sessionUser.email}`, JSON.stringify(localData));

    // Update user state signal
    this.user.update(prev => ({
      ...prev,
      phone: this.editPhone,
      address: this.editAddress,
      nationalId: this.editNationalId
    }));

    // If password fields are filled, perform password change on backend
    if (this.editCurrentPassword && this.editNewPassword) {
      this.authService.changePassword(this.editCurrentPassword, this.editNewPassword).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res && res.success) {
            this.toastService.success('تم تحديث البيانات وتغيير كلمة المرور بنجاح', 'تعديل الملف الشخصي');
            this.closeModal();
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(err.error?.message || 'فشل تغيير كلمة المرور، يرجى التحقق من كلمة المرور الحالية', 'خطأ');
        }
      });
    } else {
      this.isSubmitting.set(false);
      this.toastService.success('تم تحديث البيانات الشخصية بنجاح', 'تعديل الملف الشخصي');
      this.closeModal();
    }
  }

  private translateRole(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'owner': return 'مالك الشركة';
      case 'accountant': return 'المحاسب المالي';
      case 'salesmanager': return 'مدير المبيعات';
      case 'sales': return 'مندوب مبيعات';
      case 'employeemanager': return 'مدير الموظفين (HR)';
      case 'employee': return 'موظف العمليات';
      case 'hr': return 'موارد بشرية';
      default: return roleName || 'موظف';
    }
  }
}
