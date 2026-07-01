import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { LeaveService } from '../../../services/leave.service';
import { AuthService } from '../../../services/auth.service';

export interface CompanyLeaveRequest {
  id: number;
  employeeName: string;
  employeeId: number;
  department: string;
  departmentEn: string;
  leaveType: string;
  leaveTypeEn: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  impactType: 'Paid' | 'Unpaid' | 'Partial';
  impactDetails: string;
  impactDetailsEn: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
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
  private authService = inject(AuthService);

  requests = signal<CompanyLeaveRequest[]>([]);
  employees = signal<any[]>([]);
  isLoading = signal(true);

  // Filters
  statusFilter = signal<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  searchTerm = signal('');

  // Reject modal
  showRejectModal = signal(false);
  rejectTargetId = signal<number | null>(null);
  rejectReason = '';

  // Create modal
  showCreateModal = signal(false);
  newEmployeeId = signal<number | null>(null);
  newLeaveType = 'Annual';
  newStartDate = '';
  newEndDate = '';
  newReason = '';
  isSubmitting = signal(false);

  leaveTypes = [
    { value: 'Annual',    labelAr: 'إجازة سنوية',     labelEn: 'Annual Leave' },
    { value: 'Sick',      labelAr: 'إجازة مرضية',     labelEn: 'Sick Leave' },
    { value: 'Unpaid',    labelAr: 'إجازة بدون راتب', labelEn: 'Unpaid Leave' },
    { value: 'Emergency', labelAr: 'إجازة طارئة',     labelEn: 'Emergency Leave' },
    { value: 'Personal',  labelAr: 'إجازة شخصية',     labelEn: 'Personal Leave' },
  ];

  // Stats
  stats = computed(() => {
    const all = this.requests();
    return {
      total: all.length,
      pending: all.filter(r => r.status === 'Pending').length,
      approved: all.filter(r => r.status === 'Approved').length,
      rejected: all.filter(r => r.status === 'Rejected').length,
    };
  });

  // Filtered list
  filtered = computed(() => {
    const status = this.statusFilter();
    const term = this.searchTerm().toLowerCase().trim();
    return this.requests().filter(r => {
      const matchStatus = status === 'All' || r.status === status;
      const matchSearch = !term || r.employeeName.toLowerCase().includes(term);
      return matchStatus && matchSearch;
    });
  });

  ngOnInit() {
    this.loadRequests();
    this.loadEmployees();
  }

