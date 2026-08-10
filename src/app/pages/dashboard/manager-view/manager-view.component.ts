import { Component } from '@angular/core';
import { HlmBadgeComponent } from '../../../shared/ui/badge/hlm-badge.component';

@Component({
  selector: 'app-manager-view',
  standalone: true,
  imports: [HlmBadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Manager Header Banner -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span hlmBadge variant="secondary" class="mb-2">Rol: TEAM MANAGER</span>
          <h3 class="text-xl font-bold tracking-tight">Rendimiento de Equipos & Sprints</h3>
          <p class="text-xs text-muted-foreground">Monitoreo de entregables de producto, capacidad y velocidad del equipo.</p>
        </div>
        <button class="px-4 py-2 bg-secondary text-secondary-foreground font-semibold text-xs rounded-lg shadow-sm hover:bg-secondary/80 transition-all">
          Asignar Nuevo Proyecto 🚀
        </button>
      </div>

      <!-- KPI Metrics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span class="text-xs text-muted-foreground font-semibold">Sprint Actual</span>
          <p class="text-2xl font-black">Sprint #42</p>
          <span class="text-[11px] text-emerald-500 font-semibold">84% de historias completadas</span>
        </div>

        <div class="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span class="text-xs text-muted-foreground font-semibold">Velocidad Promedio</span>
          <p class="text-2xl font-black">52 Pts / semana</p>
          <span class="text-[11px] text-blue-500 font-semibold">▲ High Performing</span>
        </div>

        <div class="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span class="text-xs text-muted-foreground font-semibold">Desarrolladores Activos</span>
          <p class="text-2xl font-black">14 Miembros</p>
          <span class="text-[11px] text-muted-foreground font-semibold">0 ausencias hoy</span>
        </div>
      </div>

      <!-- Projects Grid Mock -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-5 rounded-xl border border-border bg-card space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold">Frontend Migration (Angular 22)</h4>
            <span hlmBadge variant="success">En Proceso</span>
          </div>
          <p class="text-xs text-muted-foreground">Migración completa a Signals y Signal Forms para optimizar performance.</p>
          <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div class="bg-primary h-2 rounded-full w-3/4"></div>
          </div>
          <span class="text-[10px] text-muted-foreground font-semibold block text-right">75% Completado</span>
        </div>

        <div class="p-5 rounded-xl border border-border bg-card space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold">AI Autocomplete Integration</h4>
            <span hlmBadge variant="secondary">Reviewing</span>
          </div>
          <p class="text-xs text-muted-foreground">Integración de LLM en el flujo de creación de tareas del usuario.</p>
          <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div class="bg-blue-500 h-2 rounded-full w-1/2"></div>
          </div>
          <span class="text-[10px] text-muted-foreground font-semibold block text-right">50% Completado</span>
        </div>
      </div>
    </div>
  `,
})
export class ManagerViewComponent { }
