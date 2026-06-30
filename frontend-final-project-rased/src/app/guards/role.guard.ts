import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    const token = localStorage.getItem('rasd_jwt_token');
    const session = localStorage.getItem('rasd_user_session');
    if (token && session) {
      authService.clearSession();
    }
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentRole = authService.userRole();
  const requiredPermission = route.data?.['permission'] as string | undefined;
  const user = authService.currentUser() as any;

  if (requiredPermission && user?.[requiredPermission] === false) {
    return router.createUrlTree(['/unauthorized']);
  }

  const allowedRoles: string[] = route.data?.['roles'] ?? [];

  if (allowedRoles.length === 0) {
    return true;
  }

  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
