import { Component } from '@angular/core';
import { HlmBadgeComponent } from '../../../shared/ui/badge/hlm-badge.component';

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [HlmBadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- User Header Banner -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span hlmBadge variant="outline" class="mb-2">Rol: DEVELOPER / USER</span>
          <h3 class="text-xl font-bold tracking-tight">Mi Espacio de Trabajo & Tareas</h3>
          <p class="text-xs text-muted-foreground">Bienvenido a tu panel personal de entregables y actividades activas.</p>
        </div>
        <button class="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg shadow-sm hover:bg-primary/90 transition-all">
          + Crear Nueva Tarea
        </button>
      </div>

      <!-- Quick Tasks List -->
      <div class="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
        <h4 class="text-sm font-bold">Tareas Asignadas Pendientes</h4>
        <div class="space-y-3">
          <div class="p-4 rounded-lg border border-border/70 bg-muted/30 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <input type="checkbox" class="rounded border-border" />
              <div>
                <p class="text-xs font-semibold text-foreground">Implementar Signal Forms en módulo de Auth</p>
                <span class="text-[10px] text-muted-foreground">Vence: Hoy a las 18:00</span>
              </div>
            </div>
            <span hlmBadge variant="destructive">Alta Prioridad</span>
          </div>

          <div class="p-4 rounded-lg border border-border/70 bg-muted/30 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <input type="checkbox" class="rounded border-border" />
              <div>
                <p class="text-xs font-semibold text-foreground">Actualizar tema CSS a Tailwind v4 variables</p>
                <span class="text-[10px] text-muted-foreground">Vence: Mañana</span>
              </div>
            </div>
            <span hlmBadge variant="secondary">Media</span>
          </div>

          <div class="p-4 rounded-lg border border-border/70 bg-muted/30 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <input type="checkbox" class="rounded border-border" checked />
              <div>
                <p class="text-xs font-semibold text-muted-foreground line-through">Revisar documentación de Spartan UI</p>
                <span class="text-[10px] text-emerald-500 font-semibold">Completado</span>
              </div>
            </div>
            <span hlmBadge variant="success">Finalizada</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserViewComponent {}
