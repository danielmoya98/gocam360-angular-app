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
        <!-- Modal Container (Responsivo: Crece horizontalmente según resolución) -->
        <div
          class="w-full max-w-4xl lg:max-w-6xl bg-popover-solid text-popover-foreground border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-[250001] transition-all duration-300"
          [class.animate-dialog-in]="isAnimatingIn()"
          [class.animate-dialog-out]="isClosing()"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between bg-popover-solid sticky top-0 z-10 shadow-xs">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-extrabold tracking-tight text-foreground">Cola de Impresiones & Galerías 360°</h3>
                <span hlmBadge variant="success" class="font-mono text-xs">🖨️ {{ eventTitle }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">Feed de fotografías capturadas en vivo y solicitudes de impresión térmica.</p>
            </div>
            <button
              type="button"
              (click)="close()"
              class="w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <!-- Tabs (Todas vs Pendientes vs Impresas) -->
          <div class="p-3 bg-muted/20 border-b border-border/60 flex items-center justify-between gap-2 shrink-0 text-xs overflow-x-auto no-scrollbar">
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="activeTab.set('All')"
                class="px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
                [class.bg-foreground]="activeTab() === 'All'"
                [class.text-background]="activeTab() === 'All'"
                [class.shadow-sm]="activeTab() === 'All'"
                [class.text-muted-foreground]="activeTab() !== 'All'"
              >
                <span>🖼️ Todas</span>
                <span class="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-mono font-bold">{{ photos.length }}</span>
              </button>

              <button
                type="button"
                (click)="activeTab.set('Pending')"
                class="px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
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
                class="px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
                [class.bg-foreground]="activeTab() === 'Printed'"
                [class.text-background]="activeTab() === 'Printed'"
                [class.shadow-sm]="activeTab() === 'Printed'"
                [class.text-muted-foreground]="activeTab() !== 'Printed'"
              >
                <span>✅ Impresas</span>
                <span class="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">{{ printedPhotos().length }}</span>
              </button>
            </div>

            <p class="text-[11px] text-muted-foreground font-mono hidden sm:block">
              Mostrando <span class="font-bold text-foreground">{{ displayedPhotos().length }}</span> fotografías
            </p>
          </div>

          <!-- Content Body: Grid Instagram Feed (2 cols en móvil, 3 en tablet, 4-5 en desktop) -->
          <div class="p-4 sm:p-5 overflow-y-auto flex-1 bg-popover-solid no-scrollbar min-h-[300px]">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              @for (photo of displayedPhotos(); track photo.id) {
                <!-- Instagram Card Item -->
                <div class="aspect-square rounded-2xl overflow-hidden relative group border border-border/80 bg-slate-950 shadow-md transition-all duration-300 hover:shadow-2xl hover:border-primary/50">
                  <img
                    [src]="photo.photoUrl"
                    [alt]="photo.guestName"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                    (click)="openPreviewModal(photo.photoUrl)"
                  />

                  <!-- Top Status Badge Always Visible -->
                  <div class="absolute top-2 left-2 z-10">
                    @if (photo.status === 'Pending') {
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono border border-amber-500/40 bg-amber-500/20 text-amber-300 backdrop-blur-md shadow-xs">
                        ⏳ PENDIENTE
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 backdrop-blur-md shadow-xs">
                        ✓ IMPRESO
                      </span>
                    }
                  </div>

                  <!-- Hover Instagram Overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20 opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 flex flex-col justify-between z-20">
                    
                    <!-- Top Action Bar -->
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        (click)="openPreviewModal(photo.photoUrl)"
                        class="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                        title="Ver HD"
                      >
                        <app-icon name="eye" class="w-4 h-4" />
                      </button>
                      @if (photo.guestPhone) {
                        <button
                          type="button"
                          (click)="notifyWhatsApp.emit(photo)"
                          class="w-8 h-8 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-300 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                          title="WhatsApp"
                        >
                          💬
                        </button>
                      }
                    </div>

                    <!-- Bottom Info & Action -->
                    <div class="space-y-1.5">
                      <div>
                        <p class="text-xs font-black text-white truncate drop-shadow-md leading-tight">{{ photo.guestName }}</p>
                        <p class="text-[10px] text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                          @if (photo.requestedAt) {
                            <span>🕒 {{ photo.requestedAt }}</span>
                          }
                          <span class="truncate">• {{ photo.frameName }}</span>
                        </p>
                      </div>

                      @if (photo.status === 'Pending') {
                        <button
                          type="button"
                          (click)="markAsPrinted.emit(photo.id)"
                          class="w-full py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-extrabold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-white/20"
                        >
                          <app-icon name="printer" class="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                      }
                    </div>

                  </div>
                </div>
              } @empty {
                <div class="col-span-full py-16 text-center text-muted-foreground space-y-3">
                  <app-icon name="printer" class="w-10 h-10 mx-auto text-muted-foreground/60" />
                  <h4 class="text-sm font-bold text-foreground">No hay fotos en esta sección</h4>
                  <p class="text-xs max-w-xs mx-auto">Las fotografías tomadas por los invitados aparecerán aquí automáticamente.</p>
                </div>
              }
            </div>
          </div>

          <!-- Footer -->
          <div class="p-3.5 border-t border-border/80 bg-popover-solid flex items-center justify-between shrink-0">
            <span class="text-xs text-muted-foreground font-mono">Total: {{ photos.length }} capturas</span>
            <button
              type="button"
              (click)="close()"
              class="px-5 py-1.5 text-xs font-bold rounded-xl border border-border bg-background hover:bg-muted transition-colors cursor-pointer text-foreground shadow-xs"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>

      <!-- FULLSCREEN PREVIEW MODAL HD -->
      @if (previewState().isOpen) {
        <div class="fixed inset-0 w-screen h-screen z-[300000] flex items-center justify-center p-4">
          <div class="fixed inset-0 w-full h-full bg-black/80 backdrop-blur-md" (click)="closePreviewModal()"></div>
          <div class="relative bg-slate-950 text-white border border-white/15 rounded-3xl shadow-2xl p-4 w-full max-w-xl z-[300001] animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 class="text-sm font-bold">Vista Previa HD</h4>
              <button (click)="closePreviewModal()" class="text-white/70 hover:text-white cursor-pointer text-xs font-bold">✕</button>
            </div>
            <div class="my-3 rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img [src]="previewState().url" alt="Preview Foto HD" class="w-full h-full object-contain" />
            </div>
            <div class="flex justify-end">
              <button (click)="closePreviewModal()" class="px-4 py-1.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class PrintQueueModalComponent {
  private _isOpen = false;
  protected isVisible = signal(false);
  protected isAnimatingIn = signal(false);
  protected isClosing = signal(false);

  protected previewState = signal<{ isOpen: boolean; url: string }>({
    isOpen: false,
    url: '',
  });

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

  protected readonly activeTab = signal<'All' | 'Pending' | 'Printed'>('All');

  pendingPhotos(): PrintPhotoItem[] {
    return this.photos.filter((p) => p.status === 'Pending');
  }

  printedPhotos(): PrintPhotoItem[] {
    return this.photos.filter((p) => p.status === 'Printed');
  }

  displayedPhotos(): PrintPhotoItem[] {
    if (this.activeTab() === 'Pending') return this.pendingPhotos();
    if (this.activeTab() === 'Printed') return this.printedPhotos();
    return this.photos;
  }

  openPreviewModal(url: string): void {
    this.previewState.set({ isOpen: true, url });
  }

  closePreviewModal(): void {
    this.previewState.set({ isOpen: false, url: '' });
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.previewState().isOpen) {
      this.closePreviewModal();
    } else if (this.isOpen) {
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