  loadRequests() {
    this.isLoading.set(true);
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.requests.set(res.data.map((item: any) => this.mapRequest(item)));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحميل طلبات الإجازات' : 'Failed to load leave requests'
        );
        this.isLoading.set(false);
      }
    });
  }

  loadEmployees() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.employees.set(res.data);
        }
      }
    });
  }

  mapRequest(item: any): CompanyLeaveRequest {
    const leaveType = item.leaveType || '';
    let leaveTypeAr = leaveType, leaveTypeEn = leaveType;
    let impactType: 'Paid' | 'Unpaid' | 'Partial' = 'Paid';
    let impactDetails = '', impactDetailsEn = '';

    switch (leaveType.toLowerCase()) {
      case 'annual':
        leaveTypeAr = 'سنوية'; leaveTypeEn = 'Annual Leave';
        impactType = 'Paid'; impactDetails = 'مدفوعة بالكامل (رصيد سنوي)'; impactDetailsEn = 'Fully Paid (Annual Balance)';
        break;
      case 'sick':
        leaveTypeAr = 'مرضية'; leaveTypeEn = 'Sick Leave';
        impactType = 'Paid'; impactDetails = 'مدفوعة بالكامل (تقرير طبي)'; impactDetailsEn = 'Fully Paid (Medical Report)';
        break;
      case 'unpaid':
        leaveTypeAr = 'بدون راتب'; leaveTypeEn = 'Unpaid Leave';
        impactType = 'Unpaid'; impactDetails = 'خصم من الراتب الأساسي'; impactDetailsEn = 'Deducted from basic salary';
        break;
      case 'emergency':
        leaveTypeAr = 'طارئة'; leaveTypeEn = 'Emergency Leave';
        impactType = 'Partial'; impactDetails = 'خصم 50% من بدل اليوم'; impactDetailsEn = '50% daily allowance deduction';
        break;
      case 'personal':
        leaveTypeAr = 'شخصية'; leaveTypeEn = 'Personal Leave';
        impactType = 'Partial'; impactDetails = 'خصم 50% من بدل اليوم'; impactDetailsEn = '50% daily allowance deduction';
        break;
    }

    const roleName = item.roleName || '';
    let departmentAr = 'القسم العام', departmentEn = 'General';
    if (roleName === 'Owner' || roleName === 'SystemAdmin')          { departmentAr = 'الإدارة العليا';  departmentEn = 'Executive Management'; }
    else if (roleName === 'Accountant')                              { departmentAr = 'القسم المالي';   departmentEn = 'Finance'; }
    else if (roleName === 'SalesManager' || roleName === 'Sales')    { departmentAr = 'المبيعات';      departmentEn = 'Sales'; }
    else if (roleName === 'EmployeeManager' || roleName === 'Employee') { departmentAr = 'القسم التقني'; departmentEn = 'Technology'; }
    else if (roleName === 'HR')                                      { departmentAr = 'الموارد البشرية'; departmentEn = 'Human Resources'; }

    return {
      id: item.id,
      employeeName: item.employeeName || '',
      employeeId: item.employeeId || 0,
      department: departmentAr,
      departmentEn,
      leaveType: leaveTypeAr,
      leaveTypeEn,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      days: item.totalDays || 0,
      reason: item.reason || '',
      impactType,
      impactDetails,
      impactDetailsEn,
      status: item.status || 'Pending',
      rejectionReason: item.rejectionReason || ''
    };
  }

  // ── Approve ──
  approveRequest(id: number) {
    this.leaveService.approveLeaveRequest(id).subscribe({
      next: (res) => {
        if (res?.success) {
          const name = this.requests().find(r => r.id === id)?.employeeName || '';
          this.requests.update(list => list.map(r => r.id === id ? { ...r, status: 'Approved' as const } : r));
          this.toastService.success(
            this.i18n.isRtl() ? `تم اعتماد إجازة "${name}"` : `Leave for "${name}" approved`,
            this.i18n.isRtl() ? 'اعتماد الإجازة' : 'Approved'
          );
        }
      },
      error: (err) => this.toastService.error(err?.error?.message || (this.i18n.isRtl() ? 'فشل اعتماد الطلب' : 'Failed to approve'))
    });
  }

  // ── Reject (open modal for reason) ──
  openRejectModal(id: number) {
    this.rejectTargetId.set(id);
    this.rejectReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.rejectTargetId.set(null);
  }

  confirmReject() {
    const id = this.rejectTargetId();
    if (id == null) return;
    this.leaveService.rejectLeaveRequest(id, this.rejectReason).subscribe({
      next: (res) => {
        if (res?.success) {
          const name = this.requests().find(r => r.id === id)?.employeeName || '';
          this.requests.update(list => list.map(r =>
            r.id === id ? { ...r, status: 'Rejected' as const, rejectionReason: this.rejectReason } : r
          ));
          this.toastService.warning(
            this.i18n.isRtl() ? `تم رفض إجازة "${name}"` : `Leave for "${name}" rejected`,
            this.i18n.isRtl() ? 'رفض الإجازة' : 'Rejected'
          );
          this.closeRejectModal();
        }
      },
      error: (err) => this.toastService.error(err?.error?.message || (this.i18n.isRtl() ? 'فشل رفض الطلب' : 'Failed to reject'))
    });
  }

  // ── Delete ──
  deleteRequest(id: number) {
    const name = this.requests().find(r => r.id === id)?.employeeName || '';
    const msg = this.i18n.isRtl()
      ? `هل أنت متأكد من حذف طلب إجازة "${name}"؟`
      : `Delete leave request for "${name}"?`;
    if (!confirm(msg)) return;

    this.leaveService.deleteLeaveRequest(id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.requests.update(list => list.filter(r => r.id !== id));
          this.toastService.success(
            this.i18n.isRtl() ? 'تم حذف الطلب بنجاح' : 'Request deleted',
            this.i18n.isRtl() ? 'حذف' : 'Deleted'
          );
        }
      },
      error: () => this.toastService.error(this.i18n.isRtl() ? 'فشل حذف الطلب' : 'Failed to delete')
    });
  }

  // ── Create (HR on behalf of employee) ──
  openCreateModal() {
    this.newEmployeeId.set(null);
    this.newLeaveType = 'Annual';
    this.newStartDate = '';
    this.newEndDate = '';
    this.newReason = '';
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  submitCreate() {
    const empId = this.newEmployeeId();
    if (!empId || !this.newStartDate || !this.newEndDate) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields'
      );
      return;
    }
    const emp = this.employees().find(e => e.id === empId);
    this.isSubmitting.set(true);
    this.leaveService.createLeaveRequest({
      employeeId: empId,
      roleId: emp?.roleId || 7,
      leaveType: this.newLeaveType,
      startDate: this.newStartDate,
      endDate: this.newEndDate,
      reason: this.newReason
    }).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toastService.success(
            this.i18n.isRtl() ? 'تم تقديم طلب الإجازة بنجاح' : 'Leave request submitted',
            this.i18n.isRtl() ? 'طلب إجازة' : 'Leave Request'
          );
          this.loadRequests();
          this.closeCreateModal();
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.toastService.error(
          err?.error?.message || (this.i18n.isRtl() ? 'فشل تقديم الطلب' : 'Failed to submit request')
        );
        this.isSubmitting.set(false);
      }
    });
  }

  calcDays(): number {
    if (!this.newStartDate || !this.newEndDate) return 0;
    const diff = new Date(this.newEndDate).getTime() - new Date(this.newStartDate).getTime();
    return Math.max(0, Math.ceil(diff / 86400000) + 1);
  }
}
