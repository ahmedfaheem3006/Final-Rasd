import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Invoices';

  getInvoices(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  createInvoice(invoice: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, invoice);
  }

  updateInvoiceStatus(invoiceId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${invoiceId}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  downloadInvoicePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${invoiceId}/download`, { responseType: 'blob' });
  }
}
