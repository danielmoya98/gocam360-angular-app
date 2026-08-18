import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap, map } from 'rxjs';
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
   * Helper para normalizar contratos entre la respuesta de Prisma en NestJS (name, accessCode, eventDate)
   * y el DTO mapeado del cliente (title, uniqueCode, date, totalPhotos, totalPrints)
   */
  private normalizeEvent(event: any): EventItemResponseDto {
    if (!event) return {} as EventItemResponseDto;
    const nameVal = event.name || event.title || 'Evento sin nombre';
    const codeVal = event.accessCode || event.uniqueCode || '';
    const dateVal = event.eventDate || event.date || new Date();

    return {
      id: event.id,
      adminId: event.adminId,
      adminName: event.adminName || event.admin?.fullName || 'Administrador',
      adminEmail: event.adminEmail || event.admin?.email || '',
      name: nameVal,
      title: nameVal, // UI alias
      status: event.status || 'ACTIVE',
      description: event.description || '',
      hostName: event.hostName || 'Anfitrión',
      hostPhone: event.hostPhone || '',
      hostEmail: event.hostEmail || '',
      location: event.location || 'Sin ubicación',
      coverImage: event.coverImage || null,
      eventDate: dateVal,
      date: dateVal, // UI alias
      startTime: event.startTime || '18:00',
      endTime: event.endTime || '23:00',
      accessCode: codeVal,
      uniqueCode: codeVal, // UI alias
      qrToken: event.qrToken || '',
      galleryToken: event.galleryToken || '',
      maxPhotosPerGuest: event.maxPhotosPerGuest ?? 10,
      maxPrintsPerGuest: event.maxPrintsPerGuest ?? 1,
      galleryRetentionDays: event.galleryRetentionDays ?? 7,
      primaryColor: event.primaryColor || '#6366f1',
      logoUrl: event.logoUrl || null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,

      // Métricas calculadas
      totalPhotos: typeof event.totalPhotos === 'number' ? event.totalPhotos : (event._count?.photos ?? 0),
      totalPrints: typeof event.totalPrints === 'number' ? event.totalPrints : 0,
      coverGradient: event.coverGradient || 'from-indigo-600 to-violet-500',
      eventFrames: event.eventFrames || [],
    };
  }

  /**
   * Cuentan con estrategia Stale-While-Revalidate: si ya existen eventos en memoria,
   * responde instantáneamente y revalida de manera transparente sin bloqueos visuales.
   */
  findAll(forceRefresh = false): Observable<EventItemResponseDto[]> {
    if (this._events() && !forceRefresh) {
      return of(this._events()!);
    }

    return this._api.get<any[]>('/events').pipe(
      map((list) => (Array.isArray(list) ? list.map((e) => this.normalizeEvent(e)) : [])),
      tap((data) => this._events.set(data))
    );
  }

  /**
   * Obtener detalle de 1 evento por ID via GET /events/:id
   */
  findOne(id: string): Observable<EventItemResponseDto> {
    return this._api.get<any>(`/events/${id}`).pipe(
      map((e) => this.normalizeEvent(e))
    );
  }

  /**
   * Crear un evento nuevo via POST /events
   */
  create(data: CreateEventDto): Observable<EventItemResponseDto> {
    return this._api.post<any>('/events', data).pipe(
      map((e) => this.normalizeEvent(e)),
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
    return this._api.patch<any>(`/events/${id}`, data).pipe(
      map((e) => this.normalizeEvent(e)),
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
