import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { ToastService } from '../../shared/services/toast.service';
import { GuestExperienceService } from './services/guest-experience.service';
import { PublicEventDto, PublicFrameDto } from '../../shared/models/event.model';

export type StepType = 'STEP_1_CODE' | 'STEP_2_GUEST_INFO' | 'LOADING_EVENT' | 'WELCOME' | 'FRAME' | 'SUCCESS';
export type { PublicEventDto, PublicFrameDto };

@Component({
  selector: 'app-guest-event-join-page',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './guest-event-join.page.html',
  styleUrl: './guest-event-join.page.css',
})
export class GuestEventJoinPage implements OnInit, OnDestroy {
  private readonly _route = inject(ActivatedRoute);
  private readonly _guestService = inject(GuestExperienceService);
  private readonly _toast = inject(ToastService);

  protected readonly currentStep = signal<StepType>('STEP_1_CODE');
  protected readonly currentGuestId = signal<string | null>(null);
  protected readonly displayEventCode = signal('');
  protected readonly guestName = signal('');
  protected readonly guestPhone = signal('');
  protected readonly phoneCountryCode = signal('+591');

  // Control de cuotas de fotos e impresiones del invitado
  protected readonly photosUploaded = signal(0);
  protected readonly printsRequested = signal(0);

  protected readonly remainingPhotos = computed(() => {
    const max = this.eventData()?.maxPhotosPerGuest ?? 10;
    return Math.max(0, max - this.photosUploaded());
  });

  protected readonly remainingPrints = computed(() => {
    const max = this.eventData()?.maxPrintsPerGuest ?? 1;
    return Math.max(0, max - this.printsRequested());
  });

  protected readonly isAutoTyping = signal(false);
  protected readonly isValidatingCode = signal(false);
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
        this.autoTypeTimeout = setTimeout(typeNextChar, 100);
      } else {
        this.isAutoTyping.set(false);
        // Autovalidar código tras completar animación
        this.validateEventCode();
      }
    };
    typeNextChar();
  }

  onManualCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.displayEventCode.set(target.value.toUpperCase().trim());
  }

  // Paso 1: Validar Código de Evento
  validateEventCode(): void {
    const code = this.displayEventCode().trim();
    if (!code) {
      this._toast.error('Código requerido', 'Ingresa el código único del evento.');
      return;
    }

    this.isValidatingCode.set(true);
    this._guestService.getPublicEvent(code).subscribe({
      next: (data) => {
        this.isValidatingCode.set(false);
        this.eventData.set(data);
        if (data.frames?.length) {
          this.framesList.set(data.frames);
          this.selectedFrameId.set(data.frames[0].id);
        }
        // Transición suave al Paso 2: Registro de Invitado
        this.currentStep.set('STEP_2_GUEST_INFO');
        this._toast.success('Evento Encontrado', `Bienvenido a "${data.name}"`);
      },
      error: (err) => {
        this.isValidatingCode.set(false);
        const msg = err?.error?.message || 'Código de evento no encontrado. Verifica el acceso.';
        this._toast.error('Evento no encontrado', msg);
      },
    });
  }

  // Paso 2: Registro de Invitado (Nombre + Teléfono con +591)
  onGuestRegisterSubmit(): void {
    const code = this.displayEventCode().trim();
    const name = this.guestName().trim();
    let rawPhone = this.guestPhone().trim();

    if (!name) {
      this._toast.error('Nombre requerido', 'Por favor ingresa tu nombre completo.');
      return;
    }
    if (!rawPhone) {
      this._toast.error('Teléfono requerido', 'Ingresa tu número de WhatsApp para avisarte sobre tus fotos.');
      return;
    }

    // Formatear teléfono con prefijo Bolivia +591 si no lo incluye
    let fullPhone = rawPhone;
    if (!rawPhone.startsWith('+')) {
      const cleanDigits = rawPhone.replace(/\D/g, '');
      fullPhone = `${this.phoneCountryCode()} ${cleanDigits}`;
    }

    this.isSubmitting.set(true);
    const eventId = this.eventData()?.id;

    this._guestService.joinEvent({ eventCode: code, guestName: name, guestPhone: fullPhone }).subscribe({
      next: (res) => {
        if (res?.guestId) {
          this.currentGuestId.set(res.guestId);
        }
        if (res?.photosUploaded !== undefined) {
          this.photosUploaded.set(res.photosUploaded);
        }
        if (res?.printsRequested !== undefined) {
          this.printsRequested.set(res.printsRequested);
        }
        this.isSubmitting.set(false);
        // Transición fluida a la pantalla de bienvenida y captura de fotos
        this.currentStep.set('WELCOME');
        this._toast.success('Conectado', `¡Hola ${name}! Todo listo para tus fotos 360°.`);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this._toast.error('Error de Conexión', err?.error?.message || 'No se pudo registrar al invitado');
      },
    });
  }

  private compressImage(file: File, maxWidth = 1080, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No canvas context');

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      try {
        const compressedBase64 = await this.compressImage(target.files[0]);
        this.selectedPhotoUrl.set(compressedBase64);
        this.currentStep.set('FRAME');
      } catch {
        this._toast.error('Error', 'No se pudo procesar la imagen seleccionada.');
      }
    }
  }

  selectedOverlayUrl(): string {
    const frame = this.framesList().find((f) => f.id === this.selectedFrameId());
    return frame?.overlayUrl || '';
  }

  discardPhoto(): void {
    this.selectedPhotoUrl.set('');
    this.currentStep.set('WELCOME');
    this._toast.info('Foto Descartada', 'Puedes tomar o elegir otra fotografía.');
  }

  sendToPrintQueue(): void {
    if (this.remainingPhotos() <= 0) {
      this._toast.error('Límite de fotos alcanzado', 'Has alcanzado el número máximo de fotografías permitidas para este evento.');
      return;
    }

    const guestId = this.currentGuestId();
    const eventId = this.eventData()?.id;

    if (!guestId || !eventId) {
      this._toast.error('Error de Sesión', 'No se encontró el registro del invitado. Por favor reingresa.');
      return;
    }

    this.isUploading.set(true);
    const payload = {
      eventId,
      guestId,
      frameId: this.selectedFrameId(),
      photoBase64: this.selectedPhotoUrl(),
    };

    this._guestService.uploadPhoto(payload).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.photosUploaded.update((n) => n + 1);
        this.printsRequested.update((n) => n + 1);
        this.currentStep.set('SUCCESS');
        this._toast.success('Foto Enviada', 'Tu orden ha ingresado a la cola de impresión.');
      },
      error: (err) => {
        this.isUploading.set(false);
        this._toast.error('Error al enviar', err?.error?.message || 'No se pudo procesar la orden.');
      },
    });
  }

  takeAnotherPhoto(): void {
    this.currentStep.set('WELCOME');
  }

  sendCrmQuote(): void {
    this._guestService.sendCrmQuote({
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
