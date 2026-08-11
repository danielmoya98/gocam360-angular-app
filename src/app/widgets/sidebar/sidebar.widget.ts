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
  template: `
    <aside
      class="relative flex flex-col justify-between h-screen sticky top-0 transition-all duration-300 ease-in-out shadow-xl"
      [class.w-60]="!isCollapsed"
      [class.w-16]="isCollapsed"
    >
      <!-- Capa de fondo aislada (Solidez 100% opaca) -->
      <div class="absolute inset-0 bg-card border-r border-border/80 z-[-1]"></div>

      <!-- Top Content: Brand Header & Categorized Nav Groups -->
      <div class="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-80px)] no-scrollbar z-10">
        
        <!-- Brand Header -->
        <div class="flex items-center gap-3 px-1 pt-1">
          <div class="w-9 h-9 shrink-0 rounded-xl bg-foreground text-background font-black text-xl flex items-center justify-center border border-border shadow-sm tracking-tighter">
            <app-icon name="dashboard" class="w-5 h-5" />
          </div>
          @if (!isCollapsed) {
            <div class="animate-in fade-in duration-200 overflow-hidden">
              <h1 class="text-sm font-extrabold tracking-tight leading-none text-foreground">gocam360</h1>
              <span class="text-[10px] text-muted-foreground font-semibold">Enterprise</span>
            </div>
          }
        </div>

        <!-- Navigation Groups -->
        @for (group of navGroups(); track group.category) {
          <div class="space-y-1">
            @if (!isCollapsed) {
              <div class="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/70 animate-in fade-in duration-150">
                {{ group.category }}
              </div>
            }

            <div class="space-y-0.5">
              @for (item of group.items; track item.route) {
                <a
                  [routerLink]="item.route"
                  #rla="routerLinkActive"
                  routerLinkActive="text-foreground font-extrabold"
                  [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                  class="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 group relative z-10"
                  [title]="isCollapsed ? item.label : ''"
                >
                  <!-- Indicador de Píldora Activa que se desplaza suavemente (View Transition name: active-nav-pill) -->
                  @if (rla.isActive) {
                    <div
                      class="absolute inset-0 bg-secondary border border-border/80 rounded-lg z-[-1] shadow-xs [view-transition-name:active-nav-pill]"
                    ></div>
                  }

                  <div class="flex items-center gap-3 min-w-0">
                    <app-icon [name]="item.icon" class="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" [class.text-primary]="rla.isActive" />
                    @if (!isCollapsed) {
                      <span class="animate-in fade-in duration-150 truncate" [class.text-foreground]="rla.isActive">{{ item.label }}</span>
                    }
                  </div>

                  @if (!isCollapsed && item.hasChevron) {
                    <app-icon name="chevron-right" class="w-3 h-3 text-muted-foreground/60" />
                  }
                </a>
              }
            </div>
          </div>
        }

      </div>

      <!-- Footer: User Profile Trigger -->
      <div class="p-2 border-t border-border/80 bg-card relative z-10">
        <div class="relative w-full"> 
          <button
            type="button"
            (click)="toggleUserMenu()"
            class="w-full flex items-center justify-between p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted/60 transition-all cursor-pointer shadow-sm relative z-10"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              @if (user(); as u) {
                <img
                  [src]="u.avatar"
                  [alt]="u.name"
                  class="w-7 h-7 rounded-full object-cover ring-1 ring-border shrink-0"
                />
                @if (!isCollapsed) {
                  <div class="text-left truncate">
                    <p class="text-xs font-bold text-foreground leading-tight truncate">{{ u.name }}</p>
                    <span class="text-[10px] text-muted-foreground font-mono truncate block">{{ u.email }}</span>
                  </div>
                }
              }
            </div>

            @if (!isCollapsed) {
              <app-icon name="chevron-down" class="w-3.5 h-3.5 text-muted-foreground/70" />
            }
          </button>

          <!-- Menú Flotante de Usuario (100% Sólido y Opaco sin transparencia) -->
          @if (showUserMenu()) {
            <div
              class="absolute left-0 bottom-[calc(100%+8px)] w-64 bg-popover-solid text-popover-foreground border border-border rounded-xl shadow-2xl p-1.5 space-y-1 z-[99999] animate-in fade-in zoom-in-95 duration-150 text-xs font-medium"
              (click)="$event.stopPropagation()"
            >
              <!-- Header User Info -->
              <div class="p-2.5 border-b border-border/60 flex items-center gap-2.5 bg-popover-solid rounded-t-xl">
                @if (user(); as u) {
                  <img [src]="u.avatar" [alt]="u.name" class="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                  <div>
                    <p class="font-bold text-foreground text-xs leading-tight">{{ u.name }}</p>
                    <span class="text-[10px] text-muted-foreground font-mono block">{{ u.email }}</span>
                  </div>
                }
              </div>

              <!-- Menu Items (Solo Cuenta, Ayuda & Soporte y Cerrar Sesión) -->
              <div class="p-1 space-y-0.5 bg-popover-solid">
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors font-medium text-foreground cursor-pointer"
                  (click)="navigateTo('/dashboard/profile')"
                >
                  <app-icon name="shield" class="w-4 h-4 text-muted-foreground" />
                  <span>Cuenta</span>
                </button>
              </div>

              <div class="border-t border-border/60 pt-1 space-y-0.5 bg-popover-solid rounded-b-xl">
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                  (click)="navigateTo('/dashboard/help-support')"
                >
                  <app-icon name="help" class="w-4 h-4 text-muted-foreground" />
                  <span>Ayuda & Soporte</span>
                </button>

                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-rose-400 hover:bg-rose-500/10 text-left transition-colors font-bold"
                  (click)="logout()"
                >
                  <app-icon name="logout" class="w-4 h-4 text-rose-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>

            </div>
          }
        </div>
      </div>
    </aside>
  `,
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
                  label: 'Bitácora / Auditoría',
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
            label: 'Leads CRM',
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
