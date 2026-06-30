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

  const publicUrls = [
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/verify-otp',
    '/api/auth/reset-password',
    '/api/auth/register'
  ];
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
          // CRITICAL: Check if the token used for THIS request still matches
          // the one currently in localStorage. If a new login happened in
          // the meantime (e.g. stale refreshPermissions() call), the tokens
          // will differ and we must NOT clear the new session.
          const currentToken = localStorage.getItem('rasd_jwt_token');
          const requestToken = authReq.headers.get('Authorization')?.replace('Bearer ', '');

          if (currentToken === requestToken) {
            // Token hasn't changed — session is genuinely expired
            authService.clearSession();
            toast.error('انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى.', 'انتهت الجلسة');
            if (router.url !== '/login' && !router.url.startsWith('/login')) {
              router.navigate(['/login']);
            }
          }
          // If tokens differ, a newer login has occurred — ignore this stale 401
        }
        return throwError(() => err);
      })
    );
  }

  return next(req);
};
