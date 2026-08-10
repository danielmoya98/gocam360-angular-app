import { Component, EventEmitter, HostListener, Input, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';

interface CommandItem {
  icon: IconName;
  label: string;
  category: string;
  route: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [IconComponent],
  host: {
    class: 'block',
  },
  template: `
    @if (isOpen) {
      <!-- Fixed Fullscreen Backdrop Overlay -->
      <div
        class="fixed inset-0 bg-black/70 backdrop-blur-md z-[100000] flex items-start justify-center pt-24 p-4 animate-in fade-in duration-200"
        (click)="close()"
      >
        <!-- Modal Palette Container (100% Solid Opacity Background) -->
        <div
          class="w-full max-w-lg bg-popover-solid text-popover-foreground border border-border rounded-2xl shadow-2xl overflow-hidden animate-smooth-modal relative z-[100001]"
          (click)="$event.stopPropagation()"
        >
          <!-- Search Input Bar -->
          <div class="p-4 border-b border-border/60 flex items-center gap-3 bg-popover-solid">
            <app-icon name="search" class="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              [value]="searchQuery()"
              (input)="onSearch($event)"
              placeholder="Buscar comandos, páginas o módulos... (Esc para salir)"
              class="w-full bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground font-semibold"
              autoFocus
            />
            <kbd class="px-2 py-0.5 text-[10px] font-mono font-bold bg-muted text-muted-foreground rounded border border-border shrink-0">ESC</kbd>
          </div>

          <!-- Command List -->
          <div class="max-h-80 overflow-y-auto p-2 space-y-1 bg-popover-solid no-scrollbar">
            @for (item of filteredCommands(); track item.label) {
              <button
                type="button"
                (click)="executeCommand(item.route)"
                class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-all group text-left cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <app-icon [name]="item.icon" class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  <span>{{ item.label }}</span>
                </div>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider group-hover:bg-background group-hover:text-foreground border border-border/50">
                  {{ item.category }}
                </span>
              </button>
            } @empty {
              <div class="p-8 text-center text-xs text-muted-foreground space-y-1">
                <app-icon name="search" class="w-6 h-6 mx-auto text-muted-foreground/60" />
                <p class="font-bold text-foreground">No se encontraron resultados</p>
                <p class="text-[11px]">No hay comandos que coincidan con "{{ searchQuery() }}"</p>
              </div>
            }
          </div>

          <!-- Modal Footer Hint -->
          <div class="px-4 py-2 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
            <span>Presiona <kbd class="px-1 py-0.2 rounded bg-background border border-border text-foreground font-mono">↵</kbd> para seleccionar</span>
            <span>gocam360 Enterprise</span>
          </div>

        </div>
      </div>
    }
  `,
})
export class CommandPaletteComponent {
  private readonly _router = inject(Router);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  protected readonly searchQuery = signal('');

  private readonly _commands: CommandItem[] = [
    { icon: 'dashboard', label: 'Ir al Dashboard', category: 'Navegación', route: '/dashboard' },
    { icon: 'users', label: 'Gestionar Usuarios', category: 'SUPERADMIN', route: '/dashboard/users' },
    { icon: 'events', label: 'Ver Eventos 360° Activos', category: 'Módulos', route: '/dashboard/events' },
    { icon: 'prints', label: 'Impresiones & Galerías', category: 'Módulos', route: '/dashboard/prints' },
    { icon: 'shield', label: 'Perfil de Usuario', category: 'Cuenta', route: '/dashboard/profile' },
    { icon: 'settings', label: 'Configuración del Sistema', category: 'Ajustes', route: '/dashboard/settings' },
  ];

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  executeCommand(route: string): void {
    this.close();
    this._router.navigate([route]);
  }

  filteredCommands(): CommandItem[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this._commands;
    return this._commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }
}
