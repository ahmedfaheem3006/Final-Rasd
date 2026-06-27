import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  user = signal({
    name: 'فهد بن عبد الله المطيري',
    email: 'fahad.mutairi@rasd.sa',
    phone: '+966 55 123 4567',
    role: 'مندوب مبيعات',
    department: 'قسم المبيعات',
    joinDate: '10 يناير 2026',
    employeeId: 'EMP-0042',
    manager: 'أحمد المطيري',
    avatar: 'FM',
    address: 'الرياض، المملكة العربية السعودية',
    nationalId: '1098XXXXXX'
  });

  performanceStats = signal([
    { label: 'المهام المكتملة', value: '47', icon: 'tasks' },
    { label: 'نسبة الإنجاز', value: '92%', icon: 'progress' },
    { label: 'أيام الحضور', value: '142', icon: 'attendance' },
    { label: 'تقييم الأداء', value: '4.7/5', icon: 'rating' }
  ]);

  recentActivity = signal([
    { action: 'أكمل مهمة: إعداد تقرير المبيعات', date: '14 يونيو 2026', type: 'task' },
    { action: 'سجل حضور الساعة 08:15 ص', date: '15 يونيو 2026', type: 'attendance' },
    { action: 'قدم طلب إجازة سنوية', date: '13 يونيو 2026', type: 'leave' },
    { action: 'أضاف عميل جديد: شركة الحلول', date: '12 يونيو 2026', type: 'client' },
    { action: 'حضر اجتماع فريق المبيعات', date: '11 يونيو 2026', type: 'meeting' },
  ]);
}
