import { Component, inject, OnInit, signal, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { I18nService } from '../../services/i18n.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);
  i18n = inject(I18nService);
  notificationService = inject(NotificationService);

  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser = this.authService.currentUser;
  currentTitle = 'sidebar.dashboard';
  showNotificationsDropdown = signal(false);
  showUserDropdown = signal(false);

  ngOnInit() {
    this.updateTitle(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateTitle(event.urlAfterRedirects || event.url);
      this.showNotificationsDropdown.set(false); // Close dropdown on navigation
      this.showUserDropdown.set(false);
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleLang() {
    this.i18n.toggleLang();
  }

  toggleNotifications(event: MouseEvent) {
    event.stopPropagation();
    this.showNotificationsDropdown.update(v => !v);
    this.showUserDropdown.set(false);
  }

  toggleUserDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showUserDropdown.update(v => !v);
    this.showNotificationsDropdown.set(false);
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.showNotificationsDropdown.set(false);
    this.showUserDropdown.set(false);
  }

  goToProfile() {
    this.showUserDropdown.set(false);
    if (this.currentUser()?.role === 'system-admin') {
      this.router.navigate(['/app/sys-admin/settings']);
    } else {
      this.router.navigate(['/app/employee/profile']);
    }
  }

  logout() {
    this.showUserDropdown.set(false);
    this.authService.logout();
  }

  markAllNotificationsRead() {
    this.notificationService.markAllAsRead();
  }

  private updateTitle(url: string) {
    if (url.includes('sys-admin/overview')) {
      this.currentTitle = 'sidebar.sys_overview';
    } else if (url.includes('sys-admin/tenants')) {
      this.currentTitle = 'sidebar.sys_tenants';
    } else if (url.includes('sys-admin/management')) {
      this.currentTitle = 'sidebar.sys_management';
    } else if (url.includes('sys-admin/support-ai')) {
      this.currentTitle = 'sidebar.sys_support_ai';
    } else if (url.includes('sys-admin/add-tenant')) {
      this.currentTitle = 'sidebar.sys_add_tenant';
    } else if (url.includes('sys-admin/settings')) {
      this.currentTitle = 'sidebar.sys_settings';
    } else if (url.includes('owner/dashboard')) {
      this.currentTitle = 'sidebar.dashboard';
    } else if (url.includes('owner/users')) {
      this.currentTitle = 'sidebar.users';
    } else if (url.includes('owner/deals')) {
      this.currentTitle = 'sidebar.deals';
    } else if (url.includes('owner/leaves')) {
      this.currentTitle = 'sidebar.leaves';
    } else if (url.includes('owner/meetings')) {
      this.currentTitle = 'sidebar.meetings';
    } else if (url.includes('owner/reports')) {
      this.currentTitle = 'sidebar.reports';
    } else if (url.includes('owner/ai-assistant')) {
      this.currentTitle = 'sidebar.ai_assistant';
    } else if (url.includes('owner/analyze-contract')) {
      this.currentTitle = 'sidebar.analyze_contract';
    } else if (url.includes('owner/transcribe-meeting')) {
      this.currentTitle = 'sidebar.transcribe_meeting';
    } else if (url.includes('owner/settings')) {
      this.currentTitle = 'sidebar.settings';
    } else if (url.includes('accountant/finance')) {
      this.currentTitle = 'sidebar.finance_overview';
    } else if (url.includes('accountant/invoices')) {
      this.currentTitle = 'sidebar.invoices';
    } else if (url.includes('accountant/customers')) {
      this.currentTitle = 'sidebar.customers';
    } else if (url.includes('sales-manager/dashboard')) {
      this.currentTitle = 'sidebar.sales_dashboard';
    } else if (url.includes('sales-manager/team')) {
      this.currentTitle = 'sidebar.sales_team';
    } else if (url.includes('sales-manager/customers')) {
      this.currentTitle = 'sidebar.customers';
    } else if (url.includes('sales-manager/deals')) {
      this.currentTitle = 'sidebar.pipeline';
    } else if (url.includes('sales-manager/tasks')) {
      this.currentTitle = 'sidebar.tasks';
    } else if (url.includes('sales-manager/ai-assistant')) {
      this.currentTitle = 'sidebar.ai_agent';
    } else if (url.includes('emp-manager/team')) {
      this.currentTitle = 'sidebar.team_mgmt';
    } else if (url.includes('emp-manager/tasks')) {
      this.currentTitle = 'sidebar.tasks_board';
    } else if (url.includes('emp-manager/meetings')) {
      this.currentTitle = 'sidebar.schedule_meetings';
    } else if (url.includes('emp-manager/leaves')) {
      this.currentTitle = 'sidebar.dept_leaves';
    } else if (url.includes('emp-manager/attendance')) {
      this.currentTitle = 'sidebar.attendance_monitor';
    } else if (url.includes('hr/dashboard')) {
      this.currentTitle = 'sidebar.hr_dashboard';
    } else if (url.includes('hr/employees')) {
      this.currentTitle = 'sidebar.hr_employees';
    } else if (url.includes('hr/leaves')) {
      this.currentTitle = 'sidebar.hr_leaves';
    } else if (url.includes('hr/recruitment')) {
      this.currentTitle = 'sidebar.hr_recruitment';
    } else if (url.includes('hr/reports')) {
      this.currentTitle = 'sidebar.hr_reports';
    } else if (url.includes('employee/tasks')) {
      this.currentTitle = 'sidebar.my_tasks';
    } else if (url.includes('employee/attendance')) {
      this.currentTitle = 'sidebar.my_attendance';
    } else if (url.includes('employee/leaves')) {
      this.currentTitle = 'sidebar.request_leave';
    } else if (url.includes('employee/profile')) {
      this.currentTitle = 'sidebar.profile';
    } else if (url.includes('sales-rep/dashboard')) {
      this.currentTitle = 'sidebar.my_dashboard';
    } else if (url.includes('sales-rep/customers')) {
      this.currentTitle = 'sidebar.my_customers';
    } else if (url.includes('sales-rep/deals')) {
      this.currentTitle = 'sidebar.my_deals';
    } else if (url.includes('sales-rep/tasks')) {
      this.currentTitle = 'sidebar.my_tasks_dates';
    } else if (url.includes('sales-rep/ai-assistant')) {
      this.currentTitle = 'sidebar.ai_agent';
    } else {
      this.currentTitle = 'sidebar.dashboard';
    }
  }
}
