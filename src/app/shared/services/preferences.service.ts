import { Injectable, signal } from '@angular/core';

export interface TableState {
  searchQuery?: string;
  statusFilter?: string;
  viewMode?: 'cards' | 'table';
  visibleColumns?: string[];
  currentPage?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  private readonly SIDEBAR_KEY = 'gocam360_sidebar_collapsed';
  private readonly PREFIX_TABLE = 'gocam360_filter_';
  private readonly PREFIX_SESSION = 'gocam360_session_filter_';

  // State del Sidebar
  readonly isSidebarCollapsed = signal<boolean>(this.getInitialSidebarState());

  constructor() {}

  /**
   * Alterna y guarda el estado de colapso del Sidebar en localStorage
   */
  toggleSidebar(): void {
    const newState = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(newState);
    try {
      localStorage.setItem(this.SIDEBAR_KEY, JSON.stringify(newState));
    } catch {}
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
    try {
      localStorage.setItem(this.SIDEBAR_KEY, JSON.stringify(collapsed));
    } catch {}
  }

  private getInitialSidebarState(): boolean {
    try {
      const saved = localStorage.getItem(this.SIDEBAR_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {}
    return false;
  }

  /**
   * Persiste la configuración de filtros de una vista/página en localStorage
   */
  savePageFilter(pageKey: string, state: TableState): void {
    try {
      const current = this.getPageFilter(pageKey);
      const updated = { ...current, ...state };
      localStorage.setItem(`${this.PREFIX_TABLE}${pageKey}`, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Obtiene la configuración de filtros guardada para una vista en localStorage
   */
  getPageFilter(pageKey: string): TableState {
    try {
      const saved = localStorage.getItem(`${this.PREFIX_TABLE}${pageKey}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {};
  }

  /**
   * Persiste estados temporales de sesión en sessionStorage
   */
  saveSessionState(key: string, data: any): void {
    try {
      sessionStorage.setItem(`${this.PREFIX_SESSION}${key}`, JSON.stringify(data));
    } catch {}
  }

  getSessionState<T>(key: string, defaultValue: T): T {
    try {
      const saved = sessionStorage.getItem(`${this.PREFIX_SESSION}${key}`);
      if (saved !== null) {
        return JSON.parse(saved) as T;
      }
    } catch {}
    return defaultValue;
  }
}
