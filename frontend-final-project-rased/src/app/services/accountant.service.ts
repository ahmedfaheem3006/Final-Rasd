import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountantService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Accountant';

  getAccountants(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard-stats`);
  }

  getMyDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/my-dashboard`);
  }

  getFullDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/full-dashboard`);
  }

  createAccountant(dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, dto);
  }

  updateAccountantStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deleteAccountant(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
