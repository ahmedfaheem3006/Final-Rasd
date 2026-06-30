import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ModulePermission {
  key: string;
  label: string;
  enabled: boolean;
}

export interface TenantPermissions {
  tenantId: string;
  isCrmEnabled: boolean;
  isInvoicesEnabled: boolean;
  isTasksEnabled: boolean;
  isMeetingsEnabled: boolean;
  isAiEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyPermissionsService {
  // Signal to store enabled modules per tenant
  private enabledModules = signal<Record<string, ModulePermission[]>>({});

  constructor(private http: HttpClient) {}

  /**
   * Get enabled modules for a specific tenant
   */
  getEnabledModules(tenantId: string): ModulePermission[] {
    return this.enabledModules()[tenantId] || [];
  }

  /**
   * Update enabled modules for a tenant
   */
  updateEnabledModules(tenantId: string, modules: ModulePermission[]): void {
    const current = this.enabledModules();
    this.enabledModules.set({
      ...current,
      [tenantId]: modules
    });
  }

  /**
   * Toggle a module for a tenant
   */
  toggleModule(tenantId: string, moduleKey: string): void {
    const currentModules = this.getEnabledModules(tenantId);
    const updatedModules = currentModules.map(module => 
      module.key === moduleKey ? { ...module, enabled: !module.enabled } : module
    );
    this.updateEnabledModules(tenantId, updatedModules);
  }

  /**
   * Load tenant permissions from API
   */
  loadTenantPermissions(tenantId: string): Observable<ModulePermission[]> {
    // In a real implementation, this would call the backend API
    // For now, we'll mock the data
    return of([
      { key: 'crm', label: 'Sales & Customers', enabled: true },
      { key: 'accounting', label: 'Invoices & Accounting', enabled: true },
      { key: 'tasks', label: 'Tasks & Kanban', enabled: true },
      { key: 'meetings', label: 'Meetings', enabled: true },
      { key: 'ai', label: 'AI Tools', enabled: true }
    ]);
  }

  /**
   * Save tenant permissions to API
   */
  saveTenantPermissions(tenantId: string, permissions: ModulePermission[]): Observable<any> {
    // Convert to backend format
    const payload = {
      isCrmEnabled: permissions.find(p => p.key === 'crm')?.enabled ?? false,
      isInvoicesEnabled: permissions.find(p => p.key === 'accounting')?.enabled ?? false,
      isTasksEnabled: permissions.find(p => p.key === 'tasks')?.enabled ?? false,
      isMeetingsEnabled: permissions.find(p => p.key === 'meetings')?.enabled ?? false,
      isAiEnabled: permissions.find(p => p.key === 'ai')?.enabled ?? false
    };

    // Return mock response - in real app this would call the backend
    return of({ success: true });
  }
}