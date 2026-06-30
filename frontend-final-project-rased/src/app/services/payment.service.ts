import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Payments';

  getPayments(status?: string, search?: string, from?: string, to?: string, page: number = 1, pageSize: number = 20): Observable<any> {
    let params = new HttpParams();
    if (status && status !== 'All') params = params.set('status', status);
    if (search) params = params.set('search', search);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    params = params.set('page', page.toString());
    params = params.set('pageSize', pageSize.toString());
    return this.http.get<any>(this.baseUrl, { params });
  }

  getPaymentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getPaymentDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  getUnpaidInvoices(search?: string): Observable<any> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${this.baseUrl}/unpaid-invoices`, { params });
  }

  getPaymentReceipt(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/receipt`);
  }

  createPayment(dto: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, dto);
  }

  updatePayment(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto);
  }

  deletePayment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
