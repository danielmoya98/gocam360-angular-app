import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';

export interface AdminMetricsCardsDto {
  eventsCount: number;
  activeEventsCount: number;
  photosCount: number;
  photosToday: number;
  printsCount: number;
  pendingPrintsCount: number;
  recentGuestsCount: number;
}

export interface AdminActiveEventDto {
  id: string;
  name: string;
  location?: string;
  eventDate: string | Date;
  startTime: string | Date;
  endTime: string | Date;
  status: 'ACTIVE' | 'DRAFT' | 'FINISHED' | 'EXPIRED';
}

export interface AdminPrintQueueItemDto {
  id: string;
  photoUrl: string;
  fileName: string;
  eventName: string;
  status: 'PENDING' | 'PRINTING' | 'PRINTED' | 'CANCELLED';
}

export interface AdminMetricsResponseDto {
  cards: AdminMetricsCardsDto;
  activeEvents: AdminActiveEventDto[];
  printQueue: AdminPrintQueueItemDto[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private readonly _api = inject(ApiClientService);

  private readonly _metrics = signal<AdminMetricsResponseDto | null>(null);
  private readonly _isLoading = signal(false);

  readonly metrics = this._metrics.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Cuentan con estrategia Stale-While-Revalidate: si hay datos en memoria se sirven al instante
   * y se actualiza transparentemente en segundo plano o mediante fuerza manual (forceRefresh).
   */
  getAdminMetrics(forceRefresh = false): Observable<AdminMetricsResponseDto> {
    if (this._metrics() && !forceRefresh) {
      return of(this._metrics()!);
    }

    this._isLoading.set(true);
    return this._api.get<AdminMetricsResponseDto>('/dashboard/admin-metrics').pipe(
      tap((data) => {
        this._metrics.set(data);
        this._isLoading.set(false);
      })
    );
  }
}
