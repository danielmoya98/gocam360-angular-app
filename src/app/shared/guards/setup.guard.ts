import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../../entities/session/auth.service';

/**
 * Guard de inicio de aplicación (Root Entry Guard):
 * Evalúa si la base de datos ya cuenta con al menos un SuperAdmin.
 * - Si NO hay SuperAdmin (isInstalled === false): redirige a /setup.
 * - Si YA hay SuperAdmin (isInstalled === true): redirige a /login (o /dashboard si la sesión está activa).
 */
export const rootEntryGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario ya está autenticado en sesión, redirigir al dashboard
  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return authService.checkSetupStatus().pipe(
    map((res) => {
      // Si NO está instalado (no hay SuperAdmin), muestra la animación /splash que guía a /setup
      if (!res.isInstalled) {
        router.navigate(['/splash']);
        return false;
      }
      // Si YA hay un SuperAdmin en la BD, entra DIRECTO a /login sin mostrar el splash
      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};

/**
 * Guard de protección de la ruta /setup:
 * Impide que un usuario acceda a /setup si el sistema ya fue instalado.
 */
export const setupGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkSetupStatus().pipe(
    map((res) => {
      if (res.isInstalled) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      return of(true);
    })
  );
};
