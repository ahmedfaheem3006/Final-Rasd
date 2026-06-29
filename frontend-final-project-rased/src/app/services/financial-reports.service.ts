import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinancialReportsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/FinancialReports';

  getRevenueReport(from?: string, to?: string): Observable<any> {
    let params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return this.http.get<any>(`${this.baseUrl}/revenue`, { params });
  }

  getProfitLoss(from?: string, to?: string): Observable<any> {
    let params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return this.http.get<any>(`${this.baseUrl}/profit-loss`, { params });
  }

  getCashFlow(from?: string, to?: string): Observable<any> {
    let params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return this.http.get<any>(`${this.baseUrl}/cash-flow`, { params });
  }

  getClientStatement(clientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/client-statement/${clientId}`);
  }
}
