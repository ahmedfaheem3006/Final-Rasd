import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/LeaveRequests';

  public pendingCount = signal<number>(0);

  constructor() {
    this.updatePendingCount();
  }

  updatePendingCount() {
    this.getLeaveRequests().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const count = res.data.filter((r: any) => r.status === 'Pending').length;
          this.pendingCount.set(count);
        }
      },
      error: (err) => {
        console.error('[LeaveService] Failed to load pending count', err);
      }
    });
  }

  getLeaveRequests(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}`).pipe(
      tap(res => {
        if (res && res.success && res.data) {
          const count = res.data.filter((r: any) => r.status === 'Pending').length;
          this.pendingCount.set(count);
        }
      })
    );
  }

  getLeaveRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createLeaveRequest(dto: {
    employeeId: number;
    roleId: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, dto).pipe(
      tap(() => this.updatePendingCount())
    );
  }

  updateLeaveRequest(id: number, dto: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(() => this.updatePendingCount())
    );
  }

  deleteLeaveRequest(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.updatePendingCount())
    );
  }

  approveLeaveRequest(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/approve`, {}).pipe(
      tap(() => this.updatePendingCount())
    );
  }

  rejectLeaveRequest(id: number, rejectionReason?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/reject`, { rejectionReason }).pipe(
      tap(() => this.updatePendingCount())
    );
  }
}
