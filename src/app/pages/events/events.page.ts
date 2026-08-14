import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { form, FormField, submit, required } from '@angular/forms/signals';
import { HlmButtonDirective } from '../../shared/ui/button/hlm-button.directive';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { SearchInputComponent } from '../../shared/ui/search-input/search-input.component';
import { ViewSwitcherComponent } from '../../shared/ui/view-switcher/view-switcher.component';
import { TablePaginationComponent } from '../../shared/ui/table-pagination/table-pagination.component';
import { ErrorBoundaryComponent } from '../../shared/ui/error-boundary/error-boundary.component';
import { ToastService } from '../../shared/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PrintPhotoItem, PrintQueueModalComponent } from './print-queue-modal.component';
import { EventQrModalComponent } from './event-qr-modal.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { EventsService, EventItemResponseDto, CreateEventDto, UpdateEventDto } from './services/events.service';
import { PreferencesService } from '../../shared/services/preferences.service';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [
    FormField,
    HlmButtonDirective,
    HlmInputDirective,
    DrawerComponent,
    ConfirmDialogComponent,
    PrintQueueModalComponent,
    EventQrModalComponent,
    ClickOutsideDirective,
    PageHeaderComponent,
    KpiCardComponent,
    SearchInputComponent,
    ViewSwitcherComponent,
    TablePaginationComponent,
    ErrorBoundaryComponent,
    IconComponent,
    DatePipe
  ],
  templateUrl: './events.page.html',
  styleUrl: './events.page.css',
})
export class EventsPage implements OnInit {
  private readonly _eventsService = inject(EventsService);
  private readonly _toastService = inject(ToastService);
  private readonly _router = inject(Router);
  private readonly _preferencesService = inject(PreferencesService);

  private readonly initialPref = this._preferencesService.getPageFilter('events');

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly viewMode = signal<'cards' | 'table'>(this.initialPref.viewMode ?? 'cards');
  protected readonly activeRowMenuId = signal<string | null>(null);
  protected readonly activeDrawerTab = signal<'general' | 'frames' | 'limits'>('general');

  protected readonly eventsList = signal<EventItemResponseDto[]>([]);

  protected readonly searchQuery = signal(this.initialPref.searchQuery ?? '');
  protected readonly selectedStatusFilter = signal<string>(this.initialPref.statusFilter ?? 'ALL');

  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(6);

  protected readonly isFormDrawerOpen = signal(false);
  protected readonly isQrModalOpen = signal(false);
  protected readonly isPrintQueueModalOpen = signal(false);
  protected readonly isDeleteConfirmOpen = signal(false);
  protected readonly drawerMode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly selectedEvent = signal<EventItemResponseDto | null>(null);

  protected readonly mockPrintPhotos = signal<PrintPhotoItem[]>([
    {
      id: 'ph_1',
      guestName: 'Sofía Martínez',
      guestPhone: '+52 55 9876 5432',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      frameName: 'Marco Gold 360',
      requestedAt: '19:42 PM',
      status: 'Pending',
    },
    {
      id: 'ph_2',
      guestName: 'Carlos Mendoza',
      guestPhone: '+52 55 1234 5678',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      frameName: 'Gocam360 Emerald',
      requestedAt: '19:45 PM',
      status: 'Printed',
    },
  ]);

  protected readonly eventModel = signal({
    name: '',
    description: '',
    hostName: '',
    hostPhone: '',
    hostEmail: '',
    location: '',
    primaryColor: '#6366f1',
    coverImage: '',
    logoUrl: '',
    eventDate: new Date().toISOString().substring(0, 10),
    startTime: '18:00',
    endTime: '23:00',
    maxPhotosPerGuest: 10,
    maxPrintsPerGuest: 1,
    galleryRetentionDays: 7,
  });

