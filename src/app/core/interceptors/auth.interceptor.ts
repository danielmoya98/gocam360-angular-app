import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  // Configura withCredentials: true para que el navegador adjunte automáticamente la Cookie HttpOnly ('gocam360_token')
  let cloned = req.clone({
    withCredentials: true,
  });

  // Fallback: Si existe un token JWT en localStorage, también lo envía en el encabezado Authorization
  const token = localStorage.getItem('gocam360_token') || localStorage.getItem('access_token');
  if (token) {
    cloned = cloned.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ignorar toast de 'Sesión Expirada' en verificaciones iniciales de sesión (/auth/me) o de instalación (/auth/setup-status)
      const isCheckSessionReq = req.url.includes('/auth/me') || req.url.includes('/auth/setup-status');

      if (error.status === 401) {
        localStorage.removeItem('gocam360_token');
        localStorage.removeItem('access_token');
        if (!isCheckSessionReq) {
          toast.error('Sesión Expirada', 'Tu sesión ha caducado. Por favor ingresa nuevamente.');
          router.navigate(['/login']);
        }
      } else if (error.status === 403) {
        toast.error('Acceso Restringido', 'No tienes permisos suficientes para realizar esta acción.');
      } else if (error.status === 500) {
        toast.error('Error del Servidor', 'Ocurrió un inconveniente temporal en el servidor. Intenta de nuevo.');
      } else if (error.status === 0) {
        toast.error('Error de Conexión', 'No se pudo contactar con el servidor. Revisa tu conexión a internet.');
      }

      return throwError(() => error);
    })
  );
};
