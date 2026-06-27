import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-attendance',
  imports: [CommonModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class EmployeeAttendance {
  stats = signal([
    { title: 'أيام الحضور', value: '22', color: 'success' },
    { title: 'أيام الغياب', value: '1', color: 'danger' },
    { title: 'التأخيرات', value: '3', color: 'warning' },
    { title: 'ساعات العمل الإضافي', value: '12', color: 'info' }
  ]);

  todayStatus = signal({ checkedIn: true, checkInTime: '08:15 ص', checkOutTime: '--:--', status: 'present', totalHours: '5:30' });

  records = signal([
    { date: '15 يونيو 2026', day: 'الأحد', checkIn: '08:15 ص', checkOut: '--:--', hours: '5:30', status: 'present' },
    { date: '14 يونيو 2026', day: 'السبت', checkIn: '08:02 ص', checkOut: '04:05 م', hours: '8:03', status: 'present' },
    { date: '13 يونيو 2026', day: 'الجمعة', checkIn: '--', checkOut: '--', hours: '--', status: 'weekend' },
    { date: '12 يونيو 2026', day: 'الخميس', checkIn: '08:45 ص', checkOut: '04:00 م', hours: '7:15', status: 'late' },
    { date: '11 يونيو 2026', day: 'الأربعاء', checkIn: '07:58 ص', checkOut: '04:30 م', hours: '8:32', status: 'present' },
    { date: '10 يونيو 2026', day: 'الثلاثاء', checkIn: '08:00 ص', checkOut: '06:15 م', hours: '10:15', status: 'overtime' },
    { date: '9 يونيو 2026', day: 'الاثنين', checkIn: '--', checkOut: '--', hours: '--', status: 'absent' },
    { date: '8 يونيو 2026', day: 'الأحد', checkIn: '08:10 ص', checkOut: '04:00 م', hours: '7:50', status: 'present' },
  ]);
}
