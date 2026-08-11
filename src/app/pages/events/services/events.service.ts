import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';
import { EventItemResponseDto, CreateEventDto, UpdateEventDto, EventStatus } from '../../../shared/models/event.model';

export type { EventItemResponseDto, CreateEventDto, UpdateEventDto, EventStatus };

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly _api = inject(ApiClientService);

  private readonly _events = signal<EventItemResponseDto[] | null>(null);
  readonly events = this._events.asReadonly();

  /**
   * Cuentan con estrategia Stale-While-Revalidate: si ya existen eventos en memoria,
   * responde instantáneamente y revalida de manera transparente sin bloqueos visuales.
   */
  findAll(forceRefresh = false): Observable<EventItemResponseDto[]> {
    if (this._events() && !forceRefresh) {
      return of(this._events()!);
    }

    return this._api.get<EventItemResponseDto[]>('/events').pipe(
      tap((data) => this._events.set(data))
    );
  }

  /**
   * Obtener detalle de 1 evento por ID via GET /events/:id
   */
  findOne(id: string): Observable<EventItemResponseDto> {
    return this._api.get<EventItemResponseDto>(`/events/${id}`);
  }

  /**
   * Crear un evento nuevo via POST /events
   */
  create(data: CreateEventDto): Observable<EventItemResponseDto> {
    return this._api.post<EventItemResponseDto>('/events', data).pipe(
      tap((newEvent) => {
        if (this._events()) {
          this._events.update((list) => [newEvent, ...(list || [])]);
        }
      })
    );
  }

  /**
   * Actualizar evento via PATCH /events/:id
   */
  update(id: string, data: UpdateEventDto): Observable<EventItemResponseDto> {
    return this._api.patch<EventItemResponseDto>(`/events/${id}`, data).pipe(
      tap((updated) => {
        if (this._events()) {
          this._events.update((list) =>
            (list || []).map((e) => (e.id === id ? updated : e))
          );
        }
      })
    );
  }

  /**
   * Eliminar un evento via DELETE /events/:id
   */
  remove(id: string): Observable<{ message: string }> {
    return this._api.delete<{ message: string }>(`/events/${id}`).pipe(
      tap(() => {
        if (this._events()) {
          this._events.update((list) => (list || []).filter((e) => e.id !== id));
        }
      })
    );
  }
}
