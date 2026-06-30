import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Expenses';

  getExpenses(category?: string, search?: string): Observable<any> {
    let params: any = {};
    if (category && category !== 'All') params.category = category;
    if (search) params.search = search;
    return this.http.get<any>(this.baseUrl, { params });
  }

  getExpenseById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getExpenseDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  createExpense(dto: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, dto);
  }

  updateExpense(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto);
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
