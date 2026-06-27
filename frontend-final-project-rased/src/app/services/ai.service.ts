import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5092/api/Ai';

  chat(message: string, conversationId?: string, contractContext?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/chat`, { message, conversationId, contractContext });
  }

  analyzeContract(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/analyze-contract`, formData);
  }

  transcribeMeeting(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/transcribe-meeting`, formData);
  }
}
