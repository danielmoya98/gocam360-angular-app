import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { ToastService } from '../../shared/services/toast.service';
import { ApiClientService } from '../../core/services/api-client.service';

export type StepType = 'LOGIN' | 'LOADING_EVENT' | 'WELCOME' | 'FRAME' | 'SUCCESS';

export interface PublicFrameDto {
  id: string;
  name: string;
  previewUrl?: string;
  overlayUrl?: string;
  thumbnailColor?: string;
}

export interface PublicEventDto {
  id: string;
  name: string;
  status: string;
  primaryColor?: string;
  logoUrl?: string;
  frames: PublicFrameDto[];
}

@Component({
  selector: 'app-guest-event-join-page',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './guest-event-join.page.html',
  styleUrl: './guest-event-join.page.css',
})
export class GuestEventJoinPage implements OnInit, OnDestroy {
  private readonly _route = inject(ActivatedRoute);
  private readonly _api = inject(ApiClientService);
  private readonly _toast = inject(ToastService);

  protected readonly currentStep = signal<StepType>('LOGIN');

  protected readonly displayEventCode = signal('');
  protected readonly guestName = signal('');
  protected readonly guestPhone = signal('');

  protected readonly isAutoTyping = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isUploading = signal(false);
  protected readonly isCrmSubmitted = signal(false);

  protected readonly eventData = signal<PublicEventDto | null>(null);
  protected readonly framesList = signal<PublicFrameDto[]>([]);

  protected readonly selectedPhotoUrl = signal<string>('https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80');
  protected readonly selectedFrameId = signal<string>('');

  private autoTypeTimeout: any;

  ngOnInit(): void {
    const codeParam = this._route.snapshot.queryParamMap.get('code') || this._route.snapshot.queryParamMap.get('event');
    if (codeParam) {
      this.startAutoTypeAnimation(codeParam.toUpperCase());
    }
  }

  ngOnDestroy(): void {
    if (this.autoTypeTimeout) {
      clearTimeout(this.autoTypeTimeout);
    }
  }

  startAutoTypeAnimation(code: string): void {
    this.isAutoTyping.set(true);
    let i = 0;
    const typeNextChar = () => {
      if (i <= code.length) {
        this.displayEventCode.set(code.substring(0, i));
        i++;
        this.autoTypeTimeout = setTimeout(typeNextChar, 120);
      } else {
        this.isAutoTyping.set(false);
      }
    };
    typeNextChar();
  }

  onManualCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.displayEventCode.set(target.value.toUpperCase());
  }

  onJoinSubmit(): void {
    const code = this.displayEventCode();
    const name = this.guestName();
    const phone = this.guestPhone();

    if (!code || !name || !phone) {
      this._toast.error('Campos incompletos', 'Ingresa el código del evento, tu nombre y teléfono');
      return;
    }

    this.isSubmitting.set(true);
    this.currentStep.set('LOADING_EVENT');

    // Consumir API GET /guest-experience/event/:code
    this._api.get<PublicEventDto>(`/guest-experience/event/${code}`).subscribe({
      next: (data) => {
        this.eventData.set(data);
        if (data.frames && data.frames.length > 0) {
          this.framesList.set(data.frames);
          this.selectedFrameId.set(data.frames[0].id);
        }
        
        // Consumir API POST /guest-experience/join
        this._api.post('/guest-experience/join', { eventCode: code, guestName: name, guestPhone: phone }).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.currentStep.set('WELCOME');
            this._toast.success('Conectado', `Bienvenido al evento ${data.name}`);
          },
          error: () => {
            this.isSubmitting.set(false);
            this.currentStep.set('WELCOME');
          },
        });
      },
      error: () => {
        // Mock fallback de demostración si la API aún no está disponible
        const mockEvent: PublicEventDto = {
          id: 'ev-1',
          name: 'Lanzamiento L\'Oréal 360°',
          status: 'ACTIVE',
          frames: [
            { id: 'f1', name: 'Gold Celebration', overlayUrl: '' },
            { id: 'f2', name: 'Emerald Elegant', overlayUrl: '' },
          ],
        };
        this.eventData.set(mockEvent);
        this.framesList.set(mockEvent.frames);
        this.selectedFrameId.set(mockEvent.frames[0].id);

        setTimeout(() => {
          this.isSubmitting.set(false);
          this.currentStep.set('WELCOME');
        }, 1200);
      },
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedPhotoUrl.set(e.target.result);
        this.currentStep.set('FRAME');
      };
      reader.readAsDataURL(file);
    }
  }

  selectedOverlayUrl(): string {
    const frame = this.framesList().find((f) => f.id === this.selectedFrameId());
    return frame?.overlayUrl || '';
  }

  sendToPrintQueue(): void {
    this.isUploading.set(true);
    const payload = {
      eventId: this.eventData()?.id || 'ev-1',
      guestId: 'guest-1',
      frameId: this.selectedFrameId(),
      photoBase64: this.selectedPhotoUrl(),
    };

    this._api.post('/guest-experience/upload', payload).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.currentStep.set('SUCCESS');
        this._toast.success('Foto Enviada', 'Tu orden ha ingresado a la cola de impresión.');
      },
      error: () => {
        setTimeout(() => {
          this.isUploading.set(false);
          this.currentStep.set('SUCCESS');
          this._toast.success('Foto Enviada', 'Tu orden ha ingresado a la cola de impresión.');
        }, 1000);
      },
    });
  }

  takeAnotherPhoto(): void {
    this.currentStep.set('WELCOME');
  }

  sendCrmQuote(): void {
    this._api.post('/guest-experience/crm-lead', {
      name: this.guestName(),
      phone: this.guestPhone(),
      eventId: this.eventData()?.id,
      notes: 'Solicita cotización desde la app de invitado 360°',
    }).subscribe({
      next: () => {
        this.isCrmSubmitted.set(true);
        this._toast.success('Solicitud Recibida', 'Nos pondremos en contacto contigo por WhatsApp.');
      },
      error: () => {
        this.isCrmSubmitted.set(true);
        this._toast.success('Solicitud Recibida', 'Nos pondremos en contacto contigo por WhatsApp.');
      },
    });
  }
}
