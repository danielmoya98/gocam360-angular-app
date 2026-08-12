import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../entities/session/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { TopbarWidget } from '../../widgets/topbar/topbar.widget';
import { SidebarWidget } from '../../widgets/sidebar/sidebar.widget';
import { SuperadminViewComponent, TransactionMock } from './superadmin-view/superadmin-view.component';
import { AdminViewComponent } from './admin-view/admin-view.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { CommandPaletteComponent } from '../../shared/ui/command-palette/command-palette.component';
import { IconComponent, IconName } from '../../shared/ui/icon/icon.component';
import { PreferencesService } from '../../shared/services/preferences.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TopbarWidget,
    SidebarWidget,
    SuperadminViewComponent,
    AdminViewComponent,
    DrawerComponent,
    CommandPaletteComponent,
    IconComponent,
  ],
  template: `
    <div class="h-screen w-screen flex bg-background text-foreground overflow-hidden">
      
      <!-- Sidebar Navigation -->
      <app-sidebar [isCollapsed]="isSidebarCollapsed()" (toggleCollapse)="toggleSidebar()" />

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        <!-- Topbar Header with Breadcrumbs & Sidebar Toggle -->
        <app-topbar
          [isSidebarCollapsed]="isSidebarCollapsed()"
          (toggleSidebar)="toggleSidebar()"
          (toggleMobileDrawer)="isMobileNavOpen.set(true)"
          (openCommandPalette)="isCommandPaletteOpen.set(true)"
        />

        <!-- Main Body (Allows mouse scroll, hides scrollbar visually) -->
        <main class="flex-1 p-5 md:p-6 overflow-y-auto no-scrollbar">
          <router-outlet />
          
          <!-- Default Dashboard Views when at /dashboard base path -->
          @if (isRootDashboardRoute()) {
            @switch (userRole()) {
              @case ('SUPERADMIN') {
                <app-superadmin-view (selectTransaction)="openTransactionDrawer($event)" />
              }
              @case ('ADMIN') {
                <app-admin-view />
              }
            }
          }
        </main>
      </div>

      <!-- Slide-Over Drawer for Event Details -->
      <app-drawer
        [(isOpen)]="isDrawerOpen"
        title="Detalles del Evento 360°"
        subtitle="Métricas operacionales y registro de impresiones"
      >
        @if (selectedTransaction(); as tx) {
          <div class="space-y-6 text-xs">
            
            <!-- Amount & Status Header -->
            <div class="space-y-3 pb-4 border-b border-border/80">
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground font-semibold">Métrica de Evento</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20">ACTIVO</span>
              </div>
              <div>
                <span class="text-muted-foreground font-semibold">Cliente / Organizador</span>
                <p class="text-2xl font-black text-foreground mt-0.5">{{ tx.customerName }}</p>
              </div>
            </div>

            <!-- Event Data Grid -->
            <div class="space-y-2.5">
              <div class="flex justify-between">
                <span class="text-muted-foreground font-medium">Código de Evento</span>
                <span class="font-bold font-mono text-foreground">{{ tx.customerId }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground font-medium">Tipo de Experiencia</span>
                <span class="font-bold text-primary">{{ tx.type }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground font-medium">Formato de Impresión</span>
                <span class="font-bold text-amber-500 font-mono">Térmica 10x15</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground font-medium">Fecha de Transmisión</span>
                <span class="font-bold text-foreground font-mono">{{ tx.date }}</span>
              </div>
            </div>

            <!-- Location & Host Information Section -->
            <div class="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <h4 class="font-bold text-foreground text-xs">Ubicación & Logística</h4>
              <div class="space-y-1 text-muted-foreground">
                <div class="flex justify-between"><span class="font-medium">Dirección / Recinto</span><span class="text-foreground font-semibold">{{ tx.streetAddress }}</span></div>
                <div class="flex justify-between"><span class="font-medium">Ciudad</span><span class="text-foreground font-semibold">{{ tx.city }}</span></div>
                <div class="flex justify-between"><span class="font-medium">Estado / Región</span><span class="text-foreground font-semibold">{{ tx.state }}</span></div>
                <div class="flex justify-between"><span class="font-medium">Teléfono Operador</span><span class="text-foreground font-mono font-semibold">{{ tx.mobileNumber }}</span></div>
              </div>
            </div>

          </div>
        }
      </app-drawer>

      <!-- Command Palette Modal (Cmd + K) -->
      <app-command-palette [(isOpen)]="isCommandPaletteOpen" />

      <!-- Mobile Navigation Drawer (Right-to-Left Slide Over Sheet) -->
      <app-drawer
        [(isOpen)]="isMobileNavOpen"
        title="Navegación & Menú Móvil"
        subtitle="gocam360 Enterprise Platform"
      >
        <div class="h-full flex flex-col justify-between space-y-6 pt-1">
          <!-- User Profile Card Header -->
          @if (user(); as u) {
            <div class="p-3.5 rounded-xl border border-border bg-card flex items-center gap-3 shadow-xs">
              <img [src]="u.avatar" [alt]="u.name" class="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="font-extrabold text-foreground text-sm leading-tight truncate">{{ u.name }}</p>
                <span class="text-[11px] text-muted-foreground font-mono truncate block">{{ u.email }}</span>
                <span class="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-extrabold font-mono uppercase bg-primary/10 text-primary border border-primary/20">
                  {{ u.role }}
                </span>
              </div>
            </div>
          }

          <!-- Categorized Nav Items List -->
          <div class="space-y-4 flex-1 overflow-y-auto no-scrollbar">
            @for (group of navGroups(); track group.category) {
              <div class="space-y-1.5">
                <h4 class="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/70 px-1">
                  {{ group.category }}
                </h4>
                <div class="space-y-1">
                  @for (item of group.items; track item.route) {
                    <a
                      [routerLink]="item.route"
                      routerLinkActive="bg-primary/10 text-primary font-bold border-primary/30"
                      [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                      (click)="isMobileNavOpen.set(false)"
                      class="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/50 text-foreground transition-all duration-150 text-xs font-semibold cursor-pointer active:scale-[0.99]"
                    >
                      <div class="flex items-center gap-3">
                        <app-icon [name]="item.icon" class="w-4 h-4 shrink-0" />
                        <span>{{ item.label }}</span>
                      </div>
                      <app-icon name="chevron-right" class="w-3.5 h-3.5 text-muted-foreground/50" />
                    </a>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Actions Footer -->
          <div class="pt-3 border-t border-border/60 space-y-2">
            <button
              type="button"
              (click)="themeService.toggleTheme()"
              class="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 text-xs font-bold text-foreground cursor-pointer"
            >
              <div class="flex items-center gap-2">
                @if (themeService.theme() === 'dark') {
                  <app-icon name="sun" class="w-4 h-4 text-amber-400" />
                  <span>Modo Claro</span>
                } @else {
                  <app-icon name="moon" class="w-4 h-4 text-zinc-700" />
                  <span>Modo Oscuro</span>
                }
              </div>
              <span class="text-[10px] text-muted-foreground uppercase font-mono">{{ themeService.theme() }}</span>
            </button>

            <button
              type="button"
              (click)="logout()"
              class="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs cursor-pointer active:scale-[0.99]"
            >
              <app-icon name="logout" class="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </app-drawer>

    </div>
  `,
})
export class DashboardPage {
  private readonly _authService = inject(AuthService);
  private readonly _preferencesService = inject(PreferencesService);
  private readonly _router = inject(Router);

