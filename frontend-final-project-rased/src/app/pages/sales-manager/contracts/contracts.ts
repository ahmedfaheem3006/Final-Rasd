import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContractService, ContractDto, CreateContractDto, UpdateContractDto } from '../../../services/contract.service';
import { CrmService } from '../../../services/crm.service';
import { AuthService } from '../../../services/auth.service';

type PartyType = 'company' | 'individual' | 'employee';
type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-sm-contracts',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css'
})
export class SmContracts implements OnInit {
  private contractService = inject(ContractService);
  private crmService = inject(CrmService);
  private authService = inject(AuthService);

  contracts = signal<ContractDto[]>([]);
  clients = signal<any[]>([]);
  users = signal<any[]>([]);
  stats = signal<any>(null);
  isLoading = signal(true);
  isSaving = signal(false);

  searchQuery = signal('');
  statusFilter = signal('all');
  modalMode = signal<ModalMode>(null);
  deleteTargetId = signal<number | null>(null);
  viewContract = signal<ContractDto | null>(null);

  // Form fields
  partyType = signal<PartyType>('company');
  form = {
    id: 0,
    clientId: 0,
    employeeId: null as number | null,
    contractTitle: '',
    contractType: 'Custom',
    description: '',
    referenceNumber: '',
    currency: 'SAR',
    contractValue: 0,
    taxPercentage: 15,
    discount: 0,
    finalAmount: 0,
    paymentTerms: 'Custom',
    depositAmount: 0,
    startDate: '',
    endDate: '',
    reminderDays: 30,
    status: 'Draft',
  };

  statusTabs = ['all', 'Draft', 'Active', 'Signed', 'Sent', 'Pending Approval', 'Expired', 'Cancelled', 'Archived'];

  statusColors: Record<string, string> = {
    'Draft': 'status-draft',
    'Active': 'status-active',
    'Signed': 'status-signed',
    'Sent': 'status-sent',
    'Pending Approval': 'status-pending',
    'Expired': 'status-expired',
    'Cancelled': 'status-cancelled',
    'Archived': 'status-archived',
  };

