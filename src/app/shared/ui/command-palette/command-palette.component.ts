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
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
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
