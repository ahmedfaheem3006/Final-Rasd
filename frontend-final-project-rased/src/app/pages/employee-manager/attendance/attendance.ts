import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../services/toast.service';

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
export class EmployeeManagerAttendance implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  selectedDate = signal('2026-06-15');
  activeFilter = signal<'all' | 'present' | 'late' | 'absent' | 'remote'>('all');
  loading = signal(false);

  allRecords = signal<AttendanceRecord[]>([]);

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

  ngOnInit() {
    this.loadAttendanceForDate(this.selectedDate());
  }

  onDateChange(newDate: string) {
    this.selectedDate.set(newDate);
    this.loadAttendanceForDate(newDate);
  }

  loadAttendanceForDate(date: string) {
    this.loading.set(true);
    this.http.get<any>(`http://localhost:5292/api/Attendances?date=${date}`).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.success && res.data) {
          this.allRecords.set(res.data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load attendance records', err);
        this.toastService.error('فشل تحميل سجلات الحضور');
      }
    });
  }

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

  exportReport() {
    // Generate CSV content
    const headers = ['الموظف', 'الدور الوظيفي', 'الحالة', 'وقت الدخول', 'وقت الخروج', 'ساعات العمل', 'ملاحظة'];
    
    const rows = this.filteredRecords().map(rec => {
      const statusLabel = this.getStatusLabel(rec.status);
      let remark = 'في الوقت المحدد';
      if (rec.status === 'late') remark = 'تأخير عن الدوام';
      else if (rec.status === 'absent') remark = 'بدون إذن مسبق';
      else if (rec.status === 'remote') remark = 'يعمل من المنزل';

      return [
        rec.employee,
        rec.role,
        statusLabel,
        rec.checkIn,
        rec.checkOut,
        rec.hoursWorked !== '0' ? `${rec.hoursWorked} ساعة` : '—',
        remark
      ];
    });

    // Add UTF-8 BOM so Excel opens it with Arabic characters correctly
    let csvContent = '\uFEFF'; 
    csvContent += [headers.join(','), ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_الحضور_${this.selectedDate()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success('تم تصدير تقرير الحضور بنجاح بصيغة CSV', 'تصدير التقرير');
  }
}
