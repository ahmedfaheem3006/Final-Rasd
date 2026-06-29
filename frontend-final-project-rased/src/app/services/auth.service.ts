import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id?: number;
  name: string;
  email: string;
  role: 'system-admin' | 'owner-admin' | 'accountant' | 'sales-manager' | 'employee-manager' | 'employee' | 'sales-rep' | 'hr';
  roleLabel: string;
  workspaceName: string;
  avatarInitials: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly STORAGE_KEY = 'rasd_user_session';
  private static readonly TOKEN_KEY = 'rasd_jwt_token';

  private router = inject(Router);
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5092/api/Auth';

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  userRole = computed(() => this.currentUser()?.role || null);

  private mockUsers: Record<string, User> = {
    'admin@rasd.com': {
      id: 1,
      name: 'محمد عبد الله',
      email: 'admin@rasd.com',
      role: 'system-admin',
      roleLabel: 'مدير النظام الفني',
      workspaceName: 'لوحة التحكم الفنية',
      avatarInitials: 'مع'
    },
    'owner@rasd.com': {
      id: 100,
      name: 'أحمد فهيم',
      email: 'owner@rasd.com',
      role: 'owner-admin',
      roleLabel: 'مالك الشركة',
      workspaceName: 'مؤسسة رصد لتقنية المعلومات',
      avatarInitials: 'أف'
    },
    'accountant@rasd.com': {
      id: 102,
      name: 'سارة محمود',
      email: 'accountant@rasd.com',
      role: 'accountant',
      roleLabel: 'المحاسب المالي',
      workspaceName: 'القسم المالي - رصد',
      avatarInitials: 'سم'
    },
    'salesmgr@rasd.com': {
      id: 103,
      name: 'خالد منصور',
      email: 'salesmgr@rasd.com',
      role: 'sales-manager',
      roleLabel: 'مدير المبيعات',
      workspaceName: 'إدارة المبيعات - رصد',
      avatarInitials: 'خم'
    },
    'empmgr@rasd.com': {
      id: 6,
      name: 'عمر فاروق',
      email: 'empmgr@rasd.com',
      role: 'employee-manager',
      roleLabel: 'مدير الموظفين (HR)',
      workspaceName: 'الموارد البشرية والعمليات',
      avatarInitials: 'عف'
    },
    'employee@rasd.com': {
      id: 7,
      name: 'يوسف حسن',
      email: 'employee@rasd.com',
      role: 'employee',
      roleLabel: 'موظف العمليات',
      workspaceName: 'الفريق التقني - رصد',
      avatarInitials: 'يح'
    },
    'sales@rasd.com': {
      id: 19,
      name: 'رنا علي',
      email: 'sales@rasd.com',
      role: 'sales-rep',
      roleLabel: 'مندوب المبيعات',
      workspaceName: 'فريق المبيعات الميداني',
      avatarInitials: 'رع'
    },
    'hr@rasd.com': {
      id: 8,
      name: 'منى السالم',
      email: 'hr@rasd.com',
      role: 'hr',
      roleLabel: 'مدير الموارد البشرية (HR)',
      workspaceName: 'إدارة الموارد البشرية - رصد',
      avatarInitials: 'مس'
    }
  };

  constructor() {
    this.loadSession();
    // Defer execution to next macro-task to prevent circular dependency with authInterceptor
    setTimeout(() => this.checkAndFillUserId(), 0);
  }

  private checkAndFillUserId() {
    const user = this.currentUser();
    if (user && !user.id) {
      this.getProfile().subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            user.id = res.data.id;
            this.currentUser.set({ ...user });
            localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(user));
          }
        },
        error: (err) => console.error('Failed to fill user ID from profile', err)
      });
    }
  }

  private loadSession() {
    const saved = localStorage.getItem(AuthService.STORAGE_KEY);
    if (saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(AuthService.STORAGE_KEY);
      }
    }
  }

  // Real API Login
  login(email: string, password?: string): Observable<any> {
    const loginPayload = { email, password: password || '123456' };
    return this.http.post<any>(`${this.baseUrl}/login`, loginPayload).pipe(
      tap(response => {
        if (response && response.success && response.data) {
          const apiUser = response.data;
          const token = apiUser.token;
          localStorage.setItem(AuthService.TOKEN_KEY, token);

          // Map API Role to Frontend Role
          const mappedRole = this.mapRole(apiUser.role);
          const mappedUser: User = {
            id: apiUser.userId || apiUser.id,
            name: apiUser.fullName,
            email: apiUser.email,
            role: mappedRole,
            roleLabel: this.getRoleLabel(mappedRole),
            workspaceName: apiUser.companyName || (mappedRole === 'system-admin' ? 'لوحة التحكم الفنية' : 'مؤسسة رصد لتقنية المعلومات'),
            avatarInitials: this.getInitials(apiUser.fullName)
          };

          this.currentUser.set(mappedUser);
          localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(mappedUser));
          this.navigateToDashboard(mappedRole);
        }
      })
    );
  }

  // Mock Login Fallback
  loginMock(email: string): boolean {
    const sanitizedEmail = email.trim().toLowerCase();
    const user = this.mockUsers[sanitizedEmail];
    
    if (user) {
      this.currentUser.set(user);
      localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(user));
      this.navigateToDashboard(user.role);
      return true;
    }
    
    // Default fallback
    const fallbackUser: User = {
      name: 'زائر تجريبي',
      email: email,
      role: 'owner-admin',
      roleLabel: 'مالك الشركة (تجريبي)',
      workspaceName: 'مؤسسة رصد لتقنية المعلومات',
      avatarInitials: 'زت'
    };
    this.currentUser.set(fallbackUser);
    localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(fallbackUser));
    this.navigateToDashboard('owner-admin');
    return true;
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(AuthService.STORAGE_KEY);
    localStorage.removeItem(AuthService.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  registerUser(registerDto: { fullName: string; email: string; password?: string; roleId: number; phoneNumber?: string; managerId?: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, registerDto);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/dashboard-stats`);
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users`);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/profile`);
  }

  updateUserRole(userId: number, roleId: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${userId}/role`, { roleId });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${userId}`);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/verify-otp`, { email, otp });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/reset-password`, { email, otp, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/change-password`, { currentPassword, newPassword });
  }

  private mapRole(apiRole: string): User['role'] {
    switch (apiRole?.toLowerCase()) {
      case 'systemadmin': return 'system-admin';
      case 'owner': return 'owner-admin';
      case 'accountant': return 'accountant';
      case 'salesmanager': return 'sales-manager';
      case 'employeemanager': return 'employee-manager';
      case 'hr': return 'hr';
      case 'employee': return 'employee';
      case 'sales': return 'sales-rep';
      default: return 'owner-admin';
    }
  }

  private getRoleLabel(role: User['role']): string {
    switch (role) {
      case 'system-admin': return 'مدير النظام الفني';
      case 'owner-admin': return 'مالك الشركة';
      case 'accountant': return 'المحاسب المالي';
      case 'sales-manager': return 'مدير المبيعات';
      case 'employee-manager': return 'مشرف الموظفين بالقسم';
      case 'hr': return 'مدير الموارد البشرية (HR)';
      case 'employee': return 'موظف العمليات';
      case 'sales-rep': return 'مندوب المبيعات';
      default: return 'زائر';
    }
  }

  private getInitials(name: string): string {
    if (!name) return 'ر';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0] || 'ر';
  }

  public navigateToDashboard(role: string) {
    switch (role) {
      case 'system-admin':
        this.router.navigate(['/app/sys-admin/overview']);
        break;
      case 'owner-admin':
        this.router.navigate(['/app/owner/dashboard']);
        break;
      case 'accountant':
        this.router.navigate(['/app/accountant/finance']);
        break;
      case 'sales-manager':
        this.router.navigate(['/app/sales-manager/dashboard']);
        break;
      case 'employee-manager':
        this.router.navigate(['/app/emp-manager/team']);
        break;
      case 'hr':
        this.router.navigate(['/app/hr/reports']);
        break;
      case 'employee':
        this.router.navigate(['/app/employee/tasks']);
        break;
      case 'sales-rep':
        this.router.navigate(['/app/sales-rep/dashboard']);
        break;
      default:
        this.router.navigate(['/app/owner/dashboard']);
    }
  }
}
