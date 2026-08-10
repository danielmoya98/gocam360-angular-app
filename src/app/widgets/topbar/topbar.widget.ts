import { Component, EventEmitter, Input, Output, inject, signal, computed, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../../shared/services/theme.service';
import { NotificationsService, NotificationItemDto } from '../../shared/services/notifications.service';
import { AuthService } from '../../entities/session/auth.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

export interface BreadcrumbSegment {
  label: string;
  path: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  host: {
    class: 'block w-full shrink-0 relative z-10',
  },
  imports: [RouterLink, IconComponent, DatePipe],
  template: `
    <header class="h-14 border-b border-border/80 bg-card px-4 flex items-center justify-between shrink-0">
      
      <!-- Left: Toggle Sidebar & Dynamic Breadcrumbs Navigation -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="toggleSidebar.emit()"
          class="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Alternar Menú"
        >
          <app-icon name="dashboard" class="w-4 h-4" />
        </button>

        <div class="h-4 w-px bg-border/60"></div>

        <!-- Breadcrumbs Navigation -->
        <nav class="flex items-center gap-1.5 text-xs font-semibold">
          @for (crumb of breadcrumbs(); track crumb.path; let isLast = $last) {
            @if (isLast) {
              <span class="text-foreground font-bold px-1.5 py-0.5 rounded bg-muted/40">
                {{ crumb.label }}
              </span>
            } @else {
              <a
                [routerLink]="crumb.path"
                class="text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded hover:bg-muted/50 flex items-center gap-1 cursor-pointer"
              >
                @if (crumb.path === '/dashboard') {
                  <app-icon name="dashboard" class="w-3.5 h-3.5" />
                }
                <span>{{ crumb.label }}</span>
              </a>
              <app-icon name="chevron-right" class="w-3 h-3 text-muted-foreground/50 shrink-0" />
            }
          }
        </nav>
      </div>

      <!-- Right: Global Search, Quick Commands, Theme Switcher & Notifications -->
      <div class="flex items-center gap-2.5">
        
        <!-- Cmd + K Search Trigger -->
        <button
          type="button"
          (click)="openCommandPalette.emit()"
          class="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm group"
        >
          <div class="flex items-center gap-1.5">
            <app-icon name="search" class="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
            <span>Buscar...</span>
          </div>
          <kbd class="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono font-bold text-muted-foreground group-hover:text-foreground shadow-xs">
            ⌘K
          </kbd>
        </button>

        <!-- Toggle Theme (Dark / Light) -->
        <button
          type="button"
          (click)="themeService.toggleTheme()"
          class="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative"
          title="Cambiar Tema"
        >
          @if (themeService.theme() === 'dark') {
            <app-icon name="sun" class="w-4 h-4 text-amber-400" />
          } @else {
            <app-icon name="moon" class="w-4 h-4 text-zinc-700" />
          }
        </button>

        <!-- Notifications Bell with Dropdown Menu (Conectado con NotificationsService) -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleNotifications()"
            class="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative"
            title="Notificaciones en Tiempo Real"
          >
            <app-icon name="bell" class="w-4 h-4" />
            @if (unreadCount() > 0) {
              <span class="absolute top-1 right-1 flex h-3.5 w-3.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 text-[9px] font-bold text-white items-center justify-center font-mono">
                  {{ unreadCount() }}
                </span>
              </span>
            }
          </button>

          <!-- Notifications Dropdown Popover (100% Sólido bg-popover-solid sin Transparencias) -->
          @if (showNotifications()) {
            <div
              class="absolute right-0 top-full mt-2 w-80 bg-popover-solid text-popover-foreground border border-border rounded-xl shadow-2xl p-2 z-[9999] space-y-2 animate-smooth-popover text-xs"
              (click)="$event.stopPropagation()"
            >
              <div class="flex items-center justify-between px-2.5 py-1.5 border-b border-border/60 bg-popover-solid rounded-t-xl">
                <div class="flex items-center gap-1.5">
                  <span class="font-extrabold text-foreground">Notificaciones</span>
                  <span class="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[9px] font-mono font-bold">
                    {{ userRole() === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN' }}
                  </span>
                </div>
                <button
                  type="button"
                  (click)="markAllAsRead()"
                  class="text-[10px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                >
                  Marcar leídas
                </button>
              </div>

              <div class="space-y-1 max-h-64 overflow-y-auto no-scrollbar bg-popover-solid">
                @for (n of notifications(); track n.id) {
                  <div
                    (click)="onNotificationClick(n)"
                    class="p-2.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors flex items-start justify-between gap-2 cursor-pointer group"
                    [class.bg-muted/30]="!n.read"
                  >
                    <div class="space-y-0.5 min-w-0">
                      <p class="font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">{{ n.title }}</p>
                      <p class="text-[11px] text-muted-foreground leading-snug">{{ n.message }}</p>
                      <span class="text-[9px] text-muted-foreground/70 font-mono block pt-0.5">
                        {{ n.createdAt | date:'shortTime' }}
                      </span>
                    </div>
                    @if (!n.read) {
                      <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1"></span>
                    }
                  </div>
                } @empty {
                  <div class="p-6 text-center text-muted-foreground text-xs bg-muted/10 rounded-lg">
                    Sin notificaciones pendientes.
                  </div>
                }
              </div>
            </div>
          }
        </div>

      </div>

    </header>
  `,
})
export class TopbarWidget implements OnInit {
  private readonly _router = inject(Router);
  private readonly _notificationsService = inject(NotificationsService);
  private readonly _authService = inject(AuthService);