  protected readonly eventForm = form(this.eventModel, (s) => {
    required(s.name, { message: 'El nombre del evento es obligatorio' });
    required(s.hostName, { message: 'El nombre del anfitrión es obligatorio' });
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(notify = false): void {
    this.hasError.set(false);

    if (this._eventsService.events() && !notify) {
      this.eventsList.set(this._eventsService.events()!);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(true);
    }

    this._eventsService.findAll(notify).subscribe({
      next: (data) => {
        this.eventsList.set(data);
        this.isLoading.set(false);
        this.hasError.set(false);
        if (notify) {
          this._toastService.info('Sincronización Completa', 'Lista de eventos actualizada desde la base de datos');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
        if (notify) {
          this._toastService.error('Error de Sincronización', 'No se pudieron recuperar los eventos');
        }
      },
    });
  }

  // Métricas calculadas desde los eventos de NestJS
  protected readonly totalEventsCount = computed(() => this.eventsList().length);
  protected readonly activeEventsCount = computed(() => this.eventsList().filter((e) => e.status === 'ACTIVE').length);
  protected readonly totalPhotosCount = computed(() => this.eventsList().reduce((acc, e) => acc + (e.totalPhotos || 0), 0));
  protected readonly totalPrintsCount = computed(() => this.eventsList().reduce((acc, e) => acc + (e.totalPrints || 0), 0));

  protected readonly filteredEvents = computed(() => {
    let list = this.eventsList();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatusFilter();

    if (query) {
      list = list.filter(
        (e) =>
          (e.title || e.name || '').toLowerCase().includes(query) ||
          (e.location || '').toLowerCase().includes(query) ||
          (e.hostName || '').toLowerCase().includes(query)
      );
    }

    if (status !== 'ALL') {
      list = list.filter((e) => e.status === status);
    }

    return list;
  });

  protected readonly paginatedEvents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredEvents().slice(start, start + this.pageSize());
  });

  protected readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredEvents().length / this.pageSize()));
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('events', { searchQuery: input.value });
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter.set(status);
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('events', { statusFilter: status });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatusFilter.set('ALL');
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('events', { searchQuery: '', statusFilter: 'ALL' });
  }

  toggleRowMenu(id: string, event?: Event): void {
    event?.stopPropagation();
    this.activeRowMenuId.update((curr) => (curr === id ? null : id));
  }

  closeRowMenu(): void {
    this.activeRowMenuId.set(null);
  }

  goToPrintQueue(ev?: EventItemResponseDto): void {
    if (ev) {
      this.selectedEvent.set(ev);
    }
    this.isPrintQueueModalOpen.set(true);
  }

  onNotifyWhatsApp(photo: PrintPhotoItem): void {
    const message = encodeURIComponent(`¡Hola ${photo.guestName}! Tu foto 360° en ${this.selectedEvent()?.title ?? 'el evento'} está lista. 📸✨`);
    const cleanPhone = photo.guestPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    this._toastService.success('WhatsApp Abierto', `Notificación lista para enviar a ${photo.guestName}`);
  }

  onMarkAsPrinted(photoId: string): void {
    this.mockPrintPhotos.update((photos) =>
      photos.map((p) => (p.id === photoId ? { ...p, status: 'Printed' as const } : p))
    );
    this._toastService.success('Impresión Procesada', 'Se envió la orden de impresión térmica.');
  }

  protected readonly eventFramesList = signal<{ id: string; name: string; previewUrl: string }[]>([]);

  private formatTimeToHHMM(val: any): string {
    if (!val) return '18:00';
    const str = String(val);
    if (/^\d{2}:\d{2}$/.test(str)) return str;
    if (/^\d{2}:\d{2}:\d{2}/.test(str)) return str.substring(0, 5);

    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const h = String(parsed.getUTCHours()).padStart(2, '0');
      const m = String(parsed.getUTCMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
    return '18:00';
  }

  private formatDateToYYYYMMDD(val: any): string {
    if (!val) return new Date().toISOString().substring(0, 10);
    const str = String(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(0, 10);
    }
    return new Date().toISOString().substring(0, 10);
  }

  onFrameFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        const newFrame = {
          id: `frame-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          previewUrl,
        };
        this.eventFramesList.update((frames) => [newFrame, ...frames]);
        this._toastService.success('Marco Cargado', `Se cargó el marco "${newFrame.name}" correctamente.`);
      };
      reader.readAsDataURL(file);
    }
  }

  removeFrame(frameId: string): void {
    this.eventFramesList.update((frames) => frames.filter((f) => f.id !== frameId));
    this._toastService.info('Marco Removido', 'Se removió el marco de la lista del evento.');
  }

  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.eventModel.update((m) => ({ ...m, coverImage: dataUrl }));
        this._toastService.success('Imagen de Portada', 'Se cargó la portada del evento.');
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onLogoUrlSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.eventModel.update((m) => ({ ...m, logoUrl: dataUrl }));
        this._toastService.success('Logo de Marca', 'Se cargó el logo del evento.');
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  openLiveWall(ev: EventItemResponseDto): void {
    this.activeRowMenuId.set(null);
    this._router.navigate(['/live-wall', ev.id]);
  }

  openCreateDrawer(): void {
    this.activeDrawerTab.set('general');
    this.eventFramesList.set([]);
    this.eventModel.set({
      name: '',
      description: '',
      hostName: '',
      hostPhone: '',
      hostEmail: '',
      location: '',
      primaryColor: '#6366f1',
      coverImage: '',
      logoUrl: '',
      eventDate: new Date().toISOString().substring(0, 10),
      startTime: '18:00',
      endTime: '23:00',
      maxPhotosPerGuest: 10,
      maxPrintsPerGuest: 1,
      galleryRetentionDays: 7,
    });
    this.drawerMode.set('create');
    this.isFormDrawerOpen.set(true);
  }

  openViewDrawer(ev: EventItemResponseDto): void {
    this.selectedEvent.set(ev);
    this.activeRowMenuId.set(null);
    this.drawerMode.set('view');
    this.isFormDrawerOpen.set(true);
  }

  openEditDrawer(ev: EventItemResponseDto): void {
    this.selectedEvent.set(ev);
    this.activeRowMenuId.set(null);
    this.activeDrawerTab.set('general');

    // Cargar los marcos reales asociados desde PostgreSQL Prisma
    const realFrames = (ev.eventFrames || [])
      .map((ef) => {
        const frame = ef.frame;
        if (!frame) return null;
        return {
          id: frame.id || ef.frameId,
          name: frame.name || 'Marco 360',
          previewUrl: frame.previewImage || frame.overlayImage || '',
        };
      })
      .filter((f): f is { id: string; name: string; previewUrl: string } => !!f && !!f.previewUrl);

    this.eventFramesList.set(realFrames);

    this.eventModel.set({
      name: ev.name || ev.title,
      description: ev.description || '',
      hostName: ev.hostName,
      hostPhone: ev.hostPhone || '',
      hostEmail: ev.hostEmail || '',
      location: ev.location || '',
      primaryColor: ev.primaryColor || '#6366f1',
      coverImage: ev.coverImage || '',
      logoUrl: ev.logoUrl || '',
      eventDate: this.formatDateToYYYYMMDD(ev.eventDate || ev.date),
      startTime: this.formatTimeToHHMM(ev.startTime),
      endTime: this.formatTimeToHHMM(ev.endTime),
      maxPhotosPerGuest: ev.maxPhotosPerGuest || 10,
      maxPrintsPerGuest: ev.maxPrintsPerGuest || 1,
      galleryRetentionDays: ev.galleryRetentionDays || 7,
    });
    this.drawerMode.set('edit');
    this.isFormDrawerOpen.set(true);
  }

  openQrModal(ev: EventItemResponseDto): void {
    this.selectedEvent.set(ev);
    this.activeRowMenuId.set(null);
    this.isQrModalOpen.set(true);
  }

  openGuestViewLocal(ev: EventItemResponseDto): void {
    this.isQrModalOpen.set(false);
    this._router.navigate(['/guest/event-join'], {
      queryParams: { code: ev.accessCode || ev.uniqueCode },
    });
  }

  copyQrLink(ev: EventItemResponseDto): void {
    const code = ev.accessCode || ev.uniqueCode;
    navigator.clipboard.writeText(`${window.location.origin}/guest/event-join?code=${code}`);
    this._toastService.success('Enlace Copiado', 'Link directo del evento copiado al portapapeles');
    this.isQrModalOpen.set(false);
  }

  onFormSubmit(): void {
    submit(this.eventForm, async () => {
      if (this.isSubmitting()) return;
      this.isSubmitting.set(true);

      const formVal = this.eventModel();
      const dateStr = formVal.eventDate || new Date().toISOString().substring(0, 10);
      const eventDateIso = new Date(`${dateStr}T00:00:00.000Z`).toISOString();
      const startTimeIso = new Date(`${dateStr}T${formVal.startTime || '18:00'}:00.000Z`).toISOString();
      const endTimeIso = new Date(`${dateStr}T${formVal.endTime || '23:00'}:00.000Z`).toISOString();

      if (this.drawerMode() === 'create') {
        const payload: CreateEventDto = {
          name: formVal.name,
          hostName: formVal.hostName,
          eventDate: eventDateIso,
          startTime: startTimeIso,
          endTime: endTimeIso,
          maxPhotosPerGuest: Number(formVal.maxPhotosPerGuest),
          maxPrintsPerGuest: Number(formVal.maxPrintsPerGuest),
          galleryRetentionDays: Number(formVal.galleryRetentionDays),
        };

        const customFrames = this.eventFramesList()
          .filter((f) => f.previewUrl.startsWith('data:image'))
          .map((f) => ({ name: f.name, overlayBase64: f.previewUrl }));

        if (formVal.description?.trim()) payload.description = formVal.description.trim();
        if (formVal.hostPhone?.trim()) payload.hostPhone = formVal.hostPhone.trim();
        if (formVal.hostEmail?.trim()) payload.hostEmail = formVal.hostEmail.trim();
        if (formVal.location?.trim()) payload.location = formVal.location.trim();
        if (formVal.primaryColor?.trim()) payload.primaryColor = formVal.primaryColor.trim();
        if (formVal.coverImage?.trim()) payload.coverImage = formVal.coverImage.trim();
        if (formVal.logoUrl?.trim()) payload.logoUrl = formVal.logoUrl.trim();
        if (customFrames.length > 0) payload.frames = customFrames;

        this._eventsService.create(payload).subscribe({
          next: (newEv) => {
            this.isSubmitting.set(false);
            this.eventsList.update((list) => [newEv, ...list]);
            this._toastService.success('Evento Creado', `Se creó el evento "${newEv.title}".`);
            this.isFormDrawerOpen.set(false);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            const msg = Array.isArray(err?.error?.message) ? err.error.message.join(', ') : (err?.error?.message || 'No se pudo crear el evento');
            this._toastService.error('Error de Validación', msg);
          },
        });

      } else if (this.drawerMode() === 'edit' && this.selectedEvent()) {
        const targetId = this.selectedEvent()!.id;
        const customFrames = this.eventFramesList()
          .filter((f) => f.previewUrl.startsWith('data:image'))
          .map((f) => ({ name: f.name, overlayBase64: f.previewUrl }));

        const keepFrameIds = this.eventFramesList()
          .filter((f) => !f.previewUrl.startsWith('data:image'))
          .map((f) => f.id);

        const payload: UpdateEventDto = {
          name: formVal.name,
          hostName: formVal.hostName,
          eventDate: eventDateIso,
          startTime: startTimeIso,
          endTime: endTimeIso,
          maxPhotosPerGuest: Number(formVal.maxPhotosPerGuest),
          maxPrintsPerGuest: Number(formVal.maxPrintsPerGuest),
          galleryRetentionDays: Number(formVal.galleryRetentionDays),
          keepFrameIds,
        };

        if (formVal.description?.trim()) payload.description = formVal.description.trim();
        if (formVal.hostPhone?.trim()) payload.hostPhone = formVal.hostPhone.trim();
        if (formVal.hostEmail?.trim()) payload.hostEmail = formVal.hostEmail.trim();
        if (formVal.location?.trim()) payload.location = formVal.location.trim();
        if (formVal.primaryColor?.trim()) payload.primaryColor = formVal.primaryColor.trim();
        if (formVal.coverImage?.trim()) payload.coverImage = formVal.coverImage.trim();
        if (formVal.logoUrl?.trim()) payload.logoUrl = formVal.logoUrl.trim();
        if (customFrames.length > 0) payload.frames = customFrames;

        this._eventsService.update(targetId, payload).subscribe({
          next: (updatedEv) => {
            this.isSubmitting.set(false);
            this.eventsList.update((list) =>
              list.map((e) => (e.id === targetId ? updatedEv : e))
            );
            this._toastService.info('Evento Actualizado', 'Los cambios se guardaron.');
            this.isFormDrawerOpen.set(false);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            const msg = err?.error?.message || 'Error al actualizar evento';
            this._toastService.error('Error', msg);
          },
        });
      }
    });
  }

  confirmDelete(ev: EventItemResponseDto): void {
    this.selectedEvent.set(ev);
    this.activeRowMenuId.set(null);
    this.isDeleteConfirmOpen.set(true);
  }

  executeDelete(): void {
    if (this.selectedEvent()) {
      const id = this.selectedEvent()!.id;
      this._eventsService.remove(id).subscribe({
        next: () => {
          this.eventsList.update((list) => list.filter((e) => e.id !== id));
          this._toastService.error('Evento Eliminado', 'El evento ha sido eliminado.');
        },
        error: () => {
          this._toastService.error('Error', 'No se pudo eliminar el evento.');
        },
      });
    }
  }
}
