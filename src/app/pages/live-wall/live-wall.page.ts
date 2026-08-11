import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ApiClientService } from '../../core/services/api-client.service';

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

  protected readonly eventData = signal<LiveWallDataDto | null>(null);
  protected readonly activePhotoIndex = signal(0);

  private intervalId: any;

  protected readonly currentPhoto = signal<LiveWallPhotoDto | null>(null);

  ngOnInit(): void {
    const eventId = this._route.snapshot.paramMap.get('id') || 'demo';
    this.loadWallData(eventId);

    // Auto-rotation timer every 5 seconds
    this.intervalId = setInterval(() => {
      this.rotatePhoto();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private loadWallData(eventId: string): void {
    this._api.get<LiveWallDataDto>(`/guest-experience/live-wall/${eventId}`).subscribe({
      next: (data) => {
        this.eventData.set(data);
        if (data.photos && data.photos.length > 0) {
          this.currentPhoto.set(data.photos[0]);
        }
      },
      error: () => {
        const mockData: LiveWallDataDto = {
          id: eventId,
          name: 'Gala Corporativa L\'Oréal 360°',
          accessCode: 'LOREAL360',
          qrToken: 'qr-token-demo',
          photos: [
            {
              id: 'p1',
              storagePath: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
              guestName: 'Sofía Martínez',
              uploadedAt: new Date().toISOString(),
              likesCount: 14,
            },
            {
              id: 'p2',
              storagePath: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
              guestName: 'Alejandro Rivera',
              uploadedAt: new Date(Date.now() - 300000).toISOString(),
              likesCount: 22,
            },
            {
              id: 'p3',
              storagePath: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80',
              guestName: 'Marcos Chen',
              uploadedAt: new Date(Date.now() - 600000).toISOString(),
              likesCount: 9,
            },
          ],
        };
        this.eventData.set(mockData);
        this.currentPhoto.set(mockData.photos[0]);
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
}
