import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/entities/user.model';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as UserRole[];

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  const userRole = authService.getRole();

  if (!userRole) {
    return router.createUrlTree(['/login']);
  }

  if (expectedRoles.includes(userRole)) {
    return true;
  }

  return router.createUrlTree(['/403']);
};
