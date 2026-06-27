import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AttendanceRecord {
  id: number;
  employee: string;
  avatar: string;
  role: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'late' | 'absent' | 'remote';
  hoursWorked: string;
  date: string;
}

interface AttendanceStat {
  label: string;
  value: number | string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-employee-manager-attendance',
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class EmployeeManagerAttendance {

  selectedDate = signal('2026-06-15');
  activeFilter = signal<'all' | 'present' | 'late' | 'absent' | 'remote'>('all');

  allRecords = signal<AttendanceRecord[]>([
    { id: 1, employee: 'فهد المطيري', avatar: 'FM', role: 'مندوب مبيعات', checkIn: '8:02 ص', checkOut: '5:15 م', status: 'present', hoursWorked: '9.2', date: '2026-06-15' },
    { id: 2, employee: 'سارة القحطاني', avatar: 'SQ', role: 'مدير الموارد البشرية', checkIn: '8:55 ص', checkOut: '6:00 م', status: 'late', hoursWorked: '9.1', date: '2026-06-15' },
    { id: 3, employee: 'خالد الدوسري', avatar: 'KD', role: 'موظف تنفيذي', checkIn: '—', checkOut: '—', status: 'absent', hoursWorked: '0', date: '2026-06-15' },
    { id: 4, employee: 'نورة السعيد', avatar: 'NS', role: 'مندوب مبيعات', checkIn: '7:58 ص', checkOut: '5:00 م', status: 'present', hoursWorked: '9.0', date: '2026-06-15' },
    { id: 5, employee: 'عبد الله العتيبي', avatar: 'AA', role: 'محاسب', checkIn: '9:00 ص', checkOut: '5:00 م', status: 'remote', hoursWorked: '8.0', date: '2026-06-15' },
    { id: 6, employee: 'يوسف حسن', avatar: 'YH', role: 'مسؤول مالي', checkIn: '7:45 ص', checkOut: '4:45 م', status: 'present', hoursWorked: '9.0', date: '2026-06-15' },
    { id: 7, employee: 'ريم العمري', avatar: 'RA', role: 'موظف خدمة عملاء', checkIn: '8:10 ص', checkOut: '5:10 م', status: 'present', hoursWorked: '9.0', date: '2026-06-15' },
    { id: 8, employee: 'أحمد البارقي', avatar: 'AB', role: 'مندوب مبيعات', checkIn: '9:32 ص', checkOut: '5:30 م', status: 'late', hoursWorked: '7.9', date: '2026-06-15' },
  ]);

  filteredRecords = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.allRecords();
    return this.allRecords().filter(r => r.status === f);
  });

  stats = computed((): AttendanceStat[] => {
    const all = this.allRecords();
    const total = all.length;
    const present = all.filter(r => r.status === 'present').length;
    const late = all.filter(r => r.status === 'late').length;
    const absent = all.filter(r => r.status === 'absent').length;
    const remote = all.filter(r => r.status === 'remote').length;
    const rate = total > 0 ? Math.round(((present + late + remote) / total) * 100) : 0;
    return [
      { label: 'نسبة الحضور', value: `${rate}%`, color: 'primary', icon: 'chart' },
      { label: 'حاضرون', value: present, color: 'success', icon: 'check' },
      { label: 'متأخرون', value: late, color: 'warning', icon: 'clock' },
      { label: 'غائبون', value: absent, color: 'danger', icon: 'x' },
      { label: 'عمل عن بُعد', value: remote, color: 'info', icon: 'remote' },
    ];
  });

  // Weekly summary data (mock)
  weeklyData = [
    { day: 'الأحد', rate: 87 },
    { day: 'الاثنين', rate: 100 },
    { day: 'الثلاثاء', rate: 75 },
    { day: 'الأربعاء', rate: 87 },
    { day: 'الخميس', rate: 62 },
  ];

  setFilter(f: 'all' | 'present' | 'late' | 'absent' | 'remote') {
    this.activeFilter.set(f);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      present: 'حاضر', late: 'متأخر', absent: 'غائب', remote: 'عن بُعد'
    };
    return map[status] || status;
  }

  getBarHeight(rate: number): string {
    return `${Math.round((rate / 100) * 120)}px`;
  }
}
