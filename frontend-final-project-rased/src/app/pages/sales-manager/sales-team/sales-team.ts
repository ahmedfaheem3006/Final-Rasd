import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-team',
  imports: [CommonModule],
  templateUrl: './sales-team.html',
  styleUrl: './sales-team.css'
})
export class SalesTeam {
  activeFilter = signal('all');

  reps = signal([
    { name: 'فهد المطيري', email: 'fahad@company.sa', avatar: 'FM', deals: 8, revenue: '$47,500', target: 95, closed: 6, status: 'active', joined: '10 يناير 2026' },
    { name: 'نورة السعيد', email: 'noura@company.sa', avatar: 'NS', deals: 6, revenue: '$32,200', target: 82, closed: 5, status: 'active', joined: '5 مارس 2026' },
    { name: 'خالد الدوسري', email: 'khalid@company.sa', avatar: 'KD', deals: 5, revenue: '$28,100', target: 74, closed: 3, status: 'active', joined: '18 فبراير 2026' },
    { name: 'منى العسيري', email: 'mona@company.sa', avatar: 'MA', deals: 7, revenue: '$34,500', target: 88, closed: 5, status: 'active', joined: '22 أبريل 2026' },
    { name: 'ريم الجهني', email: 'reem@company.sa', avatar: 'RJ', deals: 3, revenue: '$15,800', target: 50, closed: 2, status: 'pending', joined: '1 يونيو 2026' },
    { name: 'سلطان القرني', email: 'sultan@company.sa', avatar: 'SQ', deals: 0, revenue: '$0', target: 0, closed: 0, status: 'inactive', joined: '20 مايو 2026' },
  ]);

  filteredReps = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.reps();
    return this.reps().filter(r => r.status === f);
  });

  setFilter(f: string) { this.activeFilter.set(f); }
}
