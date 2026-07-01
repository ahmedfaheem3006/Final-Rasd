import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5292/api/Tasks';

  getTasks(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  createTask(task: { title: string; description?: string; assignedUserId?: number | null; dueDate?: string }): Observable<any> {
    return this.http.post<any>(this.baseUrl, task);
  }

  updateTaskStatus(taskId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${taskId}/status`, { status });
  }

  deleteTask(taskId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${taskId}`);
  }
}
