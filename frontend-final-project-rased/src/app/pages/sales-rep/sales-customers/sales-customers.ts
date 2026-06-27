import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Customer {
  name: string;
  company: string;
  phone: string;
  email: string;
  status: 'active' | 'interested' | 'unreachable';
  lastContact: string;
  avatar: string;
}

@Component({
  selector: 'app-sales-customers',
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-customers.html',
  styleUrl: './sales-customers.css'
})
export class SalesCustomers {
  customers = signal<Customer[]>([
    { name: 'عبد الرحمن الرويلي', company: 'مجموعة الرويلي للتجارة', phone: '0501234567', email: 'alruwaili@company.sa', status: 'active', lastContact: 'اليوم', avatar: 'عر' },
    { name: 'خالد الحربي', company: 'شركة الأفق الرقمي', phone: '0519876543', email: 'harbi@alofooq.sa', status: 'interested', lastContact: 'أمس', avatar: 'خح' },
    { name: 'هدى السليمان', company: 'مؤسسة الإبداع المتكامل', phone: '0531112223', email: 'huda@ebdaa.sa', status: 'active', lastContact: '13 يونيو', avatar: 'هس' },
    { name: 'سلطان القحطاني', company: 'سعودي إكسبريس ش.م', phone: '0554445556', email: 'sultan@saudix.sa', status: 'unreachable', lastContact: '10 يونيو', avatar: 'سق' },
    { name: 'مريم الدوسري', company: 'مجموعة المجد للتسويق', phone: '0567778889', email: 'mariam@almajd.sa', status: 'interested', lastContact: '8 يونيو', avatar: 'مد' }
  ]);

  searchTerm = signal('');
  selectedStatus = signal('all');
  isModalOpen = signal(false);

  // Form Fields
  newName = '';
  newCompany = '';
  newPhone = '';
  newEmail = '';
  newStatus: 'active' | 'interested' | 'unreachable' = 'interested';

  filteredCustomers = computed(() => {
    let list = this.customers();
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();

    if (search) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.company.toLowerCase().includes(search) || 
        c.email.toLowerCase().includes(search) ||
        c.phone.includes(search)
      );
    }

    if (status !== 'all') {
      list = list.filter(c => c.status === status);
    }

    return list;
  });

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  addCustomer() {
    if (!this.newName || !this.newCompany || !this.newEmail) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const initials = this.newName.split(' ').map(n => n[0]).join('').slice(0, 2);

    const newCust: Customer = {
      name: this.newName,
      company: this.newCompany,
      phone: this.newPhone || 'غير متوفر',
      email: this.newEmail,
      status: this.newStatus,
      lastContact: 'اليوم',
      avatar: initials || 'عم'
    };

    this.customers.update(prev => [newCust, ...prev]);
    this.closeModal();
  }

  private resetForm() {
    this.newName = '';
    this.newCompany = '';
    this.newPhone = '';
    this.newEmail = '';
    this.newStatus = 'interested';
  }
}

