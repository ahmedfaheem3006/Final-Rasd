import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MonthlyData {
  year: number;
  month: number;
  total: number;
}

export interface DashboardStats {
  totalSales: number;
  outstandingInvoices: number;
  growthPercentage: number;
  salesByMonth: MonthlyData[];
  invoicesByMonth: MonthlyData[];
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Dashboard';

  getStats(): Observable<{ success: boolean; data: DashboardStats }> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.baseUrl}/stats`);
  }
}
