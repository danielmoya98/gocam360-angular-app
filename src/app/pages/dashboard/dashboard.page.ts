import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../entities/session/auth.service';
import { TopbarWidget } from '../../widgets/topbar/topbar.widget';
import { SidebarWidget } from '../../widgets/sidebar/sidebar.widget';
import { SuperadminViewComponent, TransactionMock } from './superadmin-view/superadmin-view.component';
import { AdminViewComponent } from './admin-view/admin-view.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { CommandPaletteComponent } from '../../shared/ui/command-palette/command-palette.component';
import { PreferencesService } from '../../shared/services/preferences.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    TopbarWidget,
    SidebarWidget,
    SuperadminViewComponent,
    AdminViewComponent,
    DrawerComponent,
    CommandPaletteComponent,
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

    </div>
  `,
})
export class DashboardPage {
  private readonly _authService = inject(AuthService);
  private readonly _preferencesService = inject(PreferencesService);
  private readonly _router = inject(Router);

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
  protected readonly selectedTransaction = signal<TransactionMock | null>(null);

  protected readonly isCommandPaletteOpen = signal(false);

  toggleSidebar(): void {
    this._preferencesService.toggleSidebar();
  }

  openTransactionDrawer(tx: TransactionMock): void {
    this.selectedTransaction.set(tx);
    this.isDrawerOpen.set(true);
  }
}
