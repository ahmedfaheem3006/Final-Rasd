import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Tenants';

  registerTenant(tenant: {
    companyName: string;
    subscriptionPlan: string;
    price: number;
    aiLimit: number;
    address?: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
    ownerPhone?: string;
    ownerPassword: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, tenant);
  }

  checkCompanyExists(companyName: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/check-exists?companyName=${encodeURIComponent(companyName)}`);
  }

  getTenantById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
}
