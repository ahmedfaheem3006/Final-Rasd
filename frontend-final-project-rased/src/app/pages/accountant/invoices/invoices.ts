import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../services/invoice.service';
import { PdfGeneratorService, InvoiceData, InvoiceTheme } from '../../../services/pdf-generator.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-invoices',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class Invoices implements OnInit {
  private invoiceService = inject(InvoiceService);
  private pdfService = inject(PdfGeneratorService);
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);

  selectedTheme = signal<InvoiceTheme>('rasd');
  searchQuery = signal('');

  rawInvoices = signal<any[]>([]);

  invoices = signal<any[]>([]);
  stats = signal([
    { label: 'إجمالي الفواتير', value: '$0', color: 'primary', icon: 'fa-file-invoice-dollar' },
    { label: 'مدفوعة', value: '$0', color: 'success', icon: 'fa-circle-check' },
    { label: 'قيد الانتظار', value: '$0', color: 'warning', icon: 'fa-clock' },
    { label: 'متأخرة', value: '$0', color: 'danger', icon: 'fa-triangle-exclamation' },
  ]);

  get themes(): { key: InvoiceTheme; label: string }[] {
    const isAr = this.i18n.currentLang() === 'ar';
    return [
      { key: 'rasd', label: isAr ? 'رصد' : 'RASD' },
      { key: 'modern', label: isAr ? 'عصري' : 'Modern' },
      { key: 'classic', label: isAr ? 'كلاسيكي' : 'Classic' },
      { key: 'minimal', label: isAr ? 'بسيط' : 'Minimal' },
    ];
  }

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoiceService.getInvoices().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const apiInvoices = res.data;

          const mapped = apiInvoices.map((inv: any) => ({
            id: `INV-${String(inv.id).padStart(3, '0')}`,
            numericId: inv.id,
            client: inv.clientName || 'عميل غير معروف',
            amount: `$${Number(inv.totalAmount).toLocaleString()}`,
            amountNum: Number(inv.totalAmount),
            date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'مؤخراً',
            due: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'مؤخراً',
            createdAt: inv.createdAt,
            dueDate: inv.dueDate,
            status: inv.status?.toLowerCase() === 'unpaid' ? 'pending' : inv.status?.toLowerCase() || 'pending'
          }));

          this.rawInvoices.set(mapped);
          this.invoices.set(mapped);

          const total = apiInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
          const paid = apiInvoices.filter((inv: any) => inv.status?.toLowerCase() === 'paid').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
          const pending = apiInvoices.filter((inv: any) => inv.status?.toLowerCase() === 'unpaid' || inv.status?.toLowerCase() === 'pending').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
          const overdue = apiInvoices.filter((inv: any) => inv.status?.toLowerCase() === 'overdue').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

          this.stats.set([
            { label: this.i18n.currentLang() === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices', value: `$${total.toLocaleString()}`, color: 'primary', icon: 'fa-file-invoice-dollar' },
            { label: this.i18n.currentLang() === 'ar' ? 'مدفوعة' : 'Paid', value: `$${paid.toLocaleString()}`, color: 'success', icon: 'fa-circle-check' },
            { label: this.i18n.currentLang() === 'ar' ? 'قيد الانتظار' : 'Pending', value: `$${pending.toLocaleString()}`, color: 'warning', icon: 'fa-clock' },
            { label: this.i18n.currentLang() === 'ar' ? 'متأخرة' : 'Overdue', value: `$${overdue.toLocaleString()}`, color: 'danger', icon: 'fa-triangle-exclamation' }
          ]);
        }
      },
      error: (err) => console.error('Failed to load invoices', err)
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.invoices.set(this.rawInvoices());
      return;
    }
    const q = query.toLowerCase();
    this.invoices.set(
      this.rawInvoices().filter(inv =>
        inv.id.toLowerCase().includes(q) ||
        inv.client.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
      )
    );
  }

  selectTheme(theme: InvoiceTheme) {
    this.selectedTheme.set(theme);
  }

  downloadInvoicePDF(inv: any) {
    const invoiceData: InvoiceData = {
      id: inv.numericId || inv.id,
      invoiceNumber: inv.id,
      clientName: inv.client,
      totalAmount: inv.amountNum,
      paidAmount: inv.status === 'paid' ? inv.amountNum : 0,
      status: inv.status,
      dueDate: inv.dueDate || inv.due,
      createdAt: inv.createdAt || inv.date,
      items: [
        {
          description: this.i18n.currentLang() === 'ar'
            ? 'خدمات وحلول رصد للذكاء الاصطناعي'
            : 'RASD AI Services & Solutions',
          quantity: 1,
          unitPrice: inv.amountNum,
        }
      ],
      taxRate: 0,
    };

    this.pdfService.downloadInvoicePDF(invoiceData, this.selectedTheme());
    this.toastService.success(
      this.i18n.currentLang() === 'ar'
        ? `تم فتح PDF للفاتورة ${inv.id}`
        : `PDF opened for invoice ${inv.id}`,
      this.i18n.currentLang() === 'ar' ? 'تصدير PDF' : 'PDF Export'
    );
  }
}
