import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly _toast = inject(ToastService);
  private readonly _ngZone = inject(NgZone);

  handleError(error: unknown): void {
    // Log técnico en la consola para depuración
    console.error('[GlobalErrorHandler Caught Error]:', error);

    // Evitar romper el ciclo de cambio de detección de Angular al mostrar Toasts
    this._ngZone.run(() => {
      const message = error instanceof Error ? error.message : 'Error interno de ejecución de JavaScript';
      // Desplegar notificación discreta en UI sin tumbar la aplicación
      this._toast.error('Fallo Inesperado', message);
    });
  }
}
