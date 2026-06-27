import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = localStorage.getItem('rasd_jwt_token');

  const publicUrls = ['/api/auth/login', '/api/auth/forgot-password', '/api/auth/verify-otp', '/api/auth/reset-password'];
  const isPublic = publicUrls.some(url => req.url.toLowerCase().includes(url.toLowerCase()));

  if (token && !isPublic) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.toLowerCase().includes('/login')) {
          localStorage.removeItem('rasd_jwt_token');
          localStorage.removeItem('rasd_user_session');
          toast.error('انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى.', 'انتهت الجلسة');
          router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }

  return next(req);
};
