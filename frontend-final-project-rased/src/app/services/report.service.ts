import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReportRecord {
  id?: number;
  tenantId?: string;
  category: string; // sales | financial | hr
  title: string;
  period: string;
  sizeLabel: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5292/api/Reports';

  getReports(): Observable<{ success: boolean; data: ReportRecord[] }> {
    return this.http.get<{ success: boolean; data: ReportRecord[] }>(this.apiUrl);
  }

  createReport(report: Partial<ReportRecord>): Observable<{ success: boolean; message: string; data: ReportRecord }> {
    return this.http.post<{ success: boolean; message: string; data: ReportRecord }>(this.apiUrl, report);
  }
}
