import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EventsService, EventItemResponseDto } from '../events/services/events.service';
import { PrintsService, PrintRequestItemDto, PrintStatus } from './services/prints.service';

@Component({
  selector: 'app-prints-page',
  standalone: true,
  imports: [IconComponent, DatePipe, RouterLink],
  templateUrl: './prints.page.html',
  styleUrl: './prints.page.css',
})
export class PrintsPage implements OnInit {
  private readonly _eventsService = inject(EventsService);
  private readonly _printsService = inject(PrintsService);
  private readonly _toastService = inject(ToastService);

  protected readonly isLoading = signal(true);
  protected readonly viewMode = signal<'cards' | 'table'>('cards');
  protected readonly activeStatusTab = signal<'TODAS' | 'PENDING' | 'PRINTING' | 'PRINTED'>('TODAS');
  protected readonly selectedEventId = signal<string>('ALL');

  protected readonly eventsList = signal<EventItemResponseDto[]>([]);
  protected readonly printRequests = signal<PrintRequestItemDto[]>([]);

  protected readonly previewState = signal<{ isOpen: boolean; url: string }>({
    isOpen: false,
    url: '',
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(notify = false): void {
    if (this._eventsService.events() && this._printsService.prints() && !notify) {
      this.eventsList.set(this._eventsService.events()!);
      this.printRequests.set(this._printsService.prints()!);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(true);
    }

    // Reutilizar GET /events para cargar la lista de eventos con métricas
    this._eventsService.findAll(notify).subscribe({
      next: (events) => {
        this.eventsList.set(events);

        // Cargar solicitudes de impresión filtrando por evento si hay uno seleccionado
        const targetEventId = this.selectedEventId() !== 'ALL' ? this.selectedEventId() : undefined;
        this._printsService.findAll(targetEventId, notify).subscribe({
          next: (prints) => {
            this.printRequests.set(prints);
            this.isLoading.set(false);
            if (notify) {
              this._toastService.info('Sincronización Completa', 'Eventos y cola de impresión actualizados desde NestJS');
            }
          },
          error: () => {
            this.isLoading.set(false);
            if (notify) {
              this._toastService.error('Error', 'No se pudo recuperar la cola de impresiones');
            }
          },
        });
      },
      error: () => {
        this.isLoading.set(false);
        if (notify) {
          this._toastService.error('Error', 'No se pudieron recuperar los eventos');
        }
      },
    });
  }

  onEventChange(e: Event): void {
    const select = e.target as HTMLSelectElement;
    this.selectedEventId.set(select.value);
    this.loadAllData();
  }

  getEventName(eventId: string): string {
    const ev = this.eventsList().find((e) => e.id === eventId);
    return ev ? ev.title : 'Evento 360°';
  }

  // Métricas calculadas para las 4 KPI Cards combinando eventos e impresiones
  protected readonly totalPhotosCount = computed(() =>
    this.eventsList().reduce((acc, ev) => acc + (ev.totalPhotos || 0), 0)
  );

  protected readonly totalRequestsCount = computed(() => this.printRequests().length);
  protected readonly pendingRequestsCount = computed(() => this.printRequests().filter((r) => r.status === 'PENDING').length);
  protected readonly printingRequestsCount = computed(() => this.printRequests().filter((r) => r.status === 'PRINTING').length);
  protected readonly deliveredRequestsCount = computed(() => this.printRequests().filter((r) => r.status === 'PRINTED').length);

  protected readonly filteredPrintItems = computed(() => {
    let list = this.printRequests();
    const tab = this.activeStatusTab();
    const eventId = this.selectedEventId();

    if (eventId !== 'ALL') {
      list = list.filter((item) => item.eventId === eventId);
    }

    if (tab !== 'TODAS') {
      list = list.filter((item) => item.status === tab);
    }

    return list;
  });

  changeStatus(id: string, status: PrintStatus): void {
    this._printsService.updateStatus(id, status).subscribe({
      next: (updatedItem) => {
        this.printRequests.update((list) =>
          list.map((r) => (r.id === id ? updatedItem : r))
        );
        if (status === 'PRINTING') {
          this._toastService.success('Impresión Enviada', 'La orden fue enviada a la estación térmica.');
        } else if (status === 'PRINTED') {
          this._toastService.success('Foto Entregada', 'La fotografía fue marcada como entregada.');
        } else if (status === 'CANCELLED') {
          this._toastService.error('Solicitud Rechazada', 'La orden de impresión fue rechazada.');
        }
      },
      error: () => {
        this._toastService.error('Error', 'No se pudo actualizar el estado de impresión');
      },
    });
  }

  openPreviewModal(url: string): void {
    this.previewState.set({ isOpen: true, url });
  }

  closePreviewModal(): void {
    this.previewState.set({ isOpen: false, url: '' });
  }

  downloadAllZip(): void {
    this._toastService.success('Descarga en Proceso', 'Se está generando el archivo ZIP con todas las capturas HD.');
  }
}
