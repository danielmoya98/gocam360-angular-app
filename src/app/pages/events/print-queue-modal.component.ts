import { Component, EventEmitter, Input, Output, signal, HostListener } from '@angular/core';
import { HlmBadgeComponent } from '../../shared/ui/badge/hlm-badge.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

export interface PrintPhotoItem {
  id: string;
  guestName: string;
  guestPhone: string;
  photoUrl: string;
  frameName: string;
  requestedAt: string;
  status: 'Pending' | 'Printed';
}

@Component({
  selector: 'app-print-queue-modal',
  standalone: true,
  imports: [HlmBadgeComponent, IconComponent],
  host: {
    class: 'contents',
  },
  template: `
    @if (isVisible()) {
      <!-- Fixed Fullscreen Backdrop con Blur Completo de Pantalla (z-[250000]) -->
      <div
        class="fixed inset-0 w-screen h-screen bg-black/75 backdrop-blur-md z-[250000] flex items-center justify-center p-4 transition-opacity duration-300 ease-out"
        [class.animate-in]="isAnimatingIn()"
        [class.fade-in]="isAnimatingIn()"
        [class.animate-out]="isClosing()"
        [class.fade-out]="isClosing()"
        (click)="close()"
      >
        <!-- Modal Container (100% Sólido Opaco bg-popover-solid con animación suave smooth-dialog-in) -->
        <div
          class="w-full max-w-2xl bg-popover-solid text-popover-foreground border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[250001]"
          [class.animate-dialog-in]="isAnimatingIn()"
          [class.animate-dialog-out]="isClosing()"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="p-5 border-b border-border/80 flex items-center justify-between bg-popover-solid sticky top-0 z-10 shadow-xs">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-extrabold tracking-tight text-foreground">Cola de Impresiones & Fotos del Evento</h3>
                <span hlmBadge variant="success" class="font-mono text-xs">🖨️ {{ eventTitle }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">Capturas registradas y cola de impresiones térmicas enviadas por invitados.</p>
            </div>
            <button
              type="button"
              (click)="close()"
              class="w-7 h-7 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          <!-- Tabs (Pendientes vs Impresas) -->
          <div class="p-3 bg-muted/20 border-b border-border/60 flex gap-2 shrink-0 text-xs">
            <button
              type="button"
              (click)="activeTab.set('Pending')"
              class="px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer"
              [class.bg-foreground]="activeTab() === 'Pending'"
              [class.text-background]="activeTab() === 'Pending'"
              [class.shadow-sm]="activeTab() === 'Pending'"
              [class.text-muted-foreground]="activeTab() !== 'Pending'"
            >
              <span>⏳ Pendientes</span>
              <span class="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">{{ pendingPhotos().length }}</span>
            </button>
            <button
              type="button"
              (click)="activeTab.set('Printed')"
              class="px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer"
              [class.bg-foreground]="activeTab() === 'Printed'"
              [class.text-background]="activeTab() === 'Printed'"
              [class.shadow-sm]="activeTab() === 'Printed'"
              [class.text-muted-foreground]="activeTab() !== 'Printed'"
            >
              <span>✅ Impresas</span>
              <span class="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">{{ printedPhotos().length }}</span>
            </button>
          </div>

          <!-- Content Body -->
          <div class="p-4 overflow-y-auto space-y-3 flex-1 bg-popover-solid no-scrollbar">
            @for (photo of displayedPhotos(); track photo.id) {
              <div class="p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-4 group">
                <div class="flex items-center gap-3 min-w-0">
                  <img [src]="photo.photoUrl" [alt]="photo.guestName" class="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
                  <div class="min-w-0 space-y-0.5">
                    <p class="text-xs font-extrabold text-foreground truncate">{{ photo.guestName }}</p>
                    <p class="text-[10px] text-muted-foreground font-mono">📱 {{ photo.guestPhone }}</p>
                    <div class="flex items-center gap-2 pt-0.5">
                      <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary font-semibold border border-primary/20">Marco: {{ photo.frameName }}</span>
                      <span class="text-[9px] text-muted-foreground font-mono">🕒 {{ photo.requestedAt }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    (click)="previewPhoto.emit(photo)"
                    class="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Previsualizar"
                  >
                    <app-icon name="eye" class="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    (click)="notifyWhatsApp.emit(photo)"
                    class="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Notificar por WhatsApp"
                  >
                    💬
                  </button>

                  @if (photo.status === 'Pending') {
                    <button
                      type="button"
                      (click)="markAsPrinted.emit(photo.id)"
                      class="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <app-icon name="printer" class="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>
                  } @else {
                    <span class="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">Impreso</span>
                  }
                </div>
              </div>
            } @empty {
              <div class="p-8 text-center text-muted-foreground space-y-2">
                <app-icon name="printer" class="w-8 h-8 mx-auto text-muted-foreground/60" />
                <p class="text-xs font-medium">No hay fotos en esta sección</p>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="p-3.5 border-t border-border/80 bg-popover-solid flex justify-end shrink-0">
            <button
              type="button"
              (click)="close()"
              class="px-4 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors cursor-pointer text-foreground"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class PrintQueueModalComponent {
  private _isOpen = false;
  protected isVisible = signal(false);
  protected isAnimatingIn = signal(false);
  protected isClosing = signal(false);

  @Input() eventTitle = '';
  @Input() photos: PrintPhotoItem[] = [];

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
  @Output() previewPhoto = new EventEmitter<PrintPhotoItem>();
  @Output() notifyWhatsApp = new EventEmitter<PrintPhotoItem>();
  @Output() markAsPrinted = new EventEmitter<string>();

  protected readonly activeTab = signal<'Pending' | 'Printed'>('Pending');

  pendingPhotos(): PrintPhotoItem[] {
    return this.photos.filter((p) => p.status === 'Pending');
  }

  printedPhotos(): PrintPhotoItem[] {
    return this.photos.filter((p) => p.status === 'Printed');
  }

  displayedPhotos(): PrintPhotoItem[] {
    return this.activeTab() === 'Pending' ? this.pendingPhotos() : this.printedPhotos();
  }

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
