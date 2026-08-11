import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../entities/session/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { UserRole } from '../../shared/models/user.model';
import { IconComponent, IconName } from '../../shared/ui/icon/icon.component';

interface NavGroup {
  category: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: IconName;
  route: string;
  roles: UserRole[];
  hasChevron?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  host: {
    class: 'block shrink-0 relative z-20 h-screen select-none',
  },
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.widget.html',
  styleUrl: './sidebar.widget.css',
})
export class SidebarWidget {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  protected readonly user = this._authService.currentUser;
  protected readonly userRole = this._authService.userRole;
  protected readonly showUserMenu = signal(false);

  toggleUserMenu(): void {
    this.showUserMenu.update((v) => !v);
  }

  navigateTo(path: string): void {
    this.showUserMenu.set(false);
    this._router.navigate([path]);
  }

  onRoleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this._authService.switchRole(select.value as UserRole);
  }

  navGroups(): NavGroup[] {
    const role = this.userRole();
    return [
      {
        category: 'Aplicación',
        items: [
          {
            label: 'Dashboard',
            icon: 'dashboard',
            route: '/dashboard',
            roles: ['SUPERADMIN', 'ADMIN'],
            hasChevron: true,
          },
          ...(role === 'SUPERADMIN'
            ? [
              {
                label: 'Usuarios',
                icon: 'users' as IconName,
                route: '/dashboard/users',
                roles: ['SUPERADMIN' as UserRole],
                hasChevron: false,
              },
              {
                label: 'Auditoría',
                icon: 'info' as IconName,
                route: '/dashboard/audit-logs',
                roles: ['SUPERADMIN' as UserRole],
                hasChevron: false,
              },
            ]
            : []),
          {
            label: 'Eventos',
            icon: 'events',
            route: '/dashboard/events',
            roles: ['SUPERADMIN', 'ADMIN'],
            hasChevron: false,
          },
          {
            label: 'Impresiones',
            icon: 'prints',
            route: '/dashboard/prints',
            roles: ['SUPERADMIN', 'ADMIN'],
            hasChevron: false,
          },
          {
            label: 'CRM',
            icon: 'users',
            route: '/dashboard/crm-leads',
            roles: ['SUPERADMIN', 'ADMIN'],
            hasChevron: false,
          },
        ],
      },
      {
        category: 'Otros',
        items: [
          {
            label: 'Configuración',
            icon: 'settings',
            route: '/dashboard/settings',
            roles: ['SUPERADMIN', 'ADMIN'],
          },
        ],
      },
    ];
  }

  logout(): void {
    this._authService.logout().subscribe({
      next: () => this._router.navigate(['/login']),
      error: () => this._router.navigate(['/login']),
    });
  }
}
