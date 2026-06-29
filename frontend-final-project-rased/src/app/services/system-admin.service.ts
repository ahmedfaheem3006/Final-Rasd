import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SystemAdminService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/SystemAdmin';

  getTenants(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/tenants`);
  }

  createTenant(tenant: {
    companyName: string;
    ownerFullName: string;
    ownerEmail: string;
    ownerPassword?: string;
    price: number;
    aiLimit: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tenants`, tenant);
  }

  updateTenantStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/tenants/${id}/status`, { isActive });
  }

  updateTenantPricing(id: string, payload: { price: number; aiLimit: number }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/tenants/${id}/pricing`, payload);
  }

  updateTenantPermissions(id: string, permissions: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/tenants/${id}/permissions`, permissions);
  }

  deleteTenant(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/tenants/${id}`);
  }

  getSupportIssues(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/issues`);
  }

  resolveIssue(id: string, action: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/issues/${id}/action`, { action });
  }
}
