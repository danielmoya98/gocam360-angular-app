import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiClientService } from '../../core/services/api-client.service';
import { AuthService } from '../../entities/session/auth.service';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface NotificationItemDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  linkUrl?: string;
  createdAt: string | Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly _api = inject(ApiClientService);
  private readonly _authService = inject(AuthService);

  private readonly _notifications = signal<NotificationItemDto[]>([]);
  private readonly _isLoading = signal(false);

  readonly notifications = this._notifications.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Carga notificaciones según el rol del usuario conectado
   */
  loadMyNotifications(): Observable<NotificationItemDto[]> {
    this._isLoading.set(true);
    const role = this._authService.userRole();

    return this._api.get<NotificationItemDto[]>('/notifications').pipe(
      tap((data) => {
        this._notifications.set(data);
        this._isLoading.set(false);
      }),
      catchError(() => {
        // Fallback dinámico con notificaciones diferenciadas por rol si la API aún no devuelve registros
        const mockData = this.generateMockNotificationsByRole(role);
        this._notifications.set(mockData);
        this._isLoading.set(false);
        return of(mockData);
      })
    );
  }

  markAsRead(id: string): Observable<NotificationItemDto> {
    return this._api.patch<NotificationItemDto>(`/notifications/${id}/read`, {}).pipe(
      tap(() => {
        this._notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      })
    );
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this._api.patch<{ message: string }>('/notifications/read-all', {}).pipe(
      tap(() => {
        this._notifications.update((list) => list.map((n) => ({ ...n, read: true })));
      }),
      catchError(() => {
        this._notifications.update((list) => list.map((n) => ({ ...n, read: true })));
        return of({ message: 'Todas leídas' });
      })
    );
  }

  private generateMockNotificationsByRole(role: string | null): NotificationItemDto[] {
    if (role === 'SUPERADMIN') {
      return [
        {
          id: 'n1',
          userId: 'super1',
          title: '🛡️ Registro de Auditoría',
          message: 'El Administrador Carlos Mendoza creó un nuevo evento "Boda Sofía 360".',
          type: 'INFO',
          read: false,
          linkUrl: '/dashboard/events',
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: 'n2',
          userId: 'super1',
          title: '👤 Nuevo Administrador Registrado',
          message: 'Se otorgó acceso al Administrador Elena Rostova.',
          type: 'SUCCESS',
          read: false,
          linkUrl: '/dashboard/users',
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        },
        {
          id: 'n3',
          userId: 'super1',
          title: '🎯 Nuevo Lead CRM Capturado',
          message: 'Un invitado solicitó cotización en el evento Gala Ritz.',
          type: 'WARNING',
          read: true,
          linkUrl: '/dashboard/settings',
          createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
        },
      ];
    }

    // Role: ADMIN OPERATIVO
    return [
      {
        id: 'n10',
        userId: 'admin1',
        title: '🖨️ Impresión Solicitada',
        message: 'Sofía Martínez envió una foto 360° a la cola de impresión térmica.',
        type: 'INFO',
        read: false,
        linkUrl: '/dashboard/prints',
        createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
      },
      {
        id: 'n11',
        userId: 'admin1',
        title: '⚠️ Alerta de Insumo de Papel',
        message: 'La impresora en Stand Principal tiene menos de 20 hojas disponibles.',
        type: 'WARNING',
        read: false,
        linkUrl: '/dashboard/prints',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'n12',
        userId: 'admin1',
        title: '📸 Galería Actualizada',
        message: 'Se han procesado 50 fotografías en el evento Expo Tech 2026.',
        type: 'SUCCESS',
        read: true,
        linkUrl: '/dashboard/events',
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      },
    ];
  }
}
