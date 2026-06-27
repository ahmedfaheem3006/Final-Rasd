import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First ensure user is authenticated
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentRole = authService.userRole();
  // Get the allowed roles from route data e.g. data: { roles: ['owner-admin', 'system-admin'] }
  const allowedRoles: string[] = route.data?.['roles'] ?? [];

  // If no roles are specified on the route, allow all authenticated users
  if (allowedRoles.length === 0) {
    return true;
  }

  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  // User is authenticated but doesn't have the required role
  return router.createUrlTree(['/unauthorized']);
};
