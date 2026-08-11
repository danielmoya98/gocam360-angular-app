import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './shared/guards/auth.guard';
import { setupGuard, rootEntryGuard } from './shared/guards/setup.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [rootEntryGuard],
    children: [],
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash-loader/splash-loader.component').then((m) => m.SplashLoaderComponent),
  },
  {
    path: 'setup',
    canActivate: [setupGuard],
    loadComponent: () => import('./pages/setup/setup.page').then((m) => m.SetupPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'guest/event-join',
    loadComponent: () => import('./pages/guest/guest-event-join.page').then((m) => m.GuestEventJoinPage),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
    children: [
      {
        path: 'users',
        canActivate: [roleGuard(['SUPERADMIN'])],
        loadComponent: () => import('./pages/users/users.page').then((m) => m.UsersPage),
      },
      {
        path: 'events',
        canActivate: [roleGuard(['SUPERADMIN', 'ADMIN'])],
        loadComponent: () => import('./pages/events/events.page').then((m) => m.EventsPage),
      },
      {
        path: 'prints',
        canActivate: [roleGuard(['SUPERADMIN', 'ADMIN'])],
        loadComponent: () => import('./pages/prints/prints.page').then((m) => m.PrintsPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'audit-logs',
        canActivate: [roleGuard(['SUPERADMIN'])],
        loadComponent: () => import('./pages/audit-logs/audit-logs.page').then((m) => m.AuditLogsPage),
      },
      {
        path: 'crm-leads',
        canActivate: [roleGuard(['SUPERADMIN', 'ADMIN'])],
        loadComponent: () => import('./pages/crm-leads/crm-leads.page').then((m) => m.CrmLeadsPage),
      },
      {
        path: 'help-support',
        loadComponent: () => import('./pages/help-support/help-support.page').then((m) => m.HelpSupportPage),
      },
    ],
  },
  {
    path: 'live-wall/:id',
    loadComponent: () => import('./pages/live-wall/live-wall.page').then((m) => m.LiveWallPage),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
