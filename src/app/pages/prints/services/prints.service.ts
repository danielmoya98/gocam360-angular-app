import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';
import { PrintRequestItemDto, PrintStatus, PrintRequestPhotoDto, PrintRequestGuestDto } from '../../../shared/models/print.model';

export type { PrintRequestItemDto, PrintStatus, PrintRequestPhotoDto, PrintRequestGuestDto };

@Injectable({
  providedIn: 'root',
})
export class PrintsService {
  private readonly _api = inject(ApiClientService);

  private readonly _prints = signal<PrintRequestItemDto[] | null>(null);
  readonly prints = this._prints.asReadonly();

  /**
   * Obtener cola de impresiones global o por evento via GET /prints con caché Stale-While-Revalidate
   */
  findAll(eventId?: string, forceRefresh = false): Observable<PrintRequestItemDto[]> {
    if (this._prints() && !forceRefresh && !eventId) {
      return of(this._prints()!);
    }

    const query = eventId ? `?eventId=${eventId}` : '';
    return this._api.get<PrintRequestItemDto[]>(`/prints${query}`).pipe(
      tap((data) => {
        if (!eventId) {
          this._prints.set(data);
        }
      })
    );
  }

  /**
   * Actualizar el estado de una solicitud de impresión (PENDING -> PRINTING -> PRINTED / CANCELLED)
   */
  updateStatus(id: string, status: PrintStatus): Observable<PrintRequestItemDto> {
    return this._api.patch<PrintRequestItemDto>(`/prints/${id}/status`, { status }).pipe(
      tap((updated) => {
        if (this._prints()) {
          this._prints.update((list) =>
            (list || []).map((p) => (p.id === id ? updated : p))
          );
        }
      })
    );
  }

  /**
   * Marcar como impresa vía PATCH /prints/:id/complete
   */
  completePrint(id: string): Observable<PrintRequestItemDto> {
    return this._api.patch<PrintRequestItemDto>(`/prints/${id}/complete`, {}).pipe(
      tap((updated) => {
        if (this._prints()) {
          this._prints.update((list) =>
            (list || []).map((p) => (p.id === id ? updated : p))
          );
        }
      })
    );
  }
}
