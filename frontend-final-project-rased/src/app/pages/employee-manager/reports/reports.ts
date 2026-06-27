import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

interface HistoryRecord {
  title: string;
  period: string;
  size: string;
}

interface AiInsight {
  type: 'info' | 'success' | 'warning';
  text: string;
}

@Component({
  selector: 'app-hr-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class EmployeeManagerReports implements OnInit {
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);

  // States
  activeCategory = signal<'attendance' | 'leaves' | 'performance' | 'payroll'>('attendance');
  showReport = signal(false);
  generating = signal(false);

  // Filter bindings
  filters = {
    month: 6,
    year: 2026,
    department: 'all',
    employeeQuery: ''
  };

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

  // Recently generated logs history
  reportHistory = signal<HistoryRecord[]>([
    {
      title: 'كشف الرواتب - مايو 2026',
      period: 'مايو 2026',
      size: '1.2 MB'
    },
    {
      title: 'تقرير الانضباط والغياب الربع الأول 2026',
      period: 'الربع الأول 2026',
      size: '2.4 MB'
    },
    {
      title: 'تقرير الإجازات السنوي لعام 2025',
      period: 'عام 2025 كامل',
      size: '3.8 MB'
    }
  ]);

  // Raw mock datasets
  attendanceData = [
    { name: 'أحمد فهيم', role: 'المالك والمدير التنفيذي', dept: 'owner', present: 22, absent: 0, late: 0, rate: 100 },
    { name: 'سارة محمود', role: 'رئيس قسم المالية والمحاسبة', dept: 'finance', present: 21, absent: 1, late: 0, rate: 95.4 },
    { name: 'خالد منصور', role: 'مدير المبيعات والتسويق', dept: 'sales', present: 20, absent: 0, late: 2, rate: 90.9 },
    { name: 'عمر فاروق', role: 'مدير الموارد البشرية والعمليات', dept: 'hr', present: 22, absent: 0, late: 0, rate: 100 },
    { name: 'يوسف حسن', role: 'مهندس برمجيات أول', dept: 'development', present: 19, absent: 2, late: 1, rate: 86.3 },
    { name: 'رنا علي', role: 'مندوبة مبيعات أولى', dept: 'sales', present: 21, absent: 0, late: 1, rate: 95.4 },
    { name: 'عبد الله الغامدي', role: 'مطور واجهات أمامية', dept: 'development', present: 22, absent: 0, late: 0, rate: 100 },
    { name: 'مي التويجري', role: 'أخصائية تسويق رقمي', dept: 'sales', present: 18, absent: 3, late: 1, rate: 81.8 }
  ];

  leavesData = [
    { name: 'يوسف حسن', type: 'إجازة مرضية / Sick Leave', dept: 'development', start: '2026-06-10', end: '2026-06-12', days: 2, approvedBy: 'عمر فاروق' },
    { name: 'مي التويجري', type: 'إجازة اضطرارية / Emergency Leave', dept: 'sales', start: '2026-06-15', end: '2026-06-16', days: 1, approvedBy: 'خالد منصور' },
    { name: 'سارة محمود', type: 'إجازة سنوية / Annual Leave', dept: 'finance', start: '2026-06-01', end: '2026-06-05', days: 5, approvedBy: 'أحمد فهيم' },
    { name: 'رنا علي', type: 'إجازة خاصة / Special Leave', dept: 'sales', start: '2026-06-20', end: '2026-06-21', days: 1, approvedBy: 'عمر فاروق' }
  ];

  performanceData = [
    { name: 'يوسف حسن', role: 'مهندس برمجيات أول', dept: 'development', stars: 4, score: 85, notes: 'إنتاجية ممتازة وملتزم بحضور الاجتماعات الفنية، يتطلب تطوير مهارات التواصل الجماعي.' },
    { name: 'رنا علي', role: 'مندوبة مبيعات أولى', dept: 'sales', stars: 5, score: 98, notes: 'أداء استثنائي هذا الشهر، حققت 125% من الهدف البيعي، نموذج يحتذى به في القيادة والالتزام.' },
    { name: 'عبد الله الغامدي', role: 'مطور واجهات أمامية', dept: 'development', stars: 4, score: 90, notes: 'سرعة وجودة عالية في تسليم الواجهات الجديدة، يبدي انضباطاً كاملاً في مواعيد العمل.' },
    { name: 'سارة محمود', role: 'رئيس قسم المالية والمحاسبة', dept: 'finance', stars: 5, score: 96, notes: 'دقة عالية جداً في التدقيق المالي وكشوفات الأرباح، تقاريرها دائماً خالية من الأخطاء.' },
    { name: 'خالد منصور', role: 'مدير المبيعات والتسويق', dept: 'sales', stars: 3, score: 78, notes: 'يحتاج إلى تنشيط قنوات البيع ومتابعة الفريق بشكل أفضل لتعويض الركود الموسمي الحالي.' },
    { name: 'مي التويجري', role: 'أخصائية تسويق رقمي', dept: 'sales', stars: 3, score: 72, notes: 'تأثرت إنتاجيتها بكثرة الغيابات والظروف الاضطرارية، بحاجة للتركيز على الحملات المدفوعة.' }
  ];

  payrollData = [
    { name: 'أحمد فهيم', basic: 25000, allowance: 5000, deductions: 0, dept: 'owner' },
    { name: 'سارة محمود', basic: 14000, allowance: 2500, deductions: 350, dept: 'finance' },
    { name: 'خالد منصور', basic: 12000, allowance: 4000, deductions: 0, dept: 'sales' },
    { name: 'عمر فاروق', basic: 11000, allowance: 2000, deductions: 0, dept: 'hr' },
    { name: 'يوسف حسن', basic: 13000, allowance: 1500, deductions: 580, dept: 'development' },
    { name: 'رنا علي', basic: 9000, allowance: 4500, deductions: 0, dept: 'sales' },
    { name: 'عبد الله الغامدي', basic: 9500, allowance: 1200, deductions: 0, dept: 'development' },
    { name: 'مي التويجري', basic: 8000, allowance: 1000, deductions: 480, dept: 'sales' }
  ];

  ngOnInit() {
    // Component initialization
  }

  // Active state controller
  selectCategory(cat: 'attendance' | 'leaves' | 'performance' | 'payroll') {
    this.activeCategory.set(cat);
    this.showReport.set(false);
  }

  // Filter processing
  filteredAttendanceData() {
    let list = this.attendanceData;
    if (this.filters.department !== 'all') {
      list = list.filter(x => x.dept === this.filters.department);
    }
    if (this.filters.employeeQuery.trim() !== '') {
      const q = this.filters.employeeQuery.toLowerCase();
      list = list.filter(x => x.name.toLowerCase().includes(q));
    }
    return list;
  }

  filteredLeavesData() {
    let list = this.leavesData;
    if (this.filters.department !== 'all') {
      list = list.filter(x => x.dept === this.filters.department);
    }
    if (this.filters.employeeQuery.trim() !== '') {
      const q = this.filters.employeeQuery.toLowerCase();
      list = list.filter(x => x.name.toLowerCase().includes(q));
    }
    return list;
  }

  filteredPerformanceData() {
    let list = this.performanceData;
    if (this.filters.department !== 'all') {
      list = list.filter(x => x.dept === this.filters.department);
    }
    if (this.filters.employeeQuery.trim() !== '') {
      const q = this.filters.employeeQuery.toLowerCase();
      list = list.filter(x => x.name.toLowerCase().includes(q));
    }
    return list;
  }

  filteredPayrollData() {
    let list = this.payrollData;
    if (this.filters.department !== 'all') {
      list = list.filter(x => x.dept === this.filters.department);
    }
    if (this.filters.employeeQuery.trim() !== '') {
      const q = this.filters.employeeQuery.toLowerCase();
      list = list.filter(x => x.name.toLowerCase().includes(q));
    }
    return list;
  }

  // Trigger loading state and display generated results
  handleGenerate() {
    this.generating.set(true);
    setTimeout(() => {
      this.generating.set(false);
      this.showReport.set(true);

      // Add to generated history
      const title = this.getReportTitle();
      const period = this.getFormattedPeriodText();
      const currentList = this.reportHistory();

      // Check if duplicate title exists to prevent bloating
      if (!currentList.some(x => x.title === title)) {
        this.reportHistory.set([
          {
            title: title,
            period: period,
            size: (Math.random() * (2.2 - 0.7) + 0.7).toFixed(1) + ' MB'
          },
          ...currentList
        ]);
      }

      // Show toast
      const successMsg = this.i18n.isRtl() 
        ? `تم توليد تقرير "${title}" بنجاح!` 
        : `Report "${title}" generated successfully!`;
      this.toastService.success(successMsg, this.i18n.isRtl() ? 'توليد التقارير' : 'Report Engine');
    }, 1000);
  }

  // Helper text providers
  getReportTitle(): string {
    const cat = this.activeCategory();
    if (this.i18n.isRtl()) {
      if (cat === 'attendance') return 'تقرير الانضباط والحضور العام';
      if (cat === 'leaves') return 'سجل طلبات الإجازات المعتمدة';
      if (cat === 'performance') return 'كشف تقييم أداء الموظفين السنوي';
      return 'بيان كشف الرواتب والمستحقات المالية';
    } else {
      if (cat === 'attendance') return 'General Discipline & Attendance Report';
      if (cat === 'leaves') return 'Log of Approved Leave Requests';
      if (cat === 'performance') return 'Annual Employee Performance Sheet';
      return 'Payroll & Financial Dues Statement';
    }
  }

  getCategoryCode(): string {
    const cat = this.activeCategory();
    if (cat === 'attendance') return 'ATT';
    if (cat === 'leaves') return 'LV';
    if (cat === 'performance') return 'PERF';
    return 'PAY';
  }

  getFormattedPeriodText(): string {
    const monthObj = this.months.find(m => m.value === Number(this.filters.month));
    const monthName = monthObj ? (this.i18n.isRtl() ? monthObj.nameAr.split(' ')[0] : monthObj.nameEn.split(' ')[0]) : '';
    return this.i18n.isRtl()
      ? `خلال شهر ${monthName} لعام ${this.filters.year}`
      : `For the month of ${monthName} ${this.filters.year}`;
  }

  // dynamic tables setup
  getTableHeaders(): string[] {
    const cat = this.activeCategory();
    if (this.i18n.isRtl()) {
      if (cat === 'attendance') return ['اسم الموظف', 'المسمى الوظيفي', 'أيام العمل', 'أيام الغياب', 'مرات التأخير', 'نسبة الحضور'];
      if (cat === 'leaves') return ['اسم الموظف', 'نوع الإجازة', 'تاريخ البدء', 'تاريخ الانتهاء', 'المدة باليوم', 'الموافقة بواسطة', 'الحالة'];
      if (cat === 'performance') return ['اسم الموظف', 'المسمى الوظيفي', 'التقييم العام', 'النسبة الإجمالية', 'أهم الملاحظات والتوصيات'];
      return ['اسم الموظف', 'الراتب الأساسي', 'البدلات والمكافآت', 'الخصومات / التأمينات', 'صافي الراتب المستحق', 'حالة الدفع'];
    } else {
      if (cat === 'attendance') return ['Employee Name', 'Role/Title', 'Present', 'Absent', 'Late', 'Attendance Rate'];
      if (cat === 'leaves') return ['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Approved By', 'Status'];
      if (cat === 'performance') return ['Employee Name', 'Role/Title', 'Rating', 'Score', 'Manager Notes & Feedback'];
      return ['Employee Name', 'Basic Salary', 'Bonuses/Allowances', 'Deductions', 'Net Payable', 'Payment Status'];
    }
  }

  getReportKPIs() {
    const cat = this.activeCategory();
    if (this.i18n.isRtl()) {
      if (cat === 'attendance') {
        const data = this.filteredAttendanceData();
        const avg = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.rate, 0) / data.length).toFixed(1) : '0';
        return [
          { label: 'معدل الانضباط العام', value: `${avg}%` },
          { label: 'إجمالي الغيابات بالقسم', value: data.reduce((acc, curr) => acc + curr.absent, 0) + ' أيام' },
          { label: 'إجمالي حالات التأخير', value: data.reduce((acc, curr) => acc + curr.late, 0) + ' مرات' }
        ];
      }
      if (cat === 'leaves') {
        const data = this.filteredLeavesData();
        return [
          { label: 'إجمالي الطلبات المعتمدة', value: data.length + ' طلبات' },
          { label: 'مجموع أيام الإجازات المستهلكة', value: data.reduce((acc, curr) => acc + curr.days, 0) + ' يوم' },
          { label: 'نشط حالياً بالإجازة', value: '1 موظفين' }
        ];
      }
      if (cat === 'performance') {
        const data = this.filteredPerformanceData();
        const avg = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.score, 0) / data.length).toFixed(1) : '0';
        return [
          { label: 'متوسط الأداء العام للقسم', value: `${avg}%` },
          { label: 'تقييم ممتاز (5 نجوم)', value: data.filter(x => x.stars === 5).length + ' موظفين' },
          { label: 'الأداء الأعلى بالقسم', value: 'رنا علي (98%)' }
        ];
      }
      // payroll
      const data = this.filteredPayrollData();
      const total = data.reduce((acc, curr) => acc + (curr.basic + curr.allowance - curr.deductions), 0);
      return [
        { label: 'إجمالي الفاتورة الشهرية للرواتب', value: `${total.toLocaleString()} ر.س` },
        { label: 'متوسط صافي راتب الموظف', value: `${Math.round(total / (data.length || 1)).toLocaleString()} ر.س` },
        { label: 'الخصومات والاقتطاعات الكلية', value: `${data.reduce((acc, curr) => acc + curr.deductions, 0).toLocaleString()} ر.س` }
      ];
    } else {
      if (cat === 'attendance') {
        const data = this.filteredAttendanceData();
        const avg = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.rate, 0) / data.length).toFixed(1) : '0';
        return [
          { label: 'Overall Discipline Rate', value: `${avg}%` },
          { label: 'Total Absences', value: data.reduce((acc, curr) => acc + curr.absent, 0) + ' days' },
          { label: 'Late Arrival Incidents', value: data.reduce((acc, curr) => acc + curr.late, 0) + ' times' }
        ];
      }
      if (cat === 'leaves') {
        const data = this.filteredLeavesData();
        return [
          { label: 'Total Approved Requests', value: data.length + ' requests' },
          { label: 'Sum of Leave Days Taken', value: data.reduce((acc, curr) => acc + curr.days, 0) + ' days' },
          { label: 'Employees Active on Leave', value: '1' }
        ];
      }
      if (cat === 'performance') {
        const data = this.filteredPerformanceData();
        const avg = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.score, 0) / data.length).toFixed(1) : '0';
        return [
          { label: 'Average Department Score', value: `${avg}%` },
          { label: 'Excellent Rating (5★)', value: data.filter(x => x.stars === 5).length + ' employees' },
          { label: 'Top Performer', value: 'Rana Ali (98%)' }
        ];
      }
      // payroll
      const data = this.filteredPayrollData();
      const total = data.reduce((acc, curr) => acc + (curr.basic + curr.allowance - curr.deductions), 0);
      return [
        { label: 'Total Monthly Payroll', value: `${total.toLocaleString()} SAR` },
        { label: 'Average Employee Net Pay', value: `${Math.round(total / (data.length || 1)).toLocaleString()} SAR` },
        { label: 'Sum of Deductions / Taxes', value: `${data.reduce((acc, curr) => acc + curr.deductions, 0).toLocaleString()} SAR` }
      ];
    }
  }

  // AI interactive analytics insight generator
  getReportAiInsights(): AiInsight[] {
    const cat = this.activeCategory();
    if (this.i18n.isRtl()) {
      if (cat === 'attendance') {
        return [
          { type: 'success', text: 'انضباط ممتاز لقسم الموارد البشرية والمالية بنسبة حضور 100% خلال شهر يونيو.' },
          { type: 'warning', text: 'تم رصد انخفاض انضباط للموظف يوسف حسن (86.3%) بسبب غياب يومين متتاليين دون عذر مسبق، يوصى بالتحقق.' },
          { type: 'info', text: 'معدل الحضور العام بالشركة 93.6%، وهو ضمن المعدلات الآمنة للإنتاجية والعمليات التشغيلية.' }
        ];
      }
      if (cat === 'leaves') {
        return [
          { type: 'info', text: 'بلغت نسبة الإجازات المرضية 50% من إجمالي الإجازات المعتمدة لهذا الشهر.' },
          { type: 'success', text: 'جميع إجازات هذا الشهر تم مراجعتها والتوقيع عليها بواسطة المدراء المسؤولين بالتوافق مع لائحة العمل.' },
          { type: 'info', text: 'القسم الأكثر طلباً للإجازات هو قسم التطوير البرمجي بإجمالي 7 أيام إجازة مستهلكة.' }
        ];
      }
      if (cat === 'performance') {
        return [
          { type: 'success', text: 'حققت الموظفة رنا علي أعلى تقييم أداء (98%) بنسبة 5 نجوم مدعوماً بتحقيق الأهداف البيعية المرتفعة.' },
          { type: 'warning', text: 'لوحظ انخفاض أداء طفيف للموظفة مي التويجري (72%)، مرتبط بارتفاع معدلات الغياب والظروف الصحية الاستثنائية.' },
          { type: 'info', text: 'متوسط أداء الفريق الكلي 86.8%، وهو ما يشير إلى إنتاجية عالية وكفاءة ممتازة لخطوط العمل.' }
        ];
      }
      return [
        { type: 'success', text: 'كشف الرواتب يتطابق تماماً مع نظام العمل السعودي، مع احتساب كامل البدلات والتأمينات بدقة 100%.' },
        { type: 'warning', text: 'ارتفاع طفيف في حجم الاقتطاعات الإجمالية (1,410 ر.س) ناتج عن خصومات الغياب لبعض الموظفين.' },
        { type: 'info', text: 'المكافآت والبدلات لشهر يونيو تمثل 19.3% من إجمالي الفاتورة الكلية للأجور (تحفيز أداء المبيعات).' }
      ];
    } else {
      if (cat === 'attendance') {
        return [
          { type: 'success', text: 'Excellent attendance of 100% in HR and Finance departments during June.' },
          { type: 'warning', text: 'Youssef Hassan has a drop in attendance (86.3%) due to 2 days absent. Action recommended.' },
          { type: 'info', text: 'Overall company attendance rate is at 93.6%, which is within healthy operational bounds.' }
        ];
      }
      if (cat === 'leaves') {
        return [
          { type: 'info', text: 'Sick leaves represent 50% of the approved requests this month.' },
          { type: 'success', text: 'All requests were fully reviewed and approved by corresponding managers.' },
          { type: 'info', text: 'Software Development is the department with the highest leave density (7 days total).' }
        ];
      }
      if (cat === 'performance') {
        return [
          { type: 'success', text: 'Rana Ali scored the highest evaluation (98%) with a 5-star rating due to crushing sales goals.' },
          { type: 'warning', text: 'Mai Al-Tuwaijri shows a slight drop (72%), correlating with her high absence frequency.' },
          { type: 'info', text: 'Average team performance is 86.8%, reflecting strong overall productivity.' }
        ];
      }
      return [
        { type: 'success', text: 'Payroll statement matches all regulatory configurations with 100% calculation accuracy.' },
        { type: 'warning', text: 'Deductions sum up to 1,410 SAR, mostly due to unexcused absence calculations.' },
        { type: 'info', text: 'Bonuses and allowances represent 19.3% of the total payroll bill (sales incentives included).' }
      ];
    }
  }

  // Export actions
  exportAllHistory() {
    const successMsg = this.i18n.isRtl()
      ? 'جاري تجهيز وتصدير أرشيف التقارير بالكامل بصيغة ZIP...'
      : 'Preparing to export all compiled reports into a ZIP archive...';
    this.toastService.success(successMsg, this.i18n.isRtl() ? 'تصدير التقارير' : 'Export Logs');
  }

  handleDownload(customTitle?: string) {
    const title = customTitle || this.getReportTitle();
    const successMsg = this.i18n.isRtl()
      ? `جاري تحميل تقرير "${title}" بصيغة PDF...`
      : `Downloading report "${title}" in PDF format...`;
    this.toastService.success(successMsg, this.i18n.isRtl() ? 'تحميل الملف' : 'Download Document');
  }

  handlePrint() {
    const successMsg = this.i18n.isRtl()
      ? 'جاري تهيئة صفحة الطباعة، يرجى الانتظار...'
      : 'Opening print dialog spooler, please wait...';
    this.toastService.success(successMsg, this.i18n.isRtl() ? 'طباعة التقرير' : 'Print Spooler');
  }
}
