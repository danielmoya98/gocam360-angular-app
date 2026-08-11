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
  templateUrl: './topbar.widget.html',
  styleUrl: './topbar.widget.css',
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
