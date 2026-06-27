import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MeetingSchedule {
  id?: number;
  tenantId?: string;
  title: string;
  meetingDate: string | Date;
  meetingTime: string;
  duration: string;
  meetingType: string;
  location: string;
  attendees: string;
  virtualLink: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5092/api/Meetings';

  getMeetings(): Observable<{ success: boolean; data: MeetingSchedule[] }> {
    return this.http.get<{ success: boolean; data: MeetingSchedule[] }>(this.apiUrl);
  }

  createMeeting(meeting: Partial<MeetingSchedule>): Observable<{ success: boolean; message: string; data: MeetingSchedule }> {
    return this.http.post<{ success: boolean; message: string; data: MeetingSchedule }>(this.apiUrl, meeting);
  }

  updateMeeting(id: number, meeting: Partial<MeetingSchedule>): Observable<{ success: boolean; message: string; data: MeetingSchedule }> {
    return this.http.put<{ success: boolean; message: string; data: MeetingSchedule }>(`${this.apiUrl}/${id}`, meeting);
  }

  deleteMeeting(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
