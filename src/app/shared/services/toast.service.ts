import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  isClosing?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private _audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this._audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this._audioCtx = new AudioCtxClass();
      }
    }
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      this._audioCtx.resume();
    }
    return this._audioCtx;
  }

  /**
   * Genera un efecto de sonido sintético limpio (Chime / Pop / Error) mediante Web Audio API
   */
  playSound(type: ToastType): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // Tono Chime doble armónico (Éxito / Confirmación)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'error') {
        // Tono grave disonante (Error / Cancelación)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.setValueAtTime(180, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Pop suave (Info / Notificación)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05); // A5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      // Ignorar restricciones de autoplay si la página aún no interactuó
    }
  }

  show(title: string, message?: string, type: ToastType = 'success'): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, isClosing: false };
    
    this.toasts.update((items) => [...items, toast]);
    this.playSound(type);

    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  success(title: string, message?: string): void {
    this.show(title, message, 'success');
  }

  error(title: string, message?: string): void {
    this.show(title, message, 'error');
  }

  info(title: string, message?: string): void {
    this.show(title, message, 'info');
  }

  remove(id: string): void {
    // Marcar como cerrando para desencadenar la animación de salida suave en CSS
    this.toasts.update((items) =>
      items.map((t) => (t.id === id ? { ...t, isClosing: true } : t))
    );

    // Remover del arreglo después de que concluya la animación de 260ms
    setTimeout(() => {
      this.toasts.update((items) => items.filter((t) => t.id !== id));
    }, 260);
  }
}
