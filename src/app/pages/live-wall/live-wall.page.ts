import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ApiClientService } from '../../core/services/api-client.service';
import { ToastService } from '../../shared/services/toast.service';

export interface LiveWallPhotoDto {
  id: string;
  storagePath: string;
  guestName: string;
  uploadedAt: string | Date;
  likesCount: number;
}

export interface LiveWallDataDto {
  id: string;
  name: string;
  accessCode: string;
  qrToken: string;
  primaryColor?: string;
  logoUrl?: string;
  photos: LiveWallPhotoDto[];
}

@Component({
  selector: 'app-live-wall-page',
  standalone: true,
  imports: [IconComponent, DatePipe, RouterLink],
  templateUrl: './live-wall.page.html',
  styleUrl: './live-wall.page.css',
})
export class LiveWallPage implements OnInit, OnDestroy {
  private readonly _route = inject(ActivatedRoute);
  private readonly _api = inject(ApiClientService);
  private readonly _toast = inject(ToastService);

  protected readonly eventData = signal<LiveWallDataDto | null>(null);
  protected readonly activePhotoIndex = signal(0);
  protected readonly currentPhoto = signal<LiveWallPhotoDto | null>(null);

  private rotationInterval: any;
  private syncInterval: any;

  ngOnInit(): void {
    const eventId = this._route.snapshot.paramMap.get('id');
    if (!eventId) return;

    // 1. Carga inicial de datos desde el backend
    this.loadWallData(eventId);

    // 2. Timer de rotación local cada 5 segundos
    this.rotationInterval = setInterval(() => this.rotatePhoto(), 5000);

    // 3. Polling silencioso cada 12 segundos para sincronizar fotos nuevas desde Render
    this.syncInterval = setInterval(() => this.loadWallData(eventId, true), 12000);
  }

  ngOnDestroy(): void {
    if (this.rotationInterval) clearInterval(this.rotationInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  private loadWallData(eventId: string, isSilentSync = false): void {
    // 👈 Ruta corregida coincidiendo con GuestExperienceController en NestJS
    this._api.get<LiveWallDataDto>(`/guest-experience/event/${eventId}/live-wall`).subscribe({
      next: (data) => {
        const previousCount = this.eventData()?.photos?.length ?? 0;
        this.eventData.set(data);

        if (data.photos && data.photos.length > 0) {
          // Si no había foto actual o ingresaron fotos nuevas, actualizar la lista
          if (!this.currentPhoto() || data.photos.length > previousCount) {
            this.currentPhoto.set(data.photos[this.activePhotoIndex() % data.photos.length]);
          }
        }
      },
      error: () => {
        if (!isSilentSync) {
          this._toast.error('Error de Conexión', 'No se pudo conectar con el servidor del proyector.');
        }
      },
    });
  }

  private rotatePhoto(): void {
    const photos = this.eventData()?.photos;
    if (!photos || photos.length === 0) return;

    const nextIndex = (this.activePhotoIndex() + 1) % photos.length;
    this.activePhotoIndex.set(nextIndex);
    this.currentPhoto.set(photos[nextIndex]);
  }

  selectPhotoIndex(idx: number): void {
    const photos = this.eventData()?.photos;
    if (!photos || !photos[idx]) return;

    this.activePhotoIndex.set(idx);
    this.currentPhoto.set(photos[idx]);
  }

  // Generador dinámico de URL del código QR para ser escaneado desde la proyección
  getQrCodeUrl(): string {
    const code = this.eventData()?.accessCode;
    if (!code) return '';
    const joinUrl = `${window.location.origin}/guest/event-join?code=${code}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`;
  }
}
