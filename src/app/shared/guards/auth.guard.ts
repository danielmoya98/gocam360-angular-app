import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../entities/session/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Guard para verificar si el usuario ha iniciado sesión antes de acceder al Dashboard
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/login');
};

/**
 * Guard para restringir el acceso a rutas según los roles especificados
 * (SUPERADMIN vs ADMIN)
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    const userRole = authService.userRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    toast.error('Acceso restringido', `Tu rol (${userRole || 'Invitado'}) no tiene acceso a esta sección`);
    return router.parseUrl('/dashboard');
  };
};
