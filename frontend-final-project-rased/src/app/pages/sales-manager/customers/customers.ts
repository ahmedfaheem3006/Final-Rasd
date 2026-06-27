import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrmService } from '../../../services/crm.service';

@Component({
  selector: 'app-customers',
  imports: [CommonModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css'
})
export class Customers implements OnInit {
  private crmService = inject(CrmService);

  activeFilter = signal('all');
  customers = signal<any[]>([]);

  filteredCustomers = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.customers();
    return this.customers().filter(c => c.status === f);
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.crmService.getClients().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const apiClients = res.data;
          this.customers.set(apiClients.map((c: any) => ({
            company: c.name,
            contact: c.name,
            email: c.email || 'لا يوجد بريد',
            lastDeal: 'مستمر',
            rep: c.createdByName || 'المسؤول',
            repAvatar: c.createdByName ? c.createdByName.slice(0, 2) : 'مس',
            status: 'active',
            lastContact: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'مؤخراً'
          })));
        }
      },
      error: (err) => console.error('Failed to load customers', err)
    });
  }

  setFilter(f: string) { this.activeFilter.set(f); }
}
