import { Component, EventEmitter, Input, Output, signal, HostListener, computed } from '@angular/core';

export interface EventItem {
  id: string;
  title: string;
  category?: string;
  date?: string | Date;
  time?: string;
  location?: string;
  image?: string;
  status?: string;
  guestsCount?: number;
  printQueueCount?: number;
  qrCodeUrl?: string;
  uniqueCode?: string;
}

@Component({
  selector: 'app-event-qr-modal',
  standalone: true,
  host: {
    class: 'contents',
  },
  template: `
    @if (isVisible()) {
      <!-- Fixed Fullscreen Backdrop con Blur Completo y Z-Index de Prioridad (z-[250000]) -->
      <div
        class="fixed inset-0 bg-black/75 backdrop-blur-md z-[250000] flex items-center justify-center p-4 transition-all duration-300 ease-out"
        [class.animate-in]="isAnimatingIn()"
        [class.fade-in]="isAnimatingIn()"
        [class.animate-out]="isClosing()"
        [class.fade-out]="isClosing()"
        (click)="close()"
      >
        <!-- Modal Container (Animación ultra-suave) -->
        <div
          class="w-full max-w-sm bg-popover-solid text-popover-foreground border border-border rounded-3xl shadow-2xl p-6 text-center space-y-4 relative z-[250001] transition-transform duration-250"
          [class.animate-dialog-in]="isAnimatingIn()"
          [class.animate-dialog-out]="isClosing()"
          (click)="$event.stopPropagation()"
        >
          <div class="flex justify-between items-center pb-2 border-b border-border/60">
            <h3 class="text-sm font-bold text-foreground">Código QR del Evento</h3>
            <button
              type="button"
              (click)="close()"
              class="w-6 h-6 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="p-4 bg-white rounded-2xl inline-block border border-gray-100 shadow-inner">
            @if (event) {
              <img [src]="qrImageUrl()" [alt]="'QR ' + event.title" class="w-48 h-48 mx-auto object-contain rounded-lg" />
            }
          </div>

          <div class="space-y-1">
            <p class="text-xs font-extrabold text-foreground">{{ event?.title }}</p>
            <p class="text-[11px] text-muted-foreground font-mono">Código: <span class="font-bold text-foreground">{{ event?.uniqueCode }}</span></p>
            <p class="text-[11px] text-muted-foreground">Los invitados pueden escanear este QR para acceder a la vista móvil con OTP y subir fotos 360°.</p>
          </div>

          <div class="space-y-2 pt-2">
            <a
              [href]="guestJoinUrl()"
              target="_blank"
              class="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
            >
              <span>📱 Abrir Vista Mobile Invitados</span>
            </a>

            <button
              type="button"
              (click)="copyLink()"
              class="w-full h-9 rounded-xl border border-border bg-background hover:bg-muted font-extrabold text-xs transition-all active:scale-95 cursor-pointer text-foreground"
            >
              🔗 Copiar Enlace Directo
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EventQrModalComponent {
  private _isOpen = false;
  protected isVisible = signal(false);
  protected isAnimatingIn = signal(false);
  protected isClosing = signal(false);

  @Input() event: EventItem | null = null;

  protected readonly guestJoinUrl = computed(() => {
    const code = this.event?.uniqueCode || '';
    return `${window.location.origin}/guest/event-join?code=${code}`;
  });

  protected readonly qrImageUrl = computed(() => {
    if (this.event?.qrCodeUrl && this.event.qrCodeUrl.startsWith('http')) {
      return this.event.qrCodeUrl;
    }
    const dataUrl = encodeURIComponent(this.guestJoinUrl());
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${dataUrl}`;
  });

  @Input()
  set isOpen(value: boolean) {
    if (value && !this._isOpen) {
      this._isOpen = true;
      this.isVisible.set(true);
      this.isClosing.set(false);
      this.isAnimatingIn.set(true);
    } else if (!value && this._isOpen) {
      this.triggerCloseAnimation();
    }
  }
  get isOpen(): boolean {
    return this._isOpen;
  }

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() copied = new EventEmitter<void>();

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  close(): void {
    if (this.isClosing()) return;
    this.triggerCloseAnimation();
  }

  copyLink(): void {
    if (this.event) {
      navigator.clipboard.writeText(this.guestJoinUrl());
      this.copied.emit();
    }
  }

  private triggerCloseAnimation(): void {
    this.isAnimatingIn.set(false);
    this.isClosing.set(true);
    setTimeout(() => {
      this._isOpen = false;
      this.isVisible.set(false);
      this.isClosing.set(false);
      this.isOpenChange.emit(false);
    }, 260);
  }
}
