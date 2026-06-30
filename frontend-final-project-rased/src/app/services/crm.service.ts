import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CrmService {
  private http = inject(HttpClient);
  private customersUrl = 'http://localhost:5292/api/Customers';
  private dealsUrl = 'http://localhost:5292/api/Deals';

  getClients(): Observable<any> {
    return this.http.get<any>(this.customersUrl);
  }

  createClient(client: { name: string; email: string; phone?: string; companyName?: string }): Observable<any> {
    return this.http.post<any>(this.customersUrl, client);
  }

  getClientNotes(clientId: number): Observable<any> {
    return this.http.get<any>(`${this.customersUrl}/${clientId}/notes`);
  }

  addClientNote(clientId: number, content: string): Observable<any> {
    // Note that Content-Type application/json requires sending the string directly, or in a JSON structure if the backend expects a raw string body.
    // In CustomersController: [FromBody] string content. 
    // In ASP.NET Core, [FromBody] string content expects a JSON-formatted string, like `"my note content"`.
    // Let's pass the string directly with proper headers or let HttpClient handle it.
    return this.http.post<any>(`${this.customersUrl}/${clientId}/notes`, JSON.stringify(content), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getDeals(): Observable<any> {
    return this.http.get<any>(this.dealsUrl);
  }

  createDeal(deal: { clientId: number; assignedUserId?: number; amount: number; status: string }): Observable<any> {
    return this.http.post<any>(this.dealsUrl, deal);
  }

  updateDealStatus(dealId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.dealsUrl}/${dealId}/status`, { status });
  }
}
