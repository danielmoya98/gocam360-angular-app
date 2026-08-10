import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'gocam360_theme';
  readonly theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Escucha cambios en el signal de tema y sincroniza con <html> y localStorage
    effect(() => {
      const currentTheme = this.theme();
      const root = document.documentElement;

      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      try {
        localStorage.setItem(this.STORAGE_KEY, currentTheme);
      } catch {
        // Ignora errores en entornos restringidos de lectura/escritura
      }
    });
  }

  toggleTheme(): void {
    const changeTheme = () => {
      this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
    };

    // Usar View Transitions API nativa si está disponible en el navegador
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.documentElement.classList.add('theme-transition-active');
      const transition = (document as any).startViewTransition(() => {
        changeTheme();
      });
      transition.finished.then(() => {
        document.documentElement.classList.remove('theme-transition-active');
      });
    } else {
      changeTheme();
    }
  }

  private getInitialTheme(): Theme {
    try {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      // Preferencia del sistema si no hay preferencia guardada
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback por defecto
    }
    return 'light';
  }
}
