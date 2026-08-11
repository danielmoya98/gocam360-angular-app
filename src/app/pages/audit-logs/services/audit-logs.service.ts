import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';
import { AuditLogDto } from '../../../shared/models/audit.model';

@Injectable({
  providedIn: 'root',
})
export class AuditLogsService {
  private readonly _api = inject(ApiClientService);

  private readonly _logs = signal<AuditLogDto[]>([]);
  private readonly _isLoading = signal(false);

  public readonly logs = this._logs.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();

  loadLogs(forceRefresh = false): Observable<AuditLogDto[]> {
    if (!forceRefresh && this._logs().length > 0) {
      return of(this._logs());
    }

    this._isLoading.set(true);

    return this._api.get<AuditLogDto[]>('/audit-logs').pipe(
      tap((data) => {
        this._logs.set(data);
        this._isLoading.set(false);
      }),
      catchError(() => {
        // Fallback demostrativo
        const mockLogs: AuditLogDto[] = [
          { id: 'log-1', userEmail: 'superadmin@gocam360.com', action: 'LOGIN_SUCCESS', entity: 'AUTH', details: 'Inicio de sesión exitoso', createdAt: new Date() },
          { id: 'log-2', userEmail: 'admin@gocam360.com', action: 'EVENT_CREATE', entity: 'EVENT', details: 'Evento L\'Oréal 360° creado', createdAt: new Date(Date.now() - 3600000) },
        ];
        this._logs.set(mockLogs);
        this._isLoading.set(false);
        return of(mockLogs);
      })
    );
  }
}
