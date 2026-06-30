import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';

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

  searchTerm = signal('');
  filterDept = signal('all');

  employees = signal<HREmployee[]>([]);

  selectedEmployee = signal<HREmployee | null>(null);

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const mapped = res.data.map((item: any) => this.mapToHREmployee(item));
          this.employees.set(mapped);
        }
      }
    });
  }

  mapToHREmployee(item: any): HREmployee {
    const roleName = item.roleName || '';
    let roleAr = roleName;
    let roleEn = roleName;
    let departmentAr = 'القسم العام';
    let departmentEn = 'General';
    let salary = 10000;
    let allowances = 1500;

    switch (roleName.toLowerCase()) {
      case 'systemadmin':
        roleAr = 'مدير النظام الفني';
        roleEn = 'System Administrator';
        departmentAr = 'الإدارة العليا';
        departmentEn = 'Executive Management';
        salary = 20000;
        allowances = 4000;
        break;
      case 'owner':
        roleAr = 'مالك الشركة';
        roleEn = 'Company Owner';
        departmentAr = 'الإدارة العليا';
        departmentEn = 'Executive Management';
        salary = 25000;
        allowances = 5000;
        break;
      case 'accountant':
        roleAr = 'المحاسب المالي';
        roleEn = 'Financial Accountant';
        departmentAr = 'القسم المالي';
        departmentEn = 'Finance';
        salary = 12000;
        allowances = 2000;
        break;
      case 'salesmanager':
        roleAr = 'مدير المبيعات';
        roleEn = 'Sales Manager';
        departmentAr = 'إدارة المبيعات';
        departmentEn = 'Sales';
        salary = 16000;
        allowances = 4500;
        break;
      case 'sales':
        roleAr = 'مندوب مبيعات';
        roleEn = 'Sales Specialist';
        departmentAr = 'إدارة المبيعات';
        departmentEn = 'Sales';
        salary = 9500;
        allowances = 3000;
        break;
      case 'employeemanager':
        roleAr = 'مدير الموظفين للقسم';
        roleEn = 'Department Manager';
        departmentAr = 'القسم التقني';
        departmentEn = 'Technology';
        salary = 14500;
        allowances = 2500;
        break;
      case 'employee':
        roleAr = 'موظف عمليات';
        roleEn = 'Operations Employee';
        departmentAr = 'القسم التقني';
        departmentEn = 'Technology';
        salary = 11000;
        allowances = 1500;
        break;
      case 'hr':
        roleAr = 'مدير الموارد البشرية';
        roleEn = 'HR Manager';
        departmentAr = 'الموارد البشرية';
        departmentEn = 'Human Resources';
        salary = 13500;
        allowances = 2500;
        break;
    }

    // Determine status: backend Status can be "Active", "OnLeave", "Suspended"
    let status: 'Active' | 'OnLeave' | 'Suspended' = 'Active';
    if (item.status === 'OnLeave') status = 'OnLeave';
    else if (item.status === 'Suspended') status = 'Suspended';

    const id = item.id || 1;
    const phone = `+966 50 ${100 + id} ${2000 + id}`;
    const contractStart = `2024-0${(id % 8) + 1}-15`;
    const contractEnd = `2026-0${(id % 8) + 1}-14`;

    return {
      id: id,
      name: item.fullName || '',
      email: item.email || '',
      phone: phone,
      role: roleAr,
      roleEn: roleEn,
      department: departmentAr,
      departmentEn: departmentEn,
      salary: salary,
      allowances: allowances,
      contractStart: contractStart,
      contractEnd: contractEnd,
      status: status
    };
  }

  // Filtered employees list
  filteredEmployees = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const dept = this.filterDept();

    return this.employees().filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(term) || emp.email.toLowerCase().includes(term);
      const matchesDept = dept === 'all' || emp.departmentEn.toLowerCase() === dept.toLowerCase();
      return matchesSearch && matchesDept;
    });
  });

  openEmployeeDrawer(employee: HREmployee) {
    this.selectedEmployee.set(employee);
  }

  closeDrawer() {
    this.selectedEmployee.set(null);
  }
}
