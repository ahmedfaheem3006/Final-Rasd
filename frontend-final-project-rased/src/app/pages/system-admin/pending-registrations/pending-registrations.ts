import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-pending-registrations',
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-registrations.html',
  styleUrl: './pending-registrations.css'
})
export class PendingRegistrations implements OnInit {
  private systemAdminService = inject(SystemAdminService);
  private toastService = inject(ToastService);
  i18n = inject(I18nService);

  registrations = signal<any[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);

  filteredRegistrations = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.registrations();
    if (!query) return list;
    return list.filter(r =>
      (r.companyName || '').toLowerCase().includes(query) ||
      (r.ownerFullName || '').toLowerCase().includes(query) ||
      (r.ownerEmail || '').toLowerCase().includes(query)
    );
  });

  stats = computed(() => {
    const list = this.registrations();
    const total = list.length;
    const pending = list.filter(r => r.status === 'Pending').length;
    const approved = list.filter(r => r.status === 'Approved').length;
    const rejected = list.filter(r => r.status === 'Rejected').length;
    const isAr = this.i18n.currentLang() === 'ar';

    return [
      { label: isAr ? 'إجمالي الطلبات' : 'Total Requests', value: total.toString(), color: 'info' },
      { label: isAr ? 'قيد الانتظار' : 'Pending', value: pending.toString(), color: 'warning' },
      { label: isAr ? 'تمت الموافقة' : 'Approved', value: approved.toString(), color: 'success' },
      { label: isAr ? 'مرفوضة' : 'Rejected', value: rejected.toString(), color: 'danger' }
    ];
  });

  // Modal states
  showApproveModal = signal(false);
  showRejectModal = signal(false);

  selectedRegistration: any = null;
  rejectionReason = '';

  ngOnInit() {
    this.loadPendingRegistrations();
  }

  loadPendingRegistrations() {
    this.isLoading.set(true);
    this.systemAdminService.getPendingRegistrations().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.registrations.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending registrations', err);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل في تحميل طلبات التسجيل المعلقة.' : 'Failed to load pending registration requests.'
        );
        this.isLoading.set(false);
      }
    });
  }

  onApprove(registration: any) {
    this.selectedRegistration = registration;
    this.showApproveModal.set(true);
  }

  closeApproveModal() {
    this.showApproveModal.set(false);
    this.selectedRegistration = null;
  }

  confirmApprove() {
    const id = this.selectedRegistration?.id;
    if (!id) return;

    const isAr = this.i18n.currentLang() === 'ar';
    this.systemAdminService.approvePendingRegistration(id).subscribe({
      next: (res) => {
        this.toastService.success(
          isAr ? `تمت الموافقة على طلب "${this.selectedRegistration.companyName}" وإنشاء الحساب بنجاح!` : `Registration of "${this.selectedRegistration.companyName}" approved and account created!`,
          isAr ? 'موافقة' : 'Approved'
        );
        this.closeApproveModal();
        this.loadPendingRegistrations();
      },
      error: (err) => {
        console.error('Failed to approve registration', err);
        this.toastService.error(
          err.error?.message || (isAr ? 'فشل في الموافقة على الطلب.' : 'Failed to approve request.')
        );
      }
    });
  }

  openRejectModal(registration: any) {
    this.selectedRegistration = registration;
    this.rejectionReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.selectedRegistration = null;
    this.rejectionReason = '';
  }

  confirmReject() {
    const id = this.selectedRegistration?.id;
    if (!id) return;

    const isAr = this.i18n.currentLang() === 'ar';
    this.systemAdminService.rejectPendingRegistration(id, this.rejectionReason || undefined).subscribe({
      next: (res) => {
        this.toastService.success(
          isAr ? `تم رفض طلب "${this.selectedRegistration.companyName}".` : `Registration of "${this.selectedRegistration.companyName}" rejected.`,
          isAr ? 'رفض' : 'Rejected'
        );
        this.closeRejectModal();
        this.loadPendingRegistrations();
      },
      error: (err) => {
        console.error('Failed to reject registration', err);
        this.toastService.error(
          err.error?.message || (isAr ? 'فشل في رفض الطلب.' : 'Failed to reject request.')
        );
      }
    });
  }
}
