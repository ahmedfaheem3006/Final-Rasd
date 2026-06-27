import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { ReportService, ReportRecord } from '../../../services/report.service';

interface ReportItem {
  id?: number;
  key: string;
  date: string;
  size: string;
}

interface ReportCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  reports: ReportItem[];
}

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);
  private reportService = inject(ReportService);

  reportCategories = signal<ReportCategory[]>([
    {
      id: 'sales',
      title: 'تقارير المبيعات',
      icon: 'fa-chart-line',
      color: 'primary',
      reports: []
    },
    {
      id: 'financial',
      title: 'التقارير المالية',
      icon: 'fa-wallet',
      color: 'success',
      reports: []
    },
    {
      id: 'hr',
      title: 'تقارير الموارد البشرية',
      icon: 'fa-users-gear',
      color: 'info',
      reports: []
    },
  ]);

  // Modal controls
  showModal = signal(false);
  selectedCategory = signal<'sales' | 'financial' | 'hr'>('sales');

  salesOptions = [
    { key: 'reports.item.sales_summary', label: 'ملخص المبيعات الشهري', selected: true },
    { key: 'reports.item.closed_deals', label: 'تقرير الصفقات المغلقة', selected: false },
    { key: 'reports.item.sales_performance', label: 'تحليل أداء فريق المبيعات', selected: false },
    { key: 'reports.item.sales_forecast', label: 'توقعات المبيعات المستقبلية', selected: false }
  ];

  financialOptions = [
    { key: 'reports.item.income_expense', label: 'بيان الدخل والمصروفات', selected: true },
    { key: 'reports.item.outstanding_invoices', label: 'تقرير الفواتير المستحقة', selected: false },
    { key: 'reports.item.cash_flow', label: 'تحليل التدفق النقدي', selected: false },
    { key: 'reports.item.profit_loss', label: 'تقرير الأرباح والخسائر', selected: false }
  ];

  hrOptions = [
    { key: 'reports.item.attendance', label: 'تقرير الحضور والانصراف', selected: true },
    { key: 'reports.item.leaves', label: 'طلبات الإجازات المعتمدة', selected: false },
    { key: 'reports.item.performance', label: 'تقييم أداء الموظفين', selected: false },
    { key: 'reports.item.payroll', label: 'كشف الرواتب والمستحقات', selected: false }
  ];

  get currentOptions() {
    const cat = this.selectedCategory();
    if (cat === 'sales') return this.salesOptions;
    if (cat === 'financial') return this.financialOptions;
    return this.hrOptions;
  }

  months = [
    { value: 1, nameAr: 'يناير (01)', nameEn: 'January (01)' },
    { value: 2, nameAr: 'فبراير (02)', nameEn: 'February (02)' },
    { value: 3, nameAr: 'مارس (03)', nameEn: 'March (03)' },
    { value: 4, nameAr: 'أبريل (04)', nameEn: 'April (04)' },
    { value: 5, nameAr: 'مايو (05)', nameEn: 'May (05)' },
    { value: 6, nameAr: 'يونيو (06)', nameEn: 'June (06)' },
    { value: 7, nameAr: 'يوليو (07)', nameEn: 'July (07)' },
    { value: 8, nameAr: 'أغسطس (08)', nameEn: 'August (08)' },
    { value: 9, nameAr: 'سبتمبر (09)', nameEn: 'September (09)' },
    { value: 10, nameAr: 'أكتوبر (10)', nameEn: 'October (10)' },
    { value: 11, nameAr: 'نوفمبر (11)', nameEn: 'November (11)' },
    { value: 12, nameAr: 'ديسمبر (12)', nameEn: 'December (12)' }
  ];

  fromMonth = 7;
  toMonth = 7;
  selectedYear = 2026;

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.reportService.getReports().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.reportCategories.update(categories => {
            return categories.map(cat => {
              const backendReportsForCat = res.data
                .filter((r: ReportRecord) => r.category === cat.id)
                .map((r: ReportRecord) => ({
                  id: r.id,
                  key: r.title,
                  date: r.period,
                  size: r.sizeLabel
                }));

              return {
                ...cat,
                // Newest generated report appears at the top
                reports: backendReportsForCat
              };
            });
          });
        }
      },
      error: (err) => {
        console.error('Error loading reports:', err);
      }
    });
  }

  selectCategory(cat: 'sales' | 'financial' | 'hr') {
    this.selectedCategory.set(cat);
  }

  getFormattedPeriod(): string {
    const fromM = this.months.find(m => m.value === Number(this.fromMonth));
    const toM = this.months.find(m => m.value === Number(this.toMonth));
    if (!fromM || !toM) return '';

    const getMonthName = (m: any) => {
      const name = this.i18n.isRtl() ? m.nameAr : m.nameEn;
      return name.split(' ')[0];
    };

    if (Number(this.fromMonth) === Number(this.toMonth)) {
      return this.i18n.isRtl()
        ? `خلال شهر ${getMonthName(fromM)} ${this.selectedYear}`
        : `During ${getMonthName(fromM)} ${this.selectedYear}`;
    } else {
      return this.i18n.isRtl()
        ? `من ${getMonthName(fromM)} إلى ${getMonthName(toM)} ${this.selectedYear}`
        : `From ${getMonthName(fromM)} to ${getMonthName(toM)} ${this.selectedYear}`;
    }
  }

  openModal() {
    this.showModal.set(true);
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this.showModal.set(false);
    document.body.classList.remove('modal-open');
    this.resetForm();
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }

  resetForm() {
    this.salesOptions.forEach((o, i) => o.selected = i === 0);
    this.financialOptions.forEach((o, i) => o.selected = i === 0);
    this.hrOptions.forEach((o, i) => o.selected = i === 0);
    this.selectedCategory.set('sales');
    this.fromMonth = 7;
    this.toMonth = 7;
    this.selectedYear = 2026;
  }

  generateReport() {
    const selectedOptions = this.currentOptions.filter(opt => opt.selected);
    if (selectedOptions.length === 0) {
      const warnMsg = this.i18n.isRtl() 
        ? 'الرجاء اختيار قسم واحد على الأقل لتوليد التقرير.' 
        : 'Please select at least one section to generate the report.';
      const warnTitle = this.i18n.isRtl() ? 'تنبيه' : 'Warning';
      this.toastService.warning(warnMsg, warnTitle);
      return;
    }

    if (Number(this.fromMonth) > Number(this.toMonth)) {
      const warnMsg = this.i18n.isRtl()
        ? 'عذراً، يجب أن يكون شهر البداية قبل أو يساوي شهر النهاية.'
        : 'Sorry, the start month must be before or equal to the end month.';
      const warnTitle = this.i18n.isRtl() ? 'تنبيه' : 'Warning';
      this.toastService.warning(warnMsg, warnTitle);
      return;
    }

    const catId = this.selectedCategory();
    let reportKey = '';
    let reportNameFallback = '';
    
    if (selectedOptions.length === 1) {
      reportKey = selectedOptions[0].key;
      reportNameFallback = selectedOptions[0].label;
    } else {
      const typeLabelAr = catId === 'sales' ? 'مبيعات' : catId === 'financial' ? 'مالي' : 'موارد بشرية';
      const typeLabelEn = catId === 'sales' ? 'Sales' : catId === 'financial' ? 'Financial' : 'HR';
      reportKey = this.i18n.isRtl() 
        ? `تقرير ${typeLabelAr} مجمع (${selectedOptions.length} أقسام)` 
        : `Combined ${typeLabelEn} Report (${selectedOptions.length} sections)`;
      reportNameFallback = reportKey;
    }

    const periodStr = this.getFormattedPeriod();
    const randomSize = (Math.random() * (2.5 - 0.3) + 0.3).toFixed(1) + ' MB';

    const payload: Partial<ReportRecord> = {
      category: catId,
      title: reportKey || reportNameFallback,
      period: periodStr || 'اليوم',
      sizeLabel: randomSize
    };

    this.reportService.createReport(payload).subscribe({
      next: (res) => {
        if (res.success) {
          const successMsg = this.i18n.isRtl()
            ? `تم إنشاء التقرير "${this.i18n.t(payload.title || '')}" بنجاح!`
            : `Report "${this.i18n.t(payload.title || '')}" generated successfully!`;
          const successTitle = this.i18n.isRtl() ? 'توليد التقارير' : 'Report Generation';
          this.toastService.success(successMsg, successTitle);
          this.closeModal();
          this.loadReports(); // Reload report lists
        }
      },
      error: (err) => {
        console.error('Error generating report:', err);
        const errMsg = this.i18n.isRtl() ? 'حدث خطأ أثناء حفظ التقرير' : 'An error occurred while saving the report';
        this.toastService.error(errMsg, this.i18n.isRtl() ? 'خطأ' : 'Error');
      }
    });
  }

  onExportAll() {
    const msg = this.i18n.isRtl()
      ? 'تمت جدولة تصدير جميع تقارير المنظومة، ستبدأ العملية تلقائياً.'
      : 'Exporting all system reports scheduled, the process will start automatically.';
    const title = this.i18n.isRtl() ? 'تصدير التقارير' : 'Export Reports';
    this.toastService.success(msg, title);
  }

  onDownloadReport(key: string) {
    const reportName = this.i18n.t(key);
    const msg = this.i18n.isRtl()
      ? `جاري تحميل ملف التقرير "${reportName}" بصيغة PDF...`
      : `Downloading report "${reportName}" in PDF format...`;
    const title = this.i18n.isRtl() ? 'تحميل ملف' : 'Download File';
    this.toastService.success(msg, title);
  }
}
