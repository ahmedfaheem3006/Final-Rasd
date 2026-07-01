import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

export interface HREmployee {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleEn: string;
  department: string;
  departmentEn: string;
  salary: number;
  allowances: number;
  contractStart: string;
  contractEnd: string;
  status: 'Active' | 'OnLeave' | 'Suspended';
}

@Component({
  selector: 'app-hr-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.html',
  styleUrls: ['./employees.css']
})
export class HREmployees implements OnInit {
  public i18n = inject(I18nService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  searchTerm = signal('');
  filterDept = signal('all');
  employees = signal<HREmployee[]>([]);
  selectedEmployee = signal<HREmployee | null>(null);

  // Edit mode state
  editMode = signal(false);
  editPhone = '';
  editContractStart = '';
  editContractEnd = '';
  editSalary = 0;
  editAllowances = 0;
  isSaving = signal(false);

  // Dynamic payslip months
  payslipMonths = (() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
    return months;
  })();

  payslipMonthsAr = (() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }));
    }
    return months;
  })();

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.employees.set(res.data.map((item: any) => this.mapToHREmployee(item)));
        }
      },
      error: () => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحميل قائمة الموظفين' : 'Failed to load employees'
        );
      }
    });
  }

  mapToHREmployee(item: any): HREmployee {
    const roleName = item.roleName || '';
    let roleAr = roleName, roleEn = roleName;
    let departmentAr = 'القسم العام', departmentEn = 'General';
    let defaultSalary = 10000, defaultAllowances = 1500;

    switch (roleName.toLowerCase()) {
      case 'systemadmin':    roleAr = 'مدير النظام الفني';    roleEn = 'System Administrator';  departmentAr = 'الإدارة العليا';    departmentEn = 'Executive Management'; defaultSalary = 20000; defaultAllowances = 4000; break;
      case 'owner':         roleAr = 'مالك الشركة';          roleEn = 'Company Owner';          departmentAr = 'الإدارة العليا';    departmentEn = 'Executive Management'; defaultSalary = 25000; defaultAllowances = 5000; break;
      case 'accountant':    roleAr = 'المحاسب المالي';       roleEn = 'Financial Accountant';   departmentAr = 'القسم المالي';     departmentEn = 'Finance';              defaultSalary = 12000; defaultAllowances = 2000; break;
      case 'salesmanager':  roleAr = 'مدير المبيعات';        roleEn = 'Sales Manager';          departmentAr = 'إدارة المبيعات';  departmentEn = 'Sales';                defaultSalary = 16000; defaultAllowances = 4500; break;
      case 'sales':         roleAr = 'مندوب مبيعات';         roleEn = 'Sales Specialist';       departmentAr = 'إدارة المبيعات';  departmentEn = 'Sales';                defaultSalary = 9500;  defaultAllowances = 3000; break;
      case 'employeemanager': roleAr = 'مدير الموظفين';      roleEn = 'Employee Manager';       departmentAr = 'القسم التقني';    departmentEn = 'Technology';           defaultSalary = 14500; defaultAllowances = 2500; break;
      case 'employee':      roleAr = 'موظف عمليات';          roleEn = 'Operations Employee';    departmentAr = 'القسم التقني';    departmentEn = 'Technology';           defaultSalary = 11000; defaultAllowances = 1500; break;
      case 'hr':            roleAr = 'موارد بشرية';           roleEn = 'HR';                    departmentAr = 'الموارد البشرية'; departmentEn = 'Human Resources';      defaultSalary = 13500; defaultAllowances = 2500; break;
    }

    let status: 'Active' | 'OnLeave' | 'Suspended' = 'Active';
    if (item.status === 'OnLeave') status = 'OnLeave';
    else if (item.status === 'Suspended') status = 'Suspended';

    return {
      id: item.id,
      name: item.fullName || '',
      email: item.email || '',
      phone: item.phoneNumber || '',
      role: roleAr,
      roleEn: roleEn,
      department: departmentAr,
      departmentEn: departmentEn,
      salary: item.salary > 0 ? item.salary : defaultSalary,
      allowances: item.allowances > 0 ? item.allowances : defaultAllowances,
      contractStart: item.contractStart ? item.contractStart.split('T')[0] : '',
      contractEnd: item.contractEnd ? item.contractEnd.split('T')[0] : '',
      status
    };
  }

  filteredEmployees = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const dept = this.filterDept();
    return this.employees().filter(emp => {
      const matchSearch = !term || emp.name.toLowerCase().includes(term) || emp.email.toLowerCase().includes(term);
      const matchDept = dept === 'all' || emp.departmentEn.toLowerCase() === dept.toLowerCase();
      return matchSearch && matchDept;
    });
  });

  openEmployeeDrawer(emp: HREmployee) {
    this.selectedEmployee.set(emp);
    this.editMode.set(false);
  }

  closeDrawer() {
    this.selectedEmployee.set(null);
    this.editMode.set(false);
  }

  enterEditMode() {
    const emp = this.selectedEmployee();
    if (!emp) return;
    this.editPhone = emp.phone;
    this.editContractStart = emp.contractStart;
    this.editContractEnd = emp.contractEnd;
    this.editSalary = emp.salary;
    this.editAllowances = emp.allowances;
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
  }

  saveHRProfile() {
    const emp = this.selectedEmployee();
    if (!emp) return;
    this.isSaving.set(true);

    const payload: any = {};
    if (this.editPhone !== emp.phone) payload.phoneNumber = this.editPhone;
    if (this.editContractStart !== emp.contractStart) payload.contractStart = this.editContractStart;
    if (this.editContractEnd !== emp.contractEnd) payload.contractEnd = this.editContractEnd;
    if (this.editSalary !== emp.salary) payload.salary = Number(this.editSalary);
    if (this.editAllowances !== emp.allowances) payload.allowances = Number(this.editAllowances);

    this.authService.updateUserHRProfile(emp.id, payload).subscribe({
      next: (res) => {
        if (res?.success) {
          // Update local state
          const updated: HREmployee = {
            ...emp,
            phone: this.editPhone,
            contractStart: this.editContractStart,
            contractEnd: this.editContractEnd,
            salary: Number(this.editSalary),
            allowances: Number(this.editAllowances)
          };
          this.employees.update(list => list.map(e => e.id === emp.id ? updated : e));
          this.selectedEmployee.set(updated);
          this.editMode.set(false);
          this.toastService.success(
            this.i18n.isRtl() ? `تم تحديث بيانات الموظف "${emp.name}" بنجاح` : `Employee "${emp.name}" profile updated`,
            this.i18n.isRtl() ? 'تحديث الملف' : 'Profile Updated'
          );
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل حفظ بيانات الموظف' : 'Failed to save employee profile'
        );
        this.isSaving.set(false);
      }
    });
  }

  printPayslip(monthLabel: string, emp: HREmployee) {
    const total = emp.salary + emp.allowances;
    const win = window.open('', '_blank', 'width=700,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Payslip — ${emp.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; direction: ${this.i18n.isRtl() ? 'rtl' : 'ltr'}; }
        h2 { border-bottom: 2px solid #7c3aed; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td { padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 14px; }
        td:first-child { font-weight: bold; color: #64748b; width: 50%; }
        .total { background: #f5f3ff; font-weight: bold; font-size: 16px; }
        .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; }
      </style></head><body>
      <h2>كشف الراتب — ${monthLabel}</h2>
      <table>
        <tr><td>الاسم / Name</td><td>${emp.name}</td></tr>
        <tr><td>البريد الإلكتروني / Email</td><td>${emp.email}</td></tr>
        <tr><td>المسمى الوظيفي / Role</td><td>${emp.roleEn}</td></tr>
        <tr><td>القسم / Department</td><td>${emp.departmentEn}</td></tr>
        <tr><td>الراتب الأساسي / Basic Salary</td><td>${emp.salary.toLocaleString()} ر.س</td></tr>
        <tr><td>البدلات / Allowances</td><td>${emp.allowances.toLocaleString()} ر.س</td></tr>
        <tr class="total"><td>الإجمالي / Total</td><td>${total.toLocaleString()} ر.س</td></tr>
      </table>
      <p class="footer">تم الإصدار بواسطة نظام رصد | Generated by Rasd System</p>
      <script>window.print(); window.onafterprint = () => window.close();<\/script>
      </body></html>
    `);
    win.document.close();
  }
}
