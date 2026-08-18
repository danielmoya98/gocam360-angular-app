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
        class="fixed inset-0 w-screen h-screen bg-black/75 backdrop-blur-md z-[250000] flex items-center justify-center p-3 sm:p-4 transition-opacity duration-300 ease-out"
        [class.animate-in]="isAnimatingIn()"
        [class.fade-in]="isAnimatingIn()"
        [class.animate-out]="isClosing()"
        [class.fade-out]="isClosing()"
        (click)="close()"
      >
        <!-- Modal Container (Responsivo Instagram Grid: Crece horizontalmente en pantallas grandes) -->
        <div
          class="w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl bg-popover-solid text-popover-foreground border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-[250001] transition-all duration-300"
          [class.animate-dialog-in]="isAnimatingIn()"
          [class.animate-dialog-out]="isClosing()"
          (click)="$event.stopPropagation()"
        >
          <!-- Header del Modal -->
          <div class="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between bg-popover-solid sticky top-0 z-10 shadow-xs">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-black tracking-tight text-foreground">Cola de Impresiones & Feed 360°</h3>
                <span hlmBadge variant="success" class="font-mono text-xs font-bold">🖨️ {{ eventTitle }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">Gestión visual e impresión instantánea de capturas por evento.</p>
            </div>
            <button
              type="button"
              (click)="close()"
              class="w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <!-- Tab Bar (Filtros de Estado) -->
          <div class="p-3 bg-muted/20 border-b border-border/60 flex items-center justify-between gap-2 shrink-0 text-xs overflow-x-auto no-scrollbar">
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="activeTab.set('All')"
                class="px-3.5 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-2 cursor-pointer"
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
                class="px-3.5 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-2 cursor-pointer"
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
                class="px-3.5 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-2 cursor-pointer"
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
              Total: <span class="font-bold text-foreground">{{ displayedPhotos().length }}</span> publicaciones
            </p>
          </div>

          <!-- Content Body: Instagram Feed Post Cards (Grid Responsivo de 1 col en móvil pequeño, 2 en móvil, 3 en tablet, 4 en desktop) -->
          <div class="p-4 sm:p-5 overflow-y-auto flex-1 bg-popover-solid no-scrollbar min-h-[350px]">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              @for (photo of displayedPhotos(); track photo.id) {
                <!-- Instagram Post Card Component -->
                <div class="rounded-2xl border border-border/80 bg-card hover:bg-card/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
                  
                  <!-- Card Header: Avatar Invitado + Nombre + Badge -->
                  <div class="p-3 border-b border-border/40 flex items-center justify-between gap-2 bg-muted/20">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-xs">
                        {{ getInitials(photo.guestName) }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-black text-foreground truncate leading-tight">{{ photo.guestName }}</p>
                        <p class="text-[10px] text-muted-foreground font-mono truncate">📱 {{ photo.guestPhone || 'Sin cel' }}</p>
                      </div>
                    </div>

                    <div class="shrink-0">
                      @if (photo.status === 'Pending') {
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono border border-amber-500/40 bg-amber-500/10 text-amber-400">
                          PENDIENTE
                        </span>
                      } @else {
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                          IMPRESO
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Card Media: Cuadro de Foto con Proporción Cuadrada -->
                  <div class="aspect-square relative overflow-hidden bg-slate-950 cursor-pointer" (click)="openPreviewModal(photo.photoUrl)">
                    <img
                      [src]="photo.photoUrl"
                      [alt]="photo.guestName"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <!-- Botones Flotantes de Acción en Hover (Ver HD & WhatsApp) -->
                    <div class="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        (click)="$event.stopPropagation(); openPreviewModal(photo.photoUrl)"
                        class="w-8 h-8 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/20 shadow-md"
                        title="Ver HD"
                      >
                        <app-icon name="eye" class="w-4 h-4" />
                      </button>
                      @if (photo.guestPhone) {
                        <button
                          type="button"
                          (click)="$event.stopPropagation(); notifyWhatsApp.emit(photo)"
                          class="w-8 h-8 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-emerald-400/30 shadow-md"
                          title="WhatsApp"
                        >
                          💬
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Card Footer: Metadatos del Marco + BOTÓN IMPRIMIR ULTRA DESTACADO -->
                  <div class="p-3 space-y-2.5 bg-card border-t border-border/40 flex-1 flex flex-col justify-between">
                    <div class="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span class="truncate">🖼️ {{ photo.frameName || 'Sin Marco' }}</span>
                      @if (photo.requestedAt) {
                        <span class="shrink-0 font-semibold">🕒 {{ photo.requestedAt }}</span>
                      }
                    </div>

                    <!-- 🚀 BOTÓN DE IMPRESIÓN IMPOSIBLE DE IGNORAR (Dorado / Ámbar Brillante) -->
                    @if (photo.status === 'Pending') {
                      <button
                        type="button"
                        (click)="markAsPrinted.emit(photo.id)"
                        class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider border border-amber-300/40"
                      >
                        <app-icon name="printer" class="w-4 h-4 text-slate-950" />
                        <span>🖨️ IMPRIMIR FOTO</span>
                      </button>
                    } @else {
                      <div class="w-full py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center gap-1.5 font-mono">
                        <span>✓ IMPRESO EN PAPEL</span>
                      </div>
                    }
                  </div>

                </div>
              } @empty {
                <div class="col-span-full py-16 text-center text-muted-foreground space-y-3">
                  <app-icon name="printer" class="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h4 class="text-sm font-extrabold text-foreground">No hay capturas registradas</h4>
                  <p class="text-xs max-w-xs mx-auto">Las fotos tomadas por los invitados aparecerán en esta galería instantáneamente.</p>
                </div>
              }
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-3.5 border-t border-border/80 bg-popover-solid flex items-center justify-between shrink-0">
            <span class="text-xs text-muted-foreground font-mono">Total: {{ photos.length }} fotografías</span>
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

  getInitials(name: string): string {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
