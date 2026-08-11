import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../../entities/session/auth.service';

export const setupGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkSetupStatus().pipe(
    map((res) => {
      // Si ya está instalado, bloquea el acceso a /setup y redirige a /login
      if (res.isInstalled) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      // En caso de fallo o fallback, permite el setup inicial si la API está vacía
      return of(true);
    })
  );
};
