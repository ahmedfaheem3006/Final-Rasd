import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../../services/crm.service';

interface Client {
  id: number;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  status: string;
  createdByUserName: string;
  createdAt: string;
}

interface Note {
  id: number;
  content: string;
  createdAt: string;
  createdByUser?: { fullName: string };
}

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-customers',
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css'
})
export class Customers implements OnInit {
  private crmService = inject(CrmService);

  clients = signal<Client[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  searchQuery = signal('');
  statusFilter = signal('all');
  modalMode = signal<ModalMode>(null);
  deleteTargetId = signal<number | null>(null);
  viewClient = signal<Client | null>(null);
  notes = signal<Note[]>([]);
  newNote = '';
  isAddingNote = signal(false);

  form = {
    id: 0, name: '', email: '', phone: '', companyName: '', status: 'Active'
  };

  stats = computed(() => {
    const all = this.clients();
    const now = new Date();
    const thisMonth = all.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      total: all.length,
      active: all.filter(c => c.status === 'Active').length,
      newThisMonth: thisMonth.length,
      inactive: all.filter(c => c.status !== 'Active').length,
    };
  });

  filteredClients = computed(() => {
    let list = this.clients();
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.companyName ?? '').toLowerCase().includes(q)
    );
    if (s !== 'all') list = list.filter(c => c.status === s);
    return list;
  });

  ngOnInit() { this.loadClients(); }

  loadClients() {
    this.isLoading.set(true);
    this.crmService.getClients().subscribe({
      next: (r: any) => {
        this.clients.set(r?.data ?? r ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreate() {
    this.form = { id: 0, name: '', email: '', phone: '', companyName: '', status: 'Active' };
    this.modalMode.set('create');
  }

  openEdit(c: Client) {
    this.form = { id: c.id, name: c.name, email: c.email ?? '', phone: c.phone ?? '', companyName: c.companyName ?? '', status: c.status };
    this.modalMode.set('edit');
  }

  closeModal() { this.modalMode.set(null); }

  save() {
    if (!this.form.name.trim()) return;
    this.isSaving.set(true);
    const payload = { name: this.form.name, email: this.form.email || undefined, phone: this.form.phone || undefined, companyName: this.form.companyName || undefined, status: this.form.status };

    if (this.modalMode() === 'create') {
      this.crmService.createClient(payload).subscribe({
        next: (r: any) => {
          const d = r?.data ?? r;
          if (d?.id) this.clients.update(l => [...l, d]);
          this.isSaving.set(false); this.closeModal();
        },
        error: () => this.isSaving.set(false)
      });
    } else {
      this.crmService.updateClient(this.form.id, payload).subscribe({
        next: (r: any) => {
          const d = r?.data ?? r;
          if (d?.id) this.clients.update(l => l.map(x => x.id === d.id ? d : x));
          if (this.viewClient()?.id === d?.id) this.viewClient.set(d);
          this.isSaving.set(false); this.closeModal();
        },
        error: () => this.isSaving.set(false)
      });
    }
  }

  confirmDelete(id: number) { this.deleteTargetId.set(id); }
  cancelDelete() { this.deleteTargetId.set(null); }

  deleteClient() {
    const id = this.deleteTargetId();
    if (!id) return;
    this.crmService.deleteClient(id).subscribe({
      next: () => {
        this.clients.update(l => l.filter(c => c.id !== id));
        this.deleteTargetId.set(null);
        if (this.viewClient()?.id === id) this.viewClient.set(null);
      }
    });
  }

  openView(c: Client) {
    this.viewClient.set(c);
    this.notes.set([]);
    this.newNote = '';
    this.loadNotes(c.id);
  }

  closeView() { this.viewClient.set(null); }

  loadNotes(clientId: number) {
    this.crmService.getClientNotes(clientId).subscribe({
      next: (r: any) => this.notes.set(r?.data ?? r ?? [])
    });
  }

  addNote() {
    const c = this.viewClient();
    if (!c || !this.newNote.trim()) return;
    this.isAddingNote.set(true);
    this.crmService.addClientNote(c.id, this.newNote.trim()).subscribe({
      next: (r: any) => {
        const n = r?.data ?? r;
        if (n) this.notes.update(l => [n, ...l]);
        this.newNote = '';
        this.isAddingNote.set(false);
      },
      error: () => this.isAddingNote.set(false)
    });
  }

  exportCSV() {
    const headers = ['الاسم', 'الشركة', 'البريد', 'الهاتف', 'الحالة', 'أُضيف بواسطة', 'تاريخ الإضافة'];
    const rows = this.filteredClients().map(c => [
      c.name, c.companyName ?? '', c.email ?? '', c.phone ?? '',
      c.status, c.createdByUserName, c.createdAt?.split('T')[0]
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { 'Active': 'نشط', 'Inactive': 'غير نشط', 'Pending': 'يحتاج متابعة' };
    return m[s] ?? s;
  }

  statusClass(s: string): string {
    const m: Record<string, string> = { 'Active': 'badge-success', 'Inactive': 'badge-danger', 'Pending': 'badge-warning' };
    return m[s] ?? 'badge-warning';
  }

  initials(name: string): string {
    return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '؟';
  }
}
