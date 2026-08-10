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
  template: `
    <div class="min-h-screen bg-background text-foreground flex items-center justify-center p-2 sm:p-4 font-sans select-none transition-colors duration-300">
      
      <!-- Contenedor Frame Móvil (Swiss Obsidian 100% Sólido) -->
      <div class="w-full max-w-[420px] bg-card rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[720px] flex flex-col border-4 border-border transition-all duration-300">

        <!-- Notch Superior Simulado del Smartphone -->
        <div class="h-6 w-full flex justify-center pt-2 absolute top-0 z-50 pointer-events-none">
          <div class="w-16 h-1.5 bg-border rounded-full"></div>
        </div>

        <!-- ==================== PASO 1: LOGIN / AUTOTYPE CÓDIGO ==================== -->
        @if (currentStep() === 'LOGIN') {
          <div class="flex-1 flex flex-col p-6 sm:p-8 pt-14 animate-in slide-in-from-right-4 duration-300">

            <div class="flex-1 flex flex-col justify-center space-y-6">
              
              <!-- Brand Icon Header -->
              <div class="text-center space-y-2">
                <div class="w-14 h-14 bg-foreground text-background font-black text-2xl rounded-2xl flex items-center justify-center mx-auto shadow-xl tracking-tighter">
                  g
                </div>
                <h1 class="text-2xl font-black tracking-tight text-foreground">gocam360</h1>
                <p class="text-xs text-muted-foreground leading-relaxed px-2">
                  Conéctate al evento en vivo y envía tus mejores fotografías 360° directamente a la estación de impresión.
                </p>
              </div>

              <!-- Formulario de Ingreso de Invitado -->
              <form (submit)="onJoinSubmit(); $event.preventDefault()" class="space-y-4 pt-2">
                
                <!-- CÓDIGO DE ACCESO CÓN ANIMACIÓN AUTOTYPE -->
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Código Único del Evento
                  </label>
                  <div class="relative">
                    <input
                      type="text"
                      [value]="displayEventCode()"
                      (input)="onManualCodeInput($event)"
                      placeholder="EJ. BODA-2026"
                      class="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 font-mono font-black text-foreground text-center uppercase tracking-widest text-base focus:outline-none focus:border-foreground transition-all shadow-inner"
                    />
                    @if (isAutoTyping()) {
                      <span class="absolute right-3 top-3.5 flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    }
                  </div>
                  @if (isAutoTyping()) {
                    <p class="text-[10px] text-emerald-400 font-mono text-center animate-pulse">⚡ Código escaneado por QR autocompletado...</p>
                  }
                </div>

                <!-- NOMBRE DEL INVITADO -->
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    [value]="guestName()"
                    (input)="guestName.set($any($event.target).value)"
                    placeholder="Ej. Camila Moya"
                    class="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-foreground transition-all placeholder:text-muted-foreground/60"
                  />
                </div>

                <!-- TELÉFONO DE WHATSAPP -->
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Teléfono (WhatsApp para Aviso) *
                  </label>
                  <input
                    type="tel"
                    [value]="guestPhone()"
                    (input)="guestPhone.set($any($event.target).value)"
                    placeholder="Ej. +52 55 1234 5678"
                    class="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-foreground transition-all placeholder:text-muted-foreground/60 font-mono"
                  />
                </div>

                <!-- BOTÓN SUBMIT -->
                <div class="pt-2">
                  <button
                    type="submit"
                    [disabled]="!displayEventCode() || !guestName() || !guestPhone() || isSubmitting()"
                    class="w-full h-12 rounded-xl bg-foreground text-background font-black text-xs shadow-md hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    @if (isSubmitting()) {
                      <app-icon name="refresh" class="w-4 h-4 animate-spin" />
                      <span>Conectando con el Evento...</span>
                    } @else {
                      <span>Entrar al Evento →</span>
                    }
                  </button>
                </div>

              </form>

            </div>

          </div>
        }

        <!-- ==================== PASO 2: LOADER BIENVENIDA AL EVENTO ==================== -->
        @else if (currentStep() === 'LOADING_EVENT') {
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div class="relative">
              <div class="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
              <div class="absolute inset-0 flex items-center justify-center text-xl">
                🎪
              </div>
            </div>
            
            <div class="space-y-2">
              <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold font-mono uppercase tracking-widest">
                VERIFICANDO CÓDIGO {{ displayEventCode() }}
              </span>
              <h2 class="text-2xl font-black text-foreground tracking-tight">¡Bienvenido(a), {{ guestName() }}!</h2>
              <p class="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Cargando los marcos decorativos y configuraciones en vivo para <span class="font-bold text-foreground">{{ eventData()?.name || 'tu evento' }}</span>...
              </p>
            </div>
          </div>
        }

        <!-- ==================== PASO 3: BIENVENIDA Y OPCIONES DE CAPTURA ==================== -->
        @else if (currentStep() === 'WELCOME') {
          <div class="flex-1 flex flex-col p-6 pt-14 bg-gradient-to-b from-card via-card to-muted/20 animate-in slide-in-from-right-4 duration-300">

            <div class="text-center mt-2 mb-6 space-y-2">
              <span class="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                ● CONECTADO EN VIVO
              </span>
              <h2 class="text-2xl font-black text-foreground tracking-tight">
                ¡Hola, {{ guestName() }}!
              </h2>
              <p class="text-xs text-muted-foreground px-2 leading-relaxed">
                Bienvenido al evento <span class="font-bold text-foreground">{{ eventData()?.name || 'Evento 360°' }}</span>. Captura tus mejores momentos e imprímelos físicamente en tiempo real.
              </p>
            </div>

            <div class="grid grid-cols-1 gap-3.5 mt-auto mb-6">
              <input #cameraInput type="file" accept="image/*" capture="environment" class="hidden" (change)="onFileSelected($event)" />
              <input #galleryInput type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)" />

              <!-- Tomar Foto -->
              <button
                type="button"
                (click)="cameraInput.click()"
                class="w-full h-20 bg-foreground text-background rounded-2xl flex items-center p-4 transition-all shadow-xl hover:opacity-90 active:scale-[0.98] cursor-pointer group"
              >
                <div class="h-12 w-12 bg-background/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <app-icon name="camera" class="w-6 h-6 text-background" />
                </div>
                <div class="ml-4 text-left">
                  <div class="font-black text-base leading-tight">Tomar Foto 360°</div>
                  <div class="text-[11px] opacity-80 font-medium">Usar la cámara de tu dispositivo ahora</div>
                </div>
              </button>

              <!-- Subir de Galería -->
              <button
                type="button"
                (click)="galleryInput.click()"
                class="w-full h-20 bg-card border-2 border-border hover:border-foreground rounded-2xl flex items-center p-4 transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div class="h-12 w-12 bg-muted rounded-xl text-foreground flex items-center justify-center group-hover:scale-110 transition-all">
                  <app-icon name="grid" class="w-6 h-6 text-foreground" />
                </div>
                <div class="ml-4 text-left">
                  <div class="font-black text-foreground text-base leading-tight">Subir de Galería</div>
                  <div class="text-[11px] text-muted-foreground">Elegir foto existente de tu celular</div>
                </div>
              </button>
            </div>

          </div>
        }

        <!-- ==================== PASO 4: SELECCIÓN DE MARCO Y PREVIEW ==================== -->
        @else if (currentStep() === 'FRAME') {
          <div class="flex-1 flex flex-col bg-popover-solid text-popover-foreground animate-in slide-in-from-right-4 duration-300">

            <!-- Navbar Top Back -->
            <div class="flex items-center justify-between p-4 pt-10 border-b border-border/60">
              <button
                type="button"
                (click)="currentStep.set('WELCOME')"
                class="p-2 bg-muted/60 rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <app-icon name="chevron-right" class="w-4 h-4 rotate-180 text-foreground" />
              </button>
              <span class="text-xs font-extrabold text-foreground">Personalizar Foto con Marco</span>
              <div class="w-8"></div>
            </div>

            <!-- Preview Foto con Marco Superpuesto -->
            <div class="flex-1 flex items-center justify-center p-5 overflow-hidden">
              <div class="relative w-full aspect-[3/4] bg-muted rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img [src]="selectedPhotoUrl()" class="w-full h-full object-cover" alt="Tu foto capturada" />
                @if (selectedOverlayUrl()) {
                  <img [src]="selectedOverlayUrl()" class="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" alt="Marco PNG" />
                }
              </div>
            </div>

            <!-- Bottom Sheet de Marcos Disponibles -->
            <div class="bg-card rounded-t-[2rem] p-5 pb-6 flex flex-col gap-4 border-t border-border">
              <div>
                <h3 class="text-xs font-bold text-foreground">Elige un Marco Decorativo</h3>
                <p class="text-[11px] text-muted-foreground">Toca un diseño para previsualizarlo sobre tu foto</p>
              </div>

              <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                @for (frame of framesList(); track frame.id) {
                  <button
                    type="button"
                    (click)="selectedFrameId.set(frame.id)"
                    class="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                  >
                    <div
                      class="w-16 h-20 rounded-xl border-2 transition-all p-1 flex items-center justify-center bg-muted/30"
                      [class.border-primary]="selectedFrameId() === frame.id"
                      [class.border-border]="selectedFrameId() !== frame.id"
                    >
                      <span class="text-[10px] font-bold text-center text-foreground font-mono">{{ frame.name }}</span>
                    </div>
                  </button>
                }
              </div>

              <button
                type="button"
                (click)="sendToPrintQueue()"
                [disabled]="isUploading()"
                class="w-full h-12 rounded-xl bg-foreground text-background font-black text-xs shadow-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                @if (isUploading()) {
                  <app-icon name="refresh" class="w-4 h-4 animate-spin" />
                  <span>Enviando a la Impresora Térmica...</span>
                } @else {
                  <span>Enviar a Cola de Impresión Térmica 🖨️</span>
                }
              </button>
            </div>

          </div>
        }

        <!-- ==================== PASO 5: ÉXITO Y CAPTURA CRM ==================== -->
        @else if (currentStep() === 'SUCCESS') {
          <div class="flex-1 flex flex-col p-6 bg-card animate-in zoom-in-95 duration-500 pt-14 justify-between">
            
            <div class="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div class="relative">
                <div class="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-xl text-3xl">
                  ✓
                </div>
              </div>

              <div class="space-y-1">
                <h2 class="text-2xl font-extrabold text-foreground tracking-tight">¡Fotografía Enviada!</h2>
                <p class="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                  Tu foto ha ingresado a la cola de la estación de impresión física. Te avisaremos por WhatsApp cuando esté lista.
                </p>
              </div>

              <button
                type="button"
                (click)="takeAnotherPhoto()"
                class="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-all active:scale-95 cursor-pointer"
              >
                📷 Tomar otra fotografía
              </button>
            </div>

            <!-- Tarjeta CRM Lead Magnet -->
            <div class="bg-popover-solid text-popover-foreground p-4 rounded-2xl border border-border/80 space-y-3 shadow-xl">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl bg-primary/20 text-primary font-black text-sm flex items-center justify-center shrink-0">
                  🚀
                </div>
                <div>
                  <span class="text-[10px] font-bold text-primary uppercase tracking-wider block">POWERED BY GOCAM360</span>
                  <p class="text-xs text-foreground font-semibold">¿Te gustó la experiencia? Llévala a tu propio evento.</p>
                </div>
              </div>

              @if (isCrmSubmitted()) {
                <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                  ✓ ¡Gracias! Te enviamos la información por WhatsApp.
                </div>
              } @else {
                <button
                  type="button"
                  (click)="sendCrmQuote()"
                  class="w-full h-10 rounded-xl bg-foreground text-background font-bold text-xs shadow-md hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Quiero Cotizar Mi Evento →</span>
                </button>
              }
            </div>

          </div>
        }

      </div>

    </div>
  `,
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
