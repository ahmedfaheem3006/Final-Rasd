import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { PdfGeneratorService, InvoiceData, InvoiceTheme } from '../../../services/pdf-generator.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-invoice-detail',
  imports: [CommonModule],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.css'
})
export class InvoiceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);
  private pdfService = inject(PdfGeneratorService);
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);

  selectedTheme = signal<InvoiceTheme>('rasd');

  invoice = signal<{
    id: string;
    client: string;
    email: string;
    date: string;
    due: string;
    status: string;
    items: { name: string; qty: number; price: string; unitPrice: number }[];
    subtotal: string;
    tax: string;
    total: string;
    totalNum: number;
    subtotalNum: number;
    taxNum: number;
  }>({
    id: 'INV-001',
    client: 'مجموعة الفوزان للتجارة',
    email: 'billing@fawzan.sa',
    date: '15 يونيو 2026',
    due: '30 يونيو 2026',
    status: 'paid',
    items: [
      { name: 'باقة CRM الاحترافية - اشتراك سنوي', qty: 1, price: '$18,000', unitPrice: 18000 },
      { name: 'تخصيص واجهة المستخدم', qty: 1, price: '$3,500', unitPrice: 3500 },
      { name: 'تدريب فريق المبيعات (5 أيام)', qty: 1, price: '$3,000', unitPrice: 3000 },
    ],
    subtotal: '$24,500',
    tax: '$3,675',
    total: '$28,175',
    totalNum: 28175,
    subtotalNum: 24500,
    taxNum: 3675,
  });

  ngOnInit() {
    // Try to load real data from API based on route param
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      // We could load from API here if available
    }
  }

  get themes(): { key: InvoiceTheme; label: string; icon: string }[] {
    const isAr = this.i18n.currentLang() === 'ar';
    return [
      { key: 'rasd', label: isAr ? 'رصد' : 'RASD', icon: 'fa-bolt' },
      { key: 'modern', label: isAr ? 'عصري' : 'Modern', icon: 'fa-wand-magic-sparkles' },
      { key: 'classic', label: isAr ? 'كلاسيكي' : 'Classic', icon: 'fa-landmark' },
      { key: 'minimal', label: isAr ? 'بسيط' : 'Minimal', icon: 'fa-minus' },
    ];
  }

  selectTheme(theme: InvoiceTheme) {
    this.selectedTheme.set(theme);
  }

  private buildInvoiceData(): InvoiceData {
    const inv = this.invoice();
    return {
      id: inv.id,
      invoiceNumber: inv.id,
      clientName: inv.client,
      clientEmail: inv.email,
      totalAmount: inv.subtotalNum,
      paidAmount: inv.status === 'paid' ? inv.totalNum : 0,
      status: inv.status,
      dueDate: inv.due,
      createdAt: inv.date,
      taxRate: 15,
      items: inv.items.map((item) => ({
        description: item.name,
        quantity: item.qty,
        unitPrice: item.unitPrice,
      })),
    };
  }

  onPrint() {
    const invoiceData = this.buildInvoiceData();
    this.pdfService.downloadInvoicePDF(invoiceData, this.selectedTheme());
    this.toastService.success(
      this.i18n.currentLang() === 'ar'
        ? 'تم فتح نافذة الطباعة بنجاح'
        : 'Print window opened successfully',
      this.i18n.currentLang() === 'ar' ? 'طباعة' : 'Print'
    );
  }

  onDownloadPDF() {
    const invoiceData = this.buildInvoiceData();
    this.pdfService.downloadInvoicePDF(invoiceData, this.selectedTheme());
    this.toastService.success(
      this.i18n.currentLang() === 'ar'
        ? 'تم فتح نافذة تصدير PDF — اختر "حفظ كـ PDF" من الطابعة'
        : 'PDF export opened — choose "Save as PDF" from printer',
      this.i18n.currentLang() === 'ar' ? 'تصدير PDF' : 'PDF Export'
    );
  }

  onShareWhatsApp() {
    const invoiceData = this.buildInvoiceData();
    this.pdfService.shareInvoiceWhatsApp(invoiceData, this.selectedTheme());
    this.toastService.info(
      this.i18n.currentLang() === 'ar'
        ? 'يتم فتح واتساب لمشاركة الفاتورة...'
        : 'Opening WhatsApp to share invoice...',
      this.i18n.currentLang() === 'ar' ? 'مشاركة' : 'Share'
    );
  }
}
