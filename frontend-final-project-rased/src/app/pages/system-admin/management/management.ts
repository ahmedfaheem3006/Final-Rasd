import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemAdminService } from '../../../services/system-admin.service';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './management.html',
  styleUrl: './management.css'
})
export class Management implements OnInit {
  private systemAdminService = inject(SystemAdminService);
  private toastService = inject(ToastService);
  i18n = inject(I18nService);

  tenants = signal<any[]>([]);
  searchQuery = signal('');
  selectedTenant = signal<any | null>(null);

  filteredTenants = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.tenants();
    if (!query) return list;
    return list.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.owner.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadTenants();
  }

  loadTenants() {
    this.systemAdminService.getTenants().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const list = res.data.map((t: any) => ({
            id: t.tenantId,
            name: t.name,
            owner: t.ownerName || (this.i18n.currentLang() === 'ar' ? 'مالك الشركة' : 'Company Owner'),
            email: t.ownerEmail || '...',
            status: t.isActive ? 'active' : 'suspended',
            isCrmEnabled: t.isCrmEnabled !== false,
            isInvoicesEnabled: t.isInvoicesEnabled !== false,
            isTasksEnabled: t.isTasksEnabled !== false,
            isMeetingsEnabled: t.isMeetingsEnabled !== false,
            isAiEnabled: t.isAiEnabled !== false,
            price: t.price,
            aiLimit: t.aiLimit
          }));
          this.tenants.set(list);

          // Preserve selection or select first
          if (list.length > 0) {
            const currentSelected = this.selectedTenant();
            if (currentSelected) {
              const updated = list.find((t: any) => t.id === currentSelected.id);
              this.selectedTenant.set(updated || list[0]);
            } else {
              this.selectedTenant.set(list[0]);
            }
          } else {
            this.selectedTenant.set(null);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load tenants', err);
        this.toastService.error('فشل في تحميل الشركات.');
      }
    });
  }

  selectTenant(tenant: any) {
    this.selectedTenant.set(tenant);
  }

  onTogglePermission(moduleName: string) {
    const tenant = this.selectedTenant();
    if (!tenant) return;

    const payload = {
      isCrmEnabled: tenant.isCrmEnabled,
      isInvoicesEnabled: tenant.isInvoicesEnabled,
      isTasksEnabled: tenant.isTasksEnabled,
      isMeetingsEnabled: tenant.isMeetingsEnabled,
      isAiEnabled: tenant.isAiEnabled
    };

    this.systemAdminService.updateTenantPermissions(tenant.id, payload).subscribe({
      next: (res) => {
        this.toastService.success(
          this.i18n.currentLang() === 'ar' 
            ? 'تم تحديث صلاحيات الوصول بنجاح' 
            : 'Access permissions updated successfully',
          this.i18n.currentLang() === 'ar' ? 'صلاحيات الشركات' : 'Company Permissions'
        );
        this.loadTenants();
      },
      error: (err) => {
        console.error('Failed to update permissions', err);
        this.toastService.error(
          this.i18n.currentLang() === 'ar' ? 'فشل تحديث الصلاحيات' : 'Failed to update permissions'
        );
      }
    });
  }
}
