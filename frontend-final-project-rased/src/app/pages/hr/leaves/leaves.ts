import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { LeaveService } from '../../../services/leave.service';

export interface CompanyLeaveRequest {
  id: number;
  employeeName: string;
  department: string;
  departmentEn: string;
  leaveType: string;
  leaveTypeEn: string;
  startDate: string;
  endDate: string;
  days: number;
  impactType: 'Paid' | 'Unpaid' | 'Partial';
  impactDetails: string;
  impactDetailsEn: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

@Component({
  selector: 'app-hr-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaves.html',
  styleUrls: ['./leaves.css']
})
export class HRLeaves implements OnInit {
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);
  private leaveService = inject(LeaveService);

  requests = signal<CompanyLeaveRequest[]>([]);

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const mapped = res.data.map((item: any) => this.mapToCompanyLeaveRequest(item));
          this.requests.set(mapped);
        }
      },
      error: (err) => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحميل طلبات الإجازات' : 'Failed to load leave requests',
          this.i18n.isRtl() ? 'خطأ' : 'Error'
        );
      }
    });
  }

  mapToCompanyLeaveRequest(item: any): CompanyLeaveRequest {
    const leaveType = item.leaveType || '';
    let leaveTypeAr = '';
    let leaveTypeEn = '';
    let impactType: 'Paid' | 'Unpaid' | 'Partial' = 'Paid';
    let impactDetails = '';
    let impactDetailsEn = '';

    switch (leaveType.toLowerCase()) {
      case 'annual':
        leaveTypeAr = 'سنوية';
        leaveTypeEn = 'Annual Leave';
        impactType = 'Paid';
        impactDetails = 'مدفوعة بالكامل (رصيد إجازات سنوي)';
        impactDetailsEn = 'Fully Paid (Annual Balance)';
        break;
      case 'sick':
        leaveTypeAr = 'مرضية طارئة';
        leaveTypeEn = 'Sick Leave';
        impactType = 'Paid';
        impactDetails = 'مدفوعة بالكامل (تقرير طبي معتمد)';
        impactDetailsEn = 'Fully Paid (Certified Medical)';
        break;
      case 'unpaid':
        leaveTypeAr = 'دون راتب';
        leaveTypeEn = 'Unpaid Leave';
        impactType = 'Unpaid';
        impactDetails = 'خصم من الراتب الأساسي';
        impactDetailsEn = 'Deducted from basic salary';
        break;
      case 'emergency':
        leaveTypeAr = 'طارئة';
        leaveTypeEn = 'Emergency Leave';
        impactType = 'Partial';
        impactDetails = 'خصم 50% من بدلات اليوم الواحد';
        impactDetailsEn = '50% deduction of daily allowance';
        break;
      case 'personal':
        leaveTypeAr = 'شخصية اضطرارية';
        leaveTypeEn = 'Personal Leave';
        impactType = 'Partial';
        impactDetails = 'خصم 50% من بدلات اليوم الواحد';
        impactDetailsEn = '50% deduction of daily allowance';
        break;
      default:
        leaveTypeAr = leaveType;
        leaveTypeEn = leaveType;
        impactType = 'Paid';
        impactDetails = 'مدفوعة بالكامل';
        impactDetailsEn = 'Fully Paid';
        break;
    }

    const roleName = item.roleName || '';
    let departmentAr = 'القسم العام';
    let departmentEn = 'General';
    if (roleName === 'Owner') {
      departmentAr = 'الإدارة العليا';
      departmentEn = 'Executive Management';
    } else if (roleName === 'Accountant') {
      departmentAr = 'القسم المالي';
      departmentEn = 'Finance Department';
    } else if (roleName === 'SalesManager' || roleName === 'Sales') {
      departmentAr = 'إدارة المبيعات';
      departmentEn = 'Sales Department';
    } else if (roleName === 'EmployeeManager' || roleName === 'Employee') {
      departmentAr = 'القسم التقني';
      departmentEn = 'Technology Department';
    } else if (roleName === 'HR') {
      departmentAr = 'الموارد البشرية';
      departmentEn = 'Human Resources';
    }

    return {
      id: item.id,
      employeeName: item.employeeName || '',
      department: departmentAr,
      departmentEn: departmentEn,
      leaveType: leaveTypeAr,
      leaveTypeEn: leaveTypeEn,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      days: item.totalDays || 0,
      impactType: impactType,
      impactDetails: impactDetails,
      impactDetailsEn: impactDetailsEn,
      status: item.status || 'Pending'
    };
  }

  approveRequest(id: number) {
    this.leaveService.approveLeaveRequest(id).subscribe({
      next: (res) => {
        if (res && res.success) {
          const req = this.requests().find(r => r.id === id);
          const empName = req ? req.employeeName : '';
          
          this.requests.update(prev =>
            prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r)
          );

          const msg = this.i18n.isRtl()
            ? `تم اعتماد طلب الإجازة للموظف/ة "${empName}" بنجاح وتحديث كشف الرواتب`
            : `Leave request for "${empName}" approved successfully.`;
          this.toastService.success(msg, this.i18n.isRtl() ? 'اعتماد الإجازة' : 'Leave Approved');
        }
      },
      error: (err) => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل اعتماد طلب الإجازة' : 'Failed to approve leave request',
          this.i18n.isRtl() ? 'خطأ' : 'Error'
        );
      }
    });
  }

  rejectRequest(id: number) {
    this.leaveService.rejectLeaveRequest(id).subscribe({
      next: (res) => {
        if (res && res.success) {
          const req = this.requests().find(r => r.id === id);
          const empName = req ? req.employeeName : '';
          
          this.requests.update(prev =>
            prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r)
          );

          const msg = this.i18n.isRtl()
            ? `تم رفض طلب الإجازة للموظف/ة "${empName}" وإخطار مشرف القسم`
            : `Leave request for "${empName}" rejected.`;
          this.toastService.warning(msg, this.i18n.isRtl() ? 'رفض الإجازة' : 'Leave Rejected');
        }
      },
      error: (err) => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل رفض طلب الإجازة' : 'Failed to reject leave request',
          this.i18n.isRtl() ? 'خطأ' : 'Error'
        );
      }
    });
  }
}
