import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-employee-attendance',
  imports: [CommonModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class EmployeeAttendance implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  stats = signal([
    { title: 'أيام الحضور', value: '22', color: 'success' },
    { title: 'أيام الغياب', value: '1', color: 'danger' },
    { title: 'التأخيرات', value: '3', color: 'warning' },
    { title: 'ساعات العمل الإضافي', value: '12', color: 'info' }
  ]);

  todayStatus = signal({ checkedIn: false, checkInTime: '--:--', checkOutTime: '--:--', status: 'absent', totalHours: '0:00' });

  // Month selector fields
  isMonthDropdownOpen = signal(false);
  selectedMonth = signal('يونيو 2026');
  months = ['مايو 2026', 'يونيو 2026', 'يوليو 2026'];

  allRecords: Record<string, any[]> = {
    'مايو 2026': [
      { date: '30 مايو 2026', day: 'السبت', checkIn: '08:00 ص', checkOut: '04:00 م', hours: '8:00', status: 'present' },
      { date: '28 مايو 2026', day: 'الخميس', checkIn: '08:15 ص', checkOut: '04:15 م', hours: '8:00', status: 'present' },
      { date: '27 مايو 2026', day: 'الأربعاء', checkIn: '08:50 ص', checkOut: '04:00 م', hours: '7:10', status: 'late' },
      { date: '26 مايو 2026', day: 'الثلاثاء', checkIn: '07:55 ص', checkOut: '04:30 م', hours: '8:35', status: 'present' },
      { date: '25 مايو 2026', day: 'الاثنين', checkIn: '08:00 ص', checkOut: '06:00 م', hours: '10:00', status: 'overtime' },
      { date: '24 مايو 2026', day: 'الأحد', checkIn: '--', checkOut: '--', hours: '--', status: 'absent' },
    ],
    'يونيو 2026': [
      { date: '15 يونيو 2026', day: 'الأحد', checkIn: '08:15 ص', checkOut: '--:--', hours: '5:30', status: 'present' },
      { date: '14 يونيو 2026', day: 'السبت', checkIn: '08:02 ص', checkOut: '04:05 م', hours: '8:03', status: 'present' },
      { date: '13 يونيو 2026', day: 'الجمعة', checkIn: '--', checkOut: '--', hours: '--', status: 'weekend' },
      { date: '12 يونيو 2026', day: 'الخميس', checkIn: '08:45 ص', checkOut: '04:00 م', hours: '7:15', status: 'late' },
      { date: '11 يونيو 2026', day: 'الأربعاء', checkIn: '07:58 ص', checkOut: '04:30 م', hours: '8:32', status: 'present' },
      { date: '10 يونيو 2026', day: 'الثلاثاء', checkIn: '08:00 ص', checkOut: '06:15 م', hours: '10:15', status: 'overtime' },
      { date: '9 يونيو 2026', day: 'الاثنين', checkIn: '--', checkOut: '--', hours: '--', status: 'absent' },
      { date: '8 يونيو 2026', day: 'الأحد', checkIn: '08:10 ص', checkOut: '04:00 م', hours: '7:50', status: 'present' },
    ],
    'يوليو 2026': [
      { date: '5 يوليو 2026', day: 'الأحد', checkIn: '08:00 ص', checkOut: '04:00 م', hours: '8:00', status: 'present' },
      { date: '4 يوليو 2026', day: 'السبت', checkIn: '07:50 ص', checkOut: '04:10 م', hours: '8:20', status: 'present' },
      { date: '2 يوليو 2026', day: 'الخميس', checkIn: '08:05 ص', checkOut: '04:00 م', hours: '7:55', status: 'present' },
      { date: '1 يوليو 2026', day: 'الأربعاء', checkIn: '08:20 ص', checkOut: '04:00 م', hours: '7:40', status: 'late' },
    ]
  };

  records = signal<any[]>(this.allRecords['يونيو 2026']);

  ngOnInit() {
    this.loadTodayStatus();
  }

  loadTodayStatus() {
    this.http.get<any>('http://localhost:5292/api/Attendances/today').subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.todayStatus.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load today status', err)
    });
  }

  performCheckIn() {
    this.http.post<any>('http://localhost:5292/api/Attendances/check-in', {}).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success(res.message || 'تم تسجيل الحضور بنجاح', 'سجل الحضور');
          this.loadTodayStatus();
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'فشل تسجيل الحضور', 'خطأ');
      }
    });
  }

  performCheckOut() {
    this.http.post<any>('http://localhost:5292/api/Attendances/check-out', {}).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success(res.message || 'تم تسجيل الانصراف بنجاح', 'سجل الانصراف');
          this.loadTodayStatus();
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'فشل تسجيل الانصراف', 'خطأ');
      }
    });
  }

  toggleMonthDropdown() {
    this.isMonthDropdownOpen.update(v => !v);
  }

  selectMonth(month: string) {
    this.selectedMonth.set(month);
    this.isMonthDropdownOpen.set(false);
    
    // Update records for chosen month
    const newRecords = this.allRecords[month] || [];
    this.records.set(newRecords);

    // Update stats dynamically based on chosen month records
    const presentCount = newRecords.filter(r => r.status === 'present' || r.status === 'overtime' || r.status === 'late').length;
    const absentCount = newRecords.filter(r => r.status === 'absent').length;
    const lateCount = newRecords.filter(r => r.status === 'late').length;
    const overtimeHours = newRecords.filter(r => r.status === 'overtime').length * 2; // dummy calc

    this.stats.set([
      { title: 'أيام الحضور', value: presentCount.toString(), color: 'success' },
      { title: 'أيام الغياب', value: absentCount.toString(), color: 'danger' },
      { title: 'التأخيرات', value: lateCount.toString(), color: 'warning' },
      { title: 'ساعات العمل الإضافي', value: overtimeHours.toString(), color: 'info' }
    ]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.isMonthDropdownOpen.set(false);
    }
  }
}
