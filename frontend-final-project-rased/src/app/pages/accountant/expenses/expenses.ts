import { Component, signal, computed, inject, OnInit, AfterViewInit, ChangeDetectionStrategy, HostBinding, HostListener, ViewChild, ElementRef, effect, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExpenseService } from '../../../services/expense.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { ThemeService } from '../../../services/theme.service';

export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  vendorName: string;
  expenseDate: string;
  status: string;
  notes?: string;
}

export interface DashboardData {
  totalExpenses: number;
  monthlyTotal: number;
  categorySummary: { category: string; total: number; count: number }[];
  recentExpenses: Expense[];
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpensesComponent implements OnInit, AfterViewInit {
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);

  @ViewChild('premiumModal') premiumModalRef!: ElementRef;
  @ViewChild('modalOverlay') overlayRef!: ElementRef;
  private overlayMoved = false;

  @HostBinding('class.light-theme') get isLightTheme() {
    return this.themeService.currentTheme() === 'light';
  }

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);
  showSuccess = signal(false);
  editMode = signal(false);

  constructor() {
    effect(() => {
      if (this.showModal()) {
        if (!this.overlayMoved && this.overlayRef?.nativeElement) {
          this.renderer.appendChild(document.body, this.overlayRef.nativeElement);
          this.overlayMoved = true;
        }
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  dashboard = signal<DashboardData | null>(null);
  expenses = signal<Expense[]>([]);

  selectedCategory = signal('All');
  searchQuery = signal('');

  categories = ['All', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Office', 'Travel', 'Other'];
  statusOptions = ['Pending', 'Approved', 'Rejected'];

  formExpense: Expense = this.emptyExpense();

  categoryColors: Record<string, string> = {
    Rent: 'primary',
    Utilities: 'warning',
    Salaries: 'info',
    Marketing: 'success',
    Office: 'secondary',
    Travel: 'orange',
    Other: 'dark'
  };

  totalExpenses = computed(() => this.dashboard()?.totalExpenses ?? 0);
  monthlyTotal = computed(() => this.dashboard()?.monthlyTotal ?? 0);
  categorySummary = computed(() => this.dashboard()?.categorySummary ?? []);
  topCategory = computed(() => {
    const cats = this.categorySummary();
    if (cats.length === 0) return null;
    return cats.reduce((max, c) => (c.total > max.total ? c : max), cats[0]);
  });
  categoryCount = computed(() => this.categorySummary().length);

  maxCategoryTotal = computed(() => {
    const cats = this.categorySummary();
    if (cats.length === 0) return 1;
    return Math.max(...cats.map(c => c.total), 1);
  });

  filteredExpenses = computed(() => {
    let list = this.expenses();
    const cat = this.selectedCategory();
    const q = this.searchQuery().trim().toLowerCase();
    if (cat !== 'All') list = list.filter(e => e.category === cat);
    if (q) list = list.filter(e =>
      e.description.toLowerCase().includes(q) ||
      e.vendorName.toLowerCase().includes(q)
    );
    return list;
  });

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.overlayMoved && this.overlayRef?.nativeElement) {
        this.renderer.appendChild(document.body, this.overlayRef.nativeElement);
        this.overlayMoved = true;
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showModal()) this.closeModal();
  }

  private loadData(): void {
    this.loading.set(true);
    this.expenseService.getExpenseDashboard().subscribe({
      next: (res) => {
        this.dashboard.set(res && res.success ? res.data : res);
        this.loadExpenses();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadExpenses(): void {
    this.expenseService.getExpenses(
      this.selectedCategory() !== 'All' ? this.selectedCategory() : undefined,
      this.searchQuery() || undefined
    ).subscribe({
      next: (res: any) => {
        this.expenses.set(res && res.success ? res.data : res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onCategoryChange(cat: string): void {
    this.selectedCategory.set(cat);
    this.loadExpenses();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.loadExpenses();
  }

  private emptyExpense(): Expense {
    return {
      id: 0,
      description: '',
      category: 'Rent',
      amount: 0,
      vendorName: '',
      expenseDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      notes: ''
    };
  }

  openAddModal(): void {
    this.editMode.set(false);
    this.showSuccess.set(false);
    this.formExpense = this.emptyExpense();
    this.showModal.set(true);
  }

  openEditModal(expense: Expense): void {
    this.editMode.set(true);
    this.showSuccess.set(false);
    this.formExpense = { ...expense };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.showSuccess.set(false);
  }

  onSubmit(): void {
    const f = this.formExpense;
    if (!f.description || !f.vendorName || f.amount <= 0) return;

    this.submitting.set(true);
    const payload = {
      description: f.description,
      category: f.category,
      amount: f.amount,
      vendorName: f.vendorName,
      expenseDate: new Date(f.expenseDate).toISOString(),
      status: f.status,
      notes: f.notes || ''
    };

    if (this.editMode()) {
      this.expenseService.updateExpense(f.id, payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showSuccess.set(true);
          this.loadData();
        },
        error: () => {
          this.submitting.set(false);
        }
      });
    } else {
      this.expenseService.createExpense(payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.showSuccess.set(true);
          this.loadData();
        },
        error: () => {
          this.submitting.set(false);
        }
      });
    }
  }

  deleteExpense(id: number): void {
    const msg = this.i18n.currentLang() === 'ar'
      ? 'هل أنت متأكد من حذف هذه المصروفات؟'
      : 'Are you sure you want to delete this expense?';
    if (!confirm(msg)) return;

    this.expenseService.deleteExpense(id).subscribe({
      next: () => {
        this.loadData();
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      default: return 'badge-primary';
    }
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const locale = this.i18n.isRtl() ? 'ar-SA' : 'en-US';
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  categoryLabel(cat: string): string {
    const key = 'expenses.category.' + cat;
    const t = this.i18n.t(key);
    return t !== key ? t : cat;
  }

  statusLabel(status: string): string {
    const key = 'expenses.status.' + status;
    const t = this.i18n.t(key);
    return t !== key ? t : status;
  }
}