  protected readonly themeService = inject(ThemeService);

  @Input() isSidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openCommandPalette = new EventEmitter<void>();

  protected readonly showNotifications = signal(false);
  protected readonly breadcrumbs = signal<BreadcrumbSegment[]>([]);

  protected readonly notifications = this._notificationsService.notifications;
  protected readonly userRole = this._authService.userRole;

  protected readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length
  );

  constructor() {
    this.updateBreadcrumbs(this._router.url);

    this._router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateBreadcrumbs(event.urlAfterRedirects || event.url);
      });
  }

  ngOnInit(): void {
    this._notificationsService.loadMyNotifications().subscribe();
  }

  private updateBreadcrumbs(url: string): void {
    const segments: BreadcrumbSegment[] = [{ label: 'Inicio', path: '/dashboard' }];

    if (url.includes('/users')) {
      segments.push({ label: 'Usuarios', path: '/dashboard/users' });
    } else if (url.includes('/events')) {
      segments.push({ label: 'Eventos 360°', path: '/dashboard/events' });
    } else if (url.includes('/prints')) {
      segments.push({ label: 'Impresiones', path: '/dashboard/prints' });
    } else if (url.includes('/crm-leads')) {
      segments.push({ label: 'CRM Prospectos', path: '/dashboard/crm-leads' });
    } else if (url.includes('/audit-logs')) {
      segments.push({ label: 'Bitácora de Auditoría', path: '/dashboard/audit-logs' });
    } else if (url.includes('/profile')) {
      segments.push({ label: 'Perfil', path: '/dashboard/profile' });
    } else if (url.includes('/help-support')) {
      segments.push({ label: 'Ayuda & Soporte', path: '/dashboard/help-support' });
    } else if (url.includes('/settings')) {
      segments.push({ label: 'Configuración', path: '/dashboard/settings' });
    } else {
      segments.push({ label: 'Resumen Ejecutivo', path: '/dashboard' });
    }

    this.breadcrumbs.set(segments);
  }

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
  }

  markAllAsRead(): void {
    this._notificationsService.markAllAsRead().subscribe();
  }

  onNotificationClick(item: NotificationItemDto): void {
    if (!item.read) {
      this._notificationsService.markAsRead(item.id).subscribe();
    }
    if (item.linkUrl) {
      this.showNotifications.set(false);
      this._router.navigate([item.linkUrl]);
    }
  }
}
