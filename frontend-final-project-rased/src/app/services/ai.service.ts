import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Ai';

  chat(message: string, conversationId?: string, contractContext?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/chat`, { message, conversationId, contractContext });
  }

  analyzeContract(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/analyze-contract`, formData);
  }

  transcribeMeeting(file: File, driveLink?: string, language: string = 'ar'): Observable<any> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (driveLink) {
      formData.append('driveLink', driveLink);
    }
    formData.append('language', language);
    return this.http.post<any>(`${this.baseUrl}/transcribe-meeting`, formData);
  }

  chatAboutMeeting(question: string, meetingTranscript: string, language: string = 'ar'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/chat-meeting`, { question, meetingTranscript, language });
  }

  // ─── Chat History ─────────────────────────────────────────────────────────
  getChatHistory(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/chat/history`);
  }

  getChatHistoryDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/chat/history/${id}`);
  }

  deleteChatHistory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/chat/history/${id}`);
  }

  // ─── Contract History ─────────────────────────────────────────────────────
  getContractHistory(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/contract/history`);
  }

  getContractHistoryDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/contract/history/${id}`);
  }

  deleteContractHistory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/contract/history/${id}`);
  }

  // ─── Meeting History ──────────────────────────────────────────────────────
  getMeetingHistory(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/meeting/history`);
  }

  getMeetingHistoryDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/meeting/history/${id}`);
  }

  deleteMeetingHistory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/meeting/history/${id}`);
  }

  // ─── Interview Analysis ───────────────────────────────────────────────────
  analyzeInterview(file: File, candidateName: string, jobRole: string, language: string = 'ar'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidateName', candidateName);
    formData.append('jobRole', jobRole);
    formData.append('language', language);
    return this.http.post<any>(`${this.baseUrl}/analyze-interview`, formData);
  }

  chatAboutInterview(question: string, interviewTranscript: string, candidateName: string, jobRole: string, language: string = 'ar'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/chat-interview`, { question, interviewTranscript, candidateName, jobRole, language });
  }
}