  protected readonly themeService = inject(ThemeService);
  protected readonly user = this._authService.currentUser;

  protected readonly currentUrl = toSignal(
    this._router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects || e.url)
    ),
    { initialValue: this._router.url }
  );

  protected readonly isRootDashboardRoute = computed(() => {
    const url = this.currentUrl();
    return url === '/dashboard' || url === '/dashboard/';
  });

  protected readonly userRole = this._authService.userRole;
  protected readonly isSidebarCollapsed = this._preferencesService.isSidebarCollapsed;

  protected readonly isDrawerOpen = signal(false);
  protected readonly isMobileNavOpen = signal(false);
  protected readonly selectedTransaction = signal<TransactionMock | null>(null);

  protected readonly isCommandPaletteOpen = signal(false);

  protected readonly navGroups = computed(() => {
    const role = this.userRole();
    return [
      {
        category: 'Aplicación',
        items: [
          { label: 'Dashboard', icon: 'dashboard' as IconName, route: '/dashboard' },
          ...(role === 'SUPERADMIN'
            ? [
                { label: 'Usuarios', icon: 'users' as IconName, route: '/dashboard/users' },
                { label: 'Bitácora / Auditoría', icon: 'info' as IconName, route: '/dashboard/audit-logs' },
              ]
            : []),
          { label: 'Eventos', icon: 'events' as IconName, route: '/dashboard/events' },
          { label: 'Impresiones', icon: 'prints' as IconName, route: '/dashboard/prints' },
          { label: 'CRM Leads', icon: 'users' as IconName, route: '/dashboard/crm-leads' },
        ],
      },
      {
        category: 'Otros',
        items: [
          { label: 'Mi Perfil', icon: 'crown' as IconName, route: '/dashboard/profile' },
          { label: 'Ayuda & Soporte', icon: 'help' as IconName, route: '/dashboard/help-support' },
          { label: 'Configuración', icon: 'settings' as IconName, route: '/dashboard/settings' },
        ],
      },
    ];
  });

  toggleSidebar(): void {
    this._preferencesService.toggleSidebar();
  }

  openTransactionDrawer(tx: TransactionMock): void {
    this.selectedTransaction.set(tx);
    this.isDrawerOpen.set(true);
  }

  logout(): void {
    this.isMobileNavOpen.set(false);
    this._authService.logout().subscribe({
      next: () => this._router.navigate(['/login']),
      error: () => this._router.navigate(['/login']),
    });
  }
}
