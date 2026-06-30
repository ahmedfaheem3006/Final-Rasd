  import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientFinancialService } from '../../../services/client-financial.service';
import { InvoiceService } from '../../../services/invoice.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-customers-readonly',
  imports: [CommonModule],
  templateUrl: './customers-readonly.html',
  styleUrl: './customers-readonly.css'
})
export class CustomersReadonly implements OnInit {
  private clientService = inject(ClientFinancialService);
  private invoiceService = inject(InvoiceService);
  public i18n = inject(I18nService);

  customers = signal<any[]>([]);
  activeCustomersCount = computed(() => this.customers().filter(c => c.status === 'active').length);
  loading = signal(true);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.clientService.getClients().subscribe({
      next: (cres) => {
        if (cres?.success && cres.data) {
          const apiClients = cres.data;
          this.invoiceService.getInvoices().subscribe({
            next: (ires) => {
              const invoices = (ires?.success && ires.data) ? ires.data : [];
              const mapped = apiClients.map((client: any) => {
                // Find all invoices associated with this client
                // Note: client.id is used to match with invoice.clientId
                const clientInvoices = invoices.filter((i: any) => i.clientId === client.id || i.clientName === client.companyName);
                const totalInvoicesSum = clientInvoices.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);
                const paidInvoices = clientInvoices.filter((i: any) => i.status?.toLowerCase() === 'paid');
                
                // Find last payment date if any paid invoice exists
                let lastPaymentDate = this.i18n.currentLang() === 'ar' ? 'لا يوجد' : 'None';
                if (paidInvoices.length > 0) {
                  const sortedPaid = [...paidInvoices].sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
                  const lastDate = sortedPaid[0].updatedAt || sortedPaid[0].createdAt;
                  if (lastDate) {
                    lastPaymentDate = new Date(lastDate).toLocaleDateString(this.i18n.currentLang() === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                  }
                }

                return {
                  name: client.companyName || client.name,
                  contact: client.ownerName || '—',
                  email: client.email || '—',
                  totalInvoices: totalInvoicesSum > 0 ? (this.i18n.currentLang() === 'ar' ? totalInvoicesSum.toLocaleString() + ' SAR' : '$' + totalInvoicesSum.toLocaleString()) : '0',
                  lastPayment: lastPaymentDate,
                  status: client.status?.toLowerCase() === 'active' ? 'active' : 'inactive'
                };
              });
              this.customers.set(mapped);
              this.loading.set(false);
            },
            error: () => {
              // fallback if invoices request fails
              const mapped = apiClients.map((client: any) => ({
                name: client.companyName || client.name,
                contact: client.ownerName || '—',
                email: client.email || '—',
                totalInvoices: client.outstandingBalance > 0 ? '$' + client.outstandingBalance.toLocaleString() : '0',
                lastPayment: '—',
                status: client.status?.toLowerCase() === 'active' ? 'active' : 'inactive'
              }));
              this.customers.set(mapped);
              this.loading.set(false);
            }
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false)
    });
  }
}
