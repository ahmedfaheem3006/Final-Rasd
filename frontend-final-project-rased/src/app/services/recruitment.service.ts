import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecruitmentService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Recruitment';

  // ───── Job Vacancies ─────

  getVacancies(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/vacancies`);
  }

  getVacancyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/vacancies/${id}`);
  }

  createVacancy(dto: { title: string; department: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/vacancies`, dto);
  }

  updateVacancy(id: number, dto: { title?: string; department?: string; status?: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/vacancies/${id}`, dto);
  }

  deleteVacancy(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/vacancies/${id}`);
  }

  toggleVacancyStatus(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/vacancies/${id}/toggle-status`, {});
  }

  // ───── Candidates ─────

  getCandidates(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/candidates`);
  }

  getCandidateById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/candidates/${id}`);
  }

  createCandidate(dto: {
    name: string;
    appliedRole: string;
    rating: number;
    stage: string;
    jobVacancyId?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/candidates`, dto);
  }

  updateCandidate(id: number, dto: { name?: string; appliedRole?: string; rating?: number }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/candidates/${id}`, dto);
  }

  moveCandidate(id: number, stage: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/candidates/${id}/move`, { stage });
  }

  deleteCandidate(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/candidates/${id}`);
  }
}
