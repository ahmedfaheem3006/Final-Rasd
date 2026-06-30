import { Component, inject, signal, effect, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';
import { LeaveService } from '../../services/leave.service';
import { CompanyPermissionsService } from '../../services/company-permissions.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private authService = inject(AuthService);
  private companyPermissionsService = inject(CompanyPermissionsService);
  i18n = inject(I18nService);
  themeService = inject(ThemeService);
  leaveService = inject(LeaveService);

  currentUser = this.authService.currentUser;
  role = this.authService.userRole;
  isCollapsed = signal(false);
  isMobileOpen = signal(false);

  // Computed property to get enabled modules for current tenant
  enabledModules = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    
    // For system-admin users, we need to get permissions from the selected tenant
    // For other users, we use their own permissions
    if (user.role === 'system-admin') {
      return [];
    }
    
    // Extract module permissions from user object
    return [
      { key: 'crm', label: 'Sales & Customers', enabled: user.isCrmEnabled !== false },
      { key: 'accounting', label: 'Invoices & Accounting', enabled: user.isInvoicesEnabled !== false },
      { key: 'tasks', label: 'Tasks & Kanban', enabled: user.isTasksEnabled !== false },
      { key: 'meetings', label: 'Meetings', enabled: user.isMeetingsEnabled !== false },
      { key: 'ai', label: 'AI Tools', enabled: user.isAiEnabled !== false }
    ];
  });

  constructor() {
    // Load permissions when user changes
    effect(() => {
      const user = this.currentUser();
      if (user && user.role !== 'system-admin') {
        // Update the company permissions service with the user's permissions
        const modules = [
          { key: 'crm', label: 'Sales & Customers', enabled: user.isCrmEnabled !== false },
          { key: 'accounting', label: 'Invoices & Accounting', enabled: user.isInvoicesEnabled !== false },
          { key: 'tasks', label: 'Tasks & Kanban', enabled: user.isTasksEnabled !== false },
          { key: 'meetings', label: 'Meetings', enabled: user.isMeetingsEnabled !== false },
          { key: 'ai', label: 'AI Tools', enabled: user.isAiEnabled !== false }
        ];
        
        // Use the user's email or a placeholder as the tenant identifier
        const tenantId = user.email || 'default-tenant';
        this.companyPermissionsService.updateEnabledModules(tenantId, modules);
      }
    });

    effect(() => {
      if (this.isMobileOpen()) {
        document.body.style.overflow = 'hidden';
        document.body.classList.add('mobile-drawer-open');
      } else {
        document.body.style.overflow = '';
        document.body.classList.remove('mobile-drawer-open');
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  toggleCollapse() {
    this.isCollapsed.update(v => !v);
  }

  toggleMobile() {
    this.isMobileOpen.update(v => !v);
  }

  closeMobile() {
    this.isMobileOpen.set(false);
  }

  /**
   * Check if a module is enabled for the current tenant
   */
  isModuleEnabled(moduleKey: string): boolean {
    const modules = this.enabledModules();
    const module = modules.find(m => m.key === moduleKey);
    return module ? module.enabled : true; // Default to enabled if module not found
  }
}