  filteredContracts = computed(() => {
    let list = this.contracts();
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    if (q) list = list.filter(c =>
      c.contractNumber.toLowerCase().includes(q) ||
      c.contractTitle.toLowerCase().includes(q) ||
      c.clientName.toLowerCase().includes(q)
    );
    if (s !== 'all') list = list.filter(c => c.status === s);
    return list;
  });

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.contractService.getContracts().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? data?.value ?? []);
        this.contracts.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.contractService.getStats().subscribe({ next: (s: any) => this.stats.set(s) });
    this.crmService.getClients().subscribe({ next: (r: any) => this.clients.set(r?.data ?? r ?? []) });
    this.authService.getEmployees().subscribe({ next: (r: any) => this.users.set(r?.data ?? r ?? []) });
  }

  openCreate() {
    this.partyType.set('company');
    this.form = {
      id: 0, clientId: 0, employeeId: null,
      contractTitle: '', contractType: 'Custom', description: '', referenceNumber: '',
      currency: 'SAR', contractValue: 0, taxPercentage: 15, discount: 0, finalAmount: 0,
      paymentTerms: 'Custom', depositAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      reminderDays: 30, status: 'Draft'
    };
    this.recalcFinal();
    this.modalMode.set('create');
  }

  openEdit(c: ContractDto) {
    // Detect party type from contractType
    const pt: PartyType = c.contractType === 'Employee' ? 'employee' : 'company';
    this.partyType.set(pt);
    this.form = {
      id: c.id,
      clientId: pt !== 'employee' ? c.clientId : 0,
      employeeId: pt === 'employee' ? c.clientId : null,
      contractTitle: c.contractTitle,
      contractType: c.contractType,
      description: c.description ?? '',
      referenceNumber: c.referenceNumber ?? '',
      currency: c.currency,
      contractValue: c.contractValue,
      taxPercentage: c.taxPercentage,
      discount: c.discount,
      finalAmount: c.finalAmount,
      paymentTerms: c.paymentTerms,
      depositAmount: c.depositAmount,
      startDate: c.startDate?.split('T')[0] ?? '',
      endDate: c.endDate?.split('T')[0] ?? '',
      reminderDays: c.reminderDays,
      status: c.status
    };
    this.modalMode.set('edit');
  }

  closeModal() { this.modalMode.set(null); }

  recalcFinal() {
    const val = +this.form.contractValue || 0;
    const tax = +this.form.taxPercentage || 0;
    const disc = +this.form.discount || 0;
    this.form.finalAmount = +(val + (val * tax / 100) - disc).toFixed(2);
  }

  resolveClientId(): number {
    if (this.partyType() === 'employee') return this.form.employeeId ?? 0;
    return this.form.clientId;
  }

  save() {
    if (!this.form.contractTitle || !this.form.startDate || !this.form.endDate) return;
    this.isSaving.set(true);

    const payload: CreateContractDto = {
      clientId: this.resolveClientId(),
      contractTitle: this.form.contractTitle,
      contractType: this.partyType() === 'employee' ? 'Employee' : this.form.contractType,
      description: this.form.description,
      referenceNumber: this.form.referenceNumber,
      currency: this.form.currency,
      contractValue: +this.form.contractValue,
      taxPercentage: +this.form.taxPercentage,
      discount: +this.form.discount,
      finalAmount: +this.form.finalAmount,
      paymentTerms: this.form.paymentTerms,
      depositAmount: +this.form.depositAmount,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      reminderDays: +this.form.reminderDays,
      status: this.form.status,
    };

    if (this.modalMode() === 'create') {
      this.contractService.createContract(payload).subscribe({
        next: () => { this.isSaving.set(false); this.closeModal(); this.loadAll(); },
        error: () => this.isSaving.set(false)
      });
    } else {
      const updatePayload: UpdateContractDto = { ...payload, id: this.form.id };
      this.contractService.updateContract(this.form.id, updatePayload).subscribe({
        next: () => { this.isSaving.set(false); this.closeModal(); this.loadAll(); },
        error: () => this.isSaving.set(false)
      });
    }
  }

  confirmDelete(id: number) { this.deleteTargetId.set(id); }
  cancelDelete() { this.deleteTargetId.set(null); }

  deleteContract() {
    const id = this.deleteTargetId();
    if (!id) return;
    this.contractService.deleteContract(id).subscribe({
      next: () => { this.deleteTargetId.set(null); this.loadAll(); }
    });
  }

  openView(c: ContractDto) { this.viewContract.set(c); }
  closeView() { this.viewContract.set(null); }

  archiveContract(id: number) {
    this.contractService.archiveContract(id).subscribe({ next: () => this.loadAll() });
  }

  // ── Export ────────────────────────────────────────────────────────────────

  exportCSV() {
    const headers = ['CONTRACT #', 'TITLE', 'CLIENT', 'TYPE', 'VALUE', 'FINAL AMOUNT', 'PAYMENT TERMS', 'START DATE', 'END DATE', 'STATUS', 'CREATED'];
    const rows = this.filteredContracts().map(c => [
      c.contractNumber, c.contractTitle, c.clientName, c.contractType,
      c.contractValue, c.finalAmount, c.paymentTerms,
      c.startDate?.split('T')[0], c.endDate?.split('T')[0],
      c.status, c.createdAt?.split('T')[0]
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    this.downloadFile(csv, 'contracts.csv', 'text/csv');
  }

  exportExcel() {
    const headers = ['CONTRACT #', 'TITLE', 'CLIENT', 'TYPE', 'VALUE', 'FINAL AMOUNT', 'PAYMENT TERMS', 'START DATE', 'END DATE', 'STATUS', 'CREATED'];
    const rows = this.filteredContracts().map(c => [
      c.contractNumber, c.contractTitle, c.clientName, c.contractType,
      c.contractValue, c.finalAmount, c.paymentTerms,
      c.startDate?.split('T')[0], c.endDate?.split('T')[0],
      c.status, c.createdAt?.split('T')[0]
    ]);
    let html = '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    rows.forEach(r => { html += '<tr>' + r.map(v => `<td>${v ?? ''}</td>`).join('') + '</tr>'; });
    html += '</table>';
    this.downloadFile(html, 'contracts.xls', 'application/vnd.ms-excel');
  }

  exportPDF() {
    const list = this.filteredContracts();
    let html = `<html><head><meta charset="utf-8"><title>Contracts</title>
    <style>
      body{font-family:Arial,sans-serif;direction:rtl;padding:20px;font-size:12px}
      h2{text-align:center;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:6px 10px;text-align:right}
      th{background:#4f46e5;color:white}
      tr:nth-child(even){background:#f5f5f5}
    </style></head><body>
    <h2>تقرير العقود — رصد AI</h2>
    <table><tr>
      <th>رقم العقد</th><th>العنوان</th><th>العميل</th><th>القيمة</th>
      <th>المبلغ النهائي</th><th>البداية</th><th>النهاية</th><th>الحالة</th>
    </tr>`;
    list.forEach(c => {
      html += `<tr>
        <td>${c.contractNumber}</td><td>${c.contractTitle}</td><td>${c.clientName}</td>
        <td>${c.contractValue} ${c.currency}</td><td>${c.finalAmount} ${c.currency}</td>
        <td>${c.startDate?.split('T')[0]}</td><td>${c.endDate?.split('T')[0]}</td>
        <td>${c.status}</td></tr>`;
    });
    html += `</table></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  partyLabel(type: string): string {
    const m: Record<string, string> = {
      'Sales': 'مبيعات', 'Service': 'خدمات', 'Maintenance': 'صيانة',
      'Subscription': 'اشتراك', 'Rental': 'إيجار', 'Custom': 'مخصص', 'Employee': 'موظف'
    };
    return m[type] ?? type;
  }

  formatCurrency(val: number, currency: string): string {
    return `${val.toLocaleString('ar-SA')} ${currency}`;
  }
}
