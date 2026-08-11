import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of, delay } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';
import { CrmLeadDto, LeadStatus } from '../../../shared/models/crm-lead.model';

export type { CrmLeadDto, LeadStatus };

@Injectable({
  providedIn: 'root',
})
export class CrmLeadsService {
  private readonly _api = inject(ApiClientService);

  private readonly _leads = signal<CrmLeadDto[]>([]);
  private readonly _isLoading = signal(false);

  readonly leads = this._leads.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  loadLeads(): Observable<CrmLeadDto[]> {
    this._isLoading.set(true);
    return this._api.get<CrmLeadDto[]>('/crm-leads').pipe(
      delay(450),
      tap((data) => {
        this._leads.set(data);
        this._isLoading.set(false);
      }),
      catchError(() => {
        const mockLeads: CrmLeadDto[] = [
          {
            id: 'l1',
            name: 'Sofía Martínez',
            phone: '+52 55 1234 5678',
            eventType: 'Boda / Evento Social',
            notes: 'Interesada en plataforma 360° con impresión térmica para 200 personas.',
            status: 'NEW',
            createdAt: new Date().toISOString(),
            event: { name: 'Lanzamiento L\'Oréal 360' },
          },
          {
            id: 'l2',
            name: 'Alejandro Rivera',
            phone: '+52 81 9876 5432',
            eventType: 'Gala Corporativa',
            notes: 'Requiere 2 estaciones de cámara 360° e integración de marca.',
            status: 'CONTACTED',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            event: { name: 'Expo Tech 2026' },
          },
          {
            id: 'l3',
            name: 'Carolina Gómez',
            phone: '+52 33 4567 8901',
            eventType: 'Fiesta de XV Años',
            notes: 'Presupuesto aprobado, pendiente firma de contrato.',
            status: 'CONVERTED',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            event: { name: 'Gala Ritz' },
          },
        ];
        return of(mockLeads).pipe(
          delay(450),
          tap(() => {
            this._leads.set(mockLeads);
            this._isLoading.set(false);
          })
        );
      })
    );
  }

  updateLeadStatus(id: string, status: LeadStatus): Observable<CrmLeadDto> {
    return this._api.patch<CrmLeadDto>(`/crm-leads/${id}/status`, { status }).pipe(
      tap(() => {
        this._leads.update((list) =>
          list.map((l) => (l.id === id ? { ...l, status } : l))
        );
      }),
      catchError(() => {
        this._leads.update((list) =>
          list.map((l) => (l.id === id ? { ...l, status } : l))
        );
        return of({ id, status } as any);
      })
    );
  }
}
