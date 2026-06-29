import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClientFinancialService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/ClientsFinancial';

  getClients(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}`);
  }

  getClientById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createClient(dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, dto);
  }

  updateClient(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
