import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of, map, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';
import { AuditLogDto, AuditLogMeta, PaginatedAuditLogsResponse } from '../../../shared/models/audit.model';

export interface LoadLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  forceRefresh?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLogsService {
  private readonly _api = inject(ApiClientService);

  private readonly _logs = signal<AuditLogDto[]>([]);
  private readonly _meta = signal<AuditLogMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  private readonly _isLoading = signal(false);

  public readonly logs = this._logs.asReadonly();
  public readonly meta = this._meta.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();

  /**
   * Cargar registros de auditoría con paginación y búsqueda real en el servidor
   */
  loadLogs(params: LoadLogsParams = {}): Observable<PaginatedAuditLogsResponse> {
    const { page = 1, limit = 10, search = '', forceRefresh = false } = params;

    this._isLoading.set(true);

    const queryParams: Record<string, string | number | boolean> = {
      page,
      limit,
    };
    if (search.trim()) {
      queryParams['search'] = search.trim();
    }

    return this._api.get<PaginatedAuditLogsResponse | AuditLogDto[]>('/audit-logs', queryParams).pipe(
      map((response) => {
        // Normalizar respuesta si el servidor devuelve objeto paginado { data, meta } o un arreglo plano
        if (response && 'data' in response && Array.isArray(response.data)) {
          return response as PaginatedAuditLogsResponse;
        }

        const list = Array.isArray(response) ? response : [];
        return {
          data: list,
          meta: {
            total: list.length,
            page: 1,
            limit: list.length || 10,
            totalPages: 1,
          },
        };
      }),
      tap((paginated) => {
        this._logs.set(paginated.data);
        this._meta.set(paginated.meta);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._logs.set([]);
        this._meta.set({ total: 0, page: 1, limit: 10, totalPages: 1 });
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }
}
