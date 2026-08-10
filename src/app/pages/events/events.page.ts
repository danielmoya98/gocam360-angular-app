import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { form, FormField, submit, required, email, min, max } from '@angular/forms/signals';
import { HlmButtonDirective } from '../../ui/button/hlm-button.directive';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../shared/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PrintPhotoItem, PrintQueueModalComponent } from './print-queue-modal.component';
import { EventsService, EventItemResponseDto, CreateEventDto, UpdateEventDto } from './services/events.service';
import { PreferencesService } from '../../shared/services/preferences.service';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [
    FormField,
    HlmButtonDirective,
    HlmInputDirective,
    DrawerComponent,
    ConfirmDialogComponent,
    PrintQueueModalComponent,
    IconComponent,
    DatePipe,
  ],
  template: `
    <div class="h-full flex flex-col min-h-0 space-y-4 overflow-hidden pb-1">
      
      <!-- Standardized Page Title Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold tracking-tight text-foreground">Gestión de Eventos 360°</h2>
          <p class="text-xs text-muted-foreground mt-1">Supervisa transmisiones en directo, captura de invitados, códigos QR de acceso y métricas de impresión instantánea.</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="loadEvents(true)"
            class="px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted font-semibold text-xs transition-all active:scale-95 flex items-center gap-1.5 text-foreground cursor-pointer"
          >
            <app-icon name="refresh" class="w-3.5 h-3.5" [class.animate-spin]="isLoading()" />
            <span>Sincronizar</span>
          </button>
          <button
            type="button"
            (click)="openCreateDrawer()"
            class="px-3 py-1.5 rounded-md bg-foreground text-background font-semibold text-xs shadow-sm hover:opacity-90 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <app-icon name="plus" class="w-3.5 h-3.5" />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      <!-- Top Section: 4 KPI Cards Grid for Events -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        
        <!-- Total Events KPI -->
        <div class="p-3 rounded-lg border border-border/80 bg-card space-y-1 shadow-none hover:border-primary/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <app-icon name="events" class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Total Eventos</span>
            </span>
            <app-icon name="info" class="w-3.5 h-3.5 text-muted-foreground/60" />
          </div>
          <div>
            <span class="text-xl font-extrabold text-foreground tracking-tight font-mono">{{ totalEventsCount() }}</span>
          </div>
          <p class="text-[10px] text-muted-foreground font-medium">Registrados en la plataforma</p>
        </div>

        <!-- Active Events KPI -->
        <div class="p-3 rounded-lg border border-border/80 bg-card space-y-1 shadow-none hover:border-primary/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <app-icon name="camera" class="w-3.5 h-3.5 text-emerald-400" />
              <span>Eventos Activos</span>
            </span>
            <span class="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold flex items-center gap-1">
              <span class="relative flex h-1.5 w-1.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              EN VIVO
            </span>
          </div>
          <div>
            <span class="text-xl font-extrabold text-foreground tracking-tight font-mono">{{ activeEventsCount() }}</span>
          </div>
          <p class="text-[10px] text-emerald-400 font-medium">Capturando fotos 360°</p>
        </div>

        <!-- Total Photos KPI -->
        <div class="p-3 rounded-lg border border-border/80 bg-card space-y-1 shadow-none hover:border-primary/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <app-icon name="camera" class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Fotos Capturadas</span>
            </span>
            <span class="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[9px] font-bold">HD</span>
          </div>
          <div>
            <span class="text-xl font-extrabold text-foreground tracking-tight font-mono">{{ totalPhotosCount() }}</span>
          </div>
          <p class="text-[10px] text-muted-foreground font-medium">Subidas a la galería</p>
        </div>

        <!-- Total Prints KPI -->
        <div class="p-3 rounded-lg border border-border/80 bg-card space-y-1 shadow-none hover:border-primary/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <app-icon name="printer" class="w-3.5 h-3.5 text-amber-500" />
              <span>Impresiones Térmicas</span>
            </span>
            <span class="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-bold">TÉRMICA</span>
          </div>
          <div>
            <span class="text-xl font-extrabold text-foreground tracking-tight font-mono">{{ totalPrintsCount() }}</span>
          </div>
          <p class="text-[10px] text-muted-foreground font-medium">Procesadas e impresas</p>
        </div>

      </div>

      <!-- Toolbar: Search Bar, Status Filter Pills & View Switcher -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <!-- Search Input con ícono alineado perfectamente -->
          <div class="relative flex-1 sm:w-64 flex items-center">
            <app-icon name="search" class="absolute left-2.5 text-muted-foreground w-3.5 h-3.5 pointer-events-none z-10" />
            <input
              type="text"
              hlmInput
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              placeholder="Buscar evento o ubicación..."
              class="h-8 pl-8 pr-3 w-full rounded-md bg-card border border-border text-xs focus:outline-none"
            />
          </div>

          <!-- Status Filter Pills Segmented -->
          <div class="flex items-center bg-muted/40 p-1 rounded-md border border-border/80 text-xs font-bold">
            <button
              (click)="setStatusFilter('ALL')"
              class="px-2.5 py-1 rounded text-xs transition-all cursor-pointer"
              [class.bg-background]="selectedStatusFilter() === 'ALL'"
              [class.text-foreground]="selectedStatusFilter() === 'ALL'"
              [class.shadow-sm]="selectedStatusFilter() === 'ALL'"
              [class.text-muted-foreground]="selectedStatusFilter() !== 'ALL'"
            >
              Todos
            </button>
            <button
              (click)="setStatusFilter('ACTIVE')"
              class="px-2.5 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5"
              [class.bg-background]="selectedStatusFilter() === 'ACTIVE'"
              [class.text-foreground]="selectedStatusFilter() === 'ACTIVE'"
              [class.shadow-sm]="selectedStatusFilter() === 'ACTIVE'"
              [class.text-muted-foreground]="selectedStatusFilter() !== 'ACTIVE'"
            >
              <span>Activos</span>
              <span class="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-[9px] text-emerald-400 font-bold font-mono">{{ activeEventsCount() }}</span>
            </button>
            <button
              (click)="setStatusFilter('FINISHED')"
              class="px-2.5 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5"
              [class.bg-background]="selectedStatusFilter() === 'FINISHED'"
              [class.text-foreground]="selectedStatusFilter() === 'FINISHED'"
              [class.shadow-sm]="selectedStatusFilter() === 'FINISHED'"
              [class.text-muted-foreground]="selectedStatusFilter() !== 'FINISHED'"
            >
              <span>Finalizados</span>
            </button>
          </div>
        </div>

        <!-- View Switcher -->
        <div class="flex items-center gap-2">
          <div class="flex items-center bg-muted/40 p-0.5 rounded-md border border-border">
            <button
              type="button"
              (click)="viewMode.set('cards')"
              class="p-1 rounded text-xs font-bold transition-all cursor-pointer"
              [class.bg-background]="viewMode() === 'cards'"
              [class.shadow-sm]="viewMode() === 'cards'"
              [class.text-foreground]="viewMode() === 'cards'"
              [class.text-muted-foreground]="viewMode() !== 'cards'"
              title="Vista de Tarjetas"
            >
              <app-icon name="grid" class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              (click)="viewMode.set('table')"
              class="p-1 rounded text-xs font-bold transition-all cursor-pointer"
              [class.bg-background]="viewMode() === 'table'"
              [class.shadow-sm]="viewMode() === 'table'"
              [class.text-foreground]="viewMode() === 'table'"
              [class.text-muted-foreground]="viewMode() !== 'table'"
              title="Vista de Tabla"
            >
              <app-icon name="table" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      <!-- MAIN CONTAINER: CARDS / TABLE WITH SKELETON LOADING -->
      @if (isLoading()) {
        <div class="flex-1 rounded-lg border border-border/80 bg-card p-4 space-y-3 animate-pulse">
          <div class="h-8 bg-muted/60 rounded-md w-full"></div>
          <div class="h-20 bg-muted/40 rounded-md w-full"></div>
          <div class="h-20 bg-muted/40 rounded-md w-full"></div>
        </div>
      } @else {
        @if (viewMode() === 'cards') {
          <div class="flex-1 overflow-y-auto pr-1 no-scrollbar">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
              @for (event of paginatedEvents(); track event.id) {
                <div class="rounded-xl border border-border/80 bg-card overflow-hidden shadow-none hover:border-primary/50 transition-all flex flex-col justify-between group">
                  
                  <!-- Gradient Banner con Badge de Estado y QR Fast Button -->
                  <div class="relative h-28 w-full p-3.5 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 flex flex-col justify-between">
                    <div class="flex items-center justify-between z-10">
                      @if (event.status === 'ACTIVE') {
                        <span class="px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-400 text-[10px] font-bold bg-black/60 backdrop-blur-md flex items-center gap-1.5">
                          <span class="relative flex h-1.5 w-1.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          ACTIVO
                        </span>
                      } @else if (event.status === 'FINISHED') {
                        <span class="px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground text-[10px] font-medium bg-black/60 backdrop-blur-md">Finalizado</span>
                      } @else {
                        <span class="px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-400 text-[10px] font-bold bg-black/60 backdrop-blur-md">Borrador</span>
                      }

                      <button
                        (click)="openQrModal(event)"
                        class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer"
                        title="Ver Código QR de Invitados"
                      >
                        <app-icon name="qr" class="w-4 h-4" />
                      </button>
                    </div>

                    <div class="z-10 flex items-baseline justify-between">
                      <span class="font-mono text-[10px] font-bold text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        Código: {{ event.uniqueCode }}
                      </span>
                      <span class="text-[10px] text-slate-300 font-mono">📅 {{ event.date | date:'shortDate' }}</span>
                    </div>
                  </div>

                  <!-- Contenido e Información del Evento -->
                  <div class="p-4 pt-3 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 class="text-sm font-bold text-foreground truncate" [title]="event.title">{{ event.title }}</h3>
                      <p class="text-[11px] text-muted-foreground mt-0.5 truncate">👤 Anfitrión: {{ event.hostName }} • 📍 {{ event.location }}</p>
                    </div>

                    <!-- Métricas de Fotos e Impresiones del Evento -->
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="p-2 rounded-lg bg-muted/40 border border-border/60">
                        <span class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Fotos Capturadas</span>
                        <div class="flex items-center gap-1.5 mt-1">
                          <app-icon name="camera" class="w-3.5 h-3.5 text-primary" />
                          <span class="font-extrabold text-foreground font-mono text-sm">{{ event.totalPhotos }}</span>
                        </div>
                      </div>

                      <div class="p-2 rounded-lg bg-muted/40 border border-border/60">
                        <span class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Impresiones</span>
                        <div class="flex items-center gap-1.5 mt-1">
                          <app-icon name="printer" class="w-3.5 h-3.5 text-amber-500" />
                          <span class="font-extrabold text-foreground font-mono text-sm">{{ event.totalPrints }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Acciones Rápidas del Evento (Solo Menú de 3 Puntos alineado a la derecha) -->
                    <div class="pt-2 border-t border-border/40 flex items-center justify-end">
                      <div class="relative">
                        <button
                          (click)="toggleRowMenu(event.id)"
                          class="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted text-foreground transition-all cursor-pointer flex items-center gap-1"
                          title="Opciones del Evento"
                        >
                          <app-icon name="more" class="w-4 h-4" />
                        </button>

                        <!-- Floating Context Menu para Tarjetas (Con bg-popover-solid opaco y animación smooth) -->
                        @if (activeRowMenuId() === event.id) {
                          <div
                            class="absolute right-0 bottom-full mb-1.5 w-48 bg-popover-solid text-popover-foreground border border-border rounded-xl shadow-2xl p-1 z-[9999] text-left space-y-0.5 animate-dropdown-smooth-right"
                            (click)="$event.stopPropagation()"
                          >
                            <button (click)="openQrModal(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-bold text-emerald-400 cursor-pointer">
                              <app-icon name="qr" class="w-3.5 h-3.5 text-emerald-400" /> Ver Código QR
                            </button>
                            <button (click)="openLiveWall(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-bold text-primary cursor-pointer">
                              <app-icon name="eye" class="w-3.5 h-3.5 text-primary" /> Muro en Vivo
                            </button>
                            <button (click)="goToPrintQueue()" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-bold text-amber-400 cursor-pointer">
                              <app-icon name="printer" class="w-3.5 h-3.5 text-amber-400" /> Cola de Impresión
                            </button>
                            <div class="h-px bg-border/60 my-1"></div>
                            <button (click)="openViewDrawer(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-medium text-foreground cursor-pointer">
                              <app-icon name="eye" class="w-3.5 h-3.5 text-muted-foreground" /> Ver Detalles
                            </button>
                            <button (click)="openEditDrawer(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-medium text-foreground cursor-pointer">
                              <app-icon name="edit" class="w-3.5 h-3.5 text-muted-foreground" /> Editar Evento
                            </button>
                            <button (click)="confirmDelete(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-bold cursor-pointer">
                              <app-icon name="trash" class="w-3.5 h-3.5 text-rose-400" /> Eliminar
                            </button>
                          </div>
                        }
                      </div>
                    </div>

                  </div>

                </div>
              } @empty {
                <div class="col-span-full p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
                  <div class="max-w-xs mx-auto space-y-2">
                    <app-icon name="search" class="w-8 h-8 mx-auto text-muted-foreground" />
                    <h4 class="text-sm font-bold text-foreground">No hay eventos registrados</h4>
                    <p class="text-xs">No se encontraron eventos que coincidan con "{{ searchQuery() }}".</p>
                    <button (click)="clearFilters()" class="mt-2 px-3 py-1 rounded-md border border-border bg-muted hover:bg-card text-xs font-semibold cursor-pointer">Limpiar Filtros</button>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- VISTA TABLA LISTA (100% Sólida sin Transparencias) -->
          <div class="flex-1 rounded-lg border border-border/80 bg-popover-solid shadow-none overflow-hidden flex flex-col justify-between min-h-0 view-mode-container animate-in fade-in duration-300">
            <div class="overflow-x-auto overflow-y-auto flex-1 no-scrollbar bg-popover-solid">
              <table class="w-full text-left text-xs">
                <thead class="bg-popover-solid border-b border-border/60 text-muted-foreground font-semibold sticky top-0 z-20 shadow-xs">
                  <tr>
                    <th class="py-2.5 px-4 bg-popover-solid">Evento & Anfitrión</th>
                    <th class="py-2.5 px-3 bg-popover-solid">Fecha & Hora</th>
                    <th class="py-2.5 px-3 bg-popover-solid">Estado</th>
                    <th class="py-2.5 px-3 bg-popover-solid">Código Acceso</th>
                    <th class="py-2.5 px-3 bg-popover-solid text-center">Métricas</th>
                    <th class="py-2.5 px-4 text-right bg-popover-solid">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/40 font-medium bg-popover-solid">
                  @for (event of paginatedEvents(); track event.id) {
                    <tr class="hover:bg-muted/40 transition-all duration-200 group table-row-smooth animate-in fade-in duration-200">
                      <td class="py-2.5 px-4">
                        <div>
                          <p class="font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{{ event.title }}</p>
                          <span class="text-[11px] text-muted-foreground">👤 {{ event.hostName }} • 📍 {{ event.location }}</span>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {{ event.date | date:'shortDate' }}
                      </td>
                      <td class="py-2.5 px-3">
                        @if (event.status === 'ACTIVE') {
                          <span class="px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 flex items-center gap-1.5 w-fit">
                            <span class="relative flex h-1.5 w-1.5">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            ACTIVO
                          </span>
                        } @else {
                          <span class="px-2 py-0.5 rounded-full border border-border text-muted-foreground text-[10px] font-semibold bg-muted/20">● {{ event.status }}</span>
                        }
                      </td>
                      <td class="py-2.5 px-3">
                        <span class="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                          {{ event.uniqueCode }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-center font-mono">
                        <span class="text-primary font-bold">{{ event.totalPhotos }} fotos</span> • 
                        <span class="text-amber-500 font-bold">{{ event.totalPrints }} imp.</span>
                      </td>
                      <td class="py-2.5 px-4 text-right relative">
                        <button
                          type="button"
                          (click)="toggleRowMenu(event.id)"
                          class="text-muted-foreground hover:text-foreground text-xs p-1 rounded hover:bg-muted cursor-pointer transition-colors"
                        >
                          <app-icon name="more" class="w-4 h-4" />
                        </button>

                        <!-- Context Menu para Filas de Tabla (Mismas opciones completas que la tarjeta) -->
                        @if (activeRowMenuId() === event.id) {
                          <div
                            class="absolute right-3 top-8 w-48 bg-popover-solid text-popover-foreground border border-border rounded-xl shadow-2xl p-1 z-[9999] text-left space-y-0.5 animate-dropdown-smooth-right"
                            (click)="$event.stopPropagation()"
                          >
                            <button (click)="openQrModal(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-bold text-emerald-400 cursor-pointer">
                              <app-icon name="qr" class="w-3.5 h-3.5 text-emerald-400" /> Ver Código QR
                            </button>
                            <button (click)="openLiveWall(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-bold text-primary cursor-pointer">
                              <app-icon name="eye" class="w-3.5 h-3.5 text-primary" /> Muro en Vivo
                            </button>
                            <button (click)="goToPrintQueue()" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-bold text-amber-400 cursor-pointer">
                              <app-icon name="printer" class="w-3.5 h-3.5 text-amber-400" /> Cola de Impresión
                            </button>
                            <div class="h-px bg-border/60 my-1"></div>
                            <button (click)="openViewDrawer(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-medium text-foreground cursor-pointer">
                              <app-icon name="eye" class="w-3.5 h-3.5 text-muted-foreground" /> Ver Detalles
                            </button>
                            <button (click)="openEditDrawer(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs font-medium text-foreground cursor-pointer">
                              <app-icon name="edit" class="w-3.5 h-3.5 text-muted-foreground" /> Editar Evento
                            </button>
                            <button (click)="confirmDelete(event)" class="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-bold cursor-pointer">
                              <app-icon name="trash" class="w-3.5 h-3.5 text-rose-400" /> Eliminar
                            </button>
                          </div>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="p-12 text-center text-muted-foreground">
                        <div class="max-w-xs mx-auto space-y-2">
                          <app-icon name="search" class="w-8 h-8 mx-auto text-muted-foreground" />
                          <h4 class="text-sm font-bold text-foreground">Sin eventos encontrados</h4>
                          <p class="text-xs">No hay eventos que coincidan con la búsqueda.</p>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Footer Paginación -->
            <div class="p-2.5 border-t border-border/60 bg-popover-solid flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground shrink-0">
              <span>Mostrando <b>{{ paginatedEvents().length }}</b> de <b>{{ filteredEvents().length }}</b> eventos</span>
              <div class="flex items-center gap-1">
                <button [disabled]="currentPage() === 1" (click)="currentPage.set(1)" class="px-2 py-0.5 rounded border border-border bg-card text-xs hover:bg-muted font-mono disabled:opacity-30 cursor-pointer">K</button>
                <button [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)" class="px-2 py-0.5 rounded border border-border bg-card text-xs hover:bg-muted font-mono disabled:opacity-30 cursor-pointer">‹</button>
                <button [disabled]="currentPage() >= totalPages()" (click)="currentPage.set(currentPage() + 1)" class="px-2 py-0.5 rounded border border-border bg-card text-xs hover:bg-muted font-mono disabled:opacity-30 cursor-pointer">›</button>
                <button [disabled]="currentPage() >= totalPages()" (click)="currentPage.set(totalPages())" class="px-2 py-0.5 rounded border border-border bg-card text-xs hover:bg-muted font-mono disabled:opacity-30 cursor-pointer">❯</button>
              </div>
            </div>
          </div>
        }
      }

      <!-- CREATE / EDIT EVENT DRAWER CON 3 PESTAÑAS (General, Marcos/Overlays, Plan y Límites) -->
      <app-drawer
        [(isOpen)]="isFormDrawerOpen"
        [title]="drawerMode() === 'create' ? 'Crear Nuevo Evento 360°' : drawerMode() === 'edit' ? 'Editar Evento' : 'Detalles del Evento'"
        [subtitle]="drawerMode() === 'view' ? 'Información del evento y código QR' : 'Configura las reglas de la base de datos PostgreSQL'"
      >
        @if (drawerMode() === 'view' && selectedEvent(); as ev) {
          <div class="space-y-4 text-xs">
            <div class="p-4 rounded-xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white space-y-1">
              <h4 class="text-base font-bold">{{ ev.title }}</h4>
              <p class="text-xs opacity-80">👤 Anfitrión: {{ ev.hostName }}</p>
              <p class="text-xs opacity-80">📍 {{ ev.location }}</p>
            </div>

            <div class="space-y-2 pt-2">
              <div class="flex justify-between py-1 border-b border-border/40"><span class="text-muted-foreground">Código de Acceso</span><span class="font-mono font-bold text-foreground">{{ ev.uniqueCode }}</span></div>
              <div class="flex justify-between py-1 border-b border-border/40"><span class="text-muted-foreground">Fecha del Evento</span><span class="font-mono text-foreground">{{ ev.date | date:'mediumDate' }}</span></div>
              <div class="flex justify-between py-1 border-b border-border/40"><span class="text-muted-foreground">Límites por Invitado</span><span class="font-mono font-bold text-foreground">{{ ev.maxPhotosPerGuest || 10 }} Fotos / {{ ev.maxPrintsPerGuest || 1 }} Imp.</span></div>
              <div class="flex justify-between py-1 border-b border-border/40"><span class="text-muted-foreground">Total Fotografías</span><span class="font-mono font-bold text-primary">{{ ev.totalPhotos }}</span></div>
              <div class="flex justify-between py-1 border-b border-border/40"><span class="text-muted-foreground">Total Impresiones</span><span class="font-mono font-bold text-amber-500">{{ ev.totalPrints }}</span></div>
            </div>

            <button type="button" (click)="openQrModal(ev)" class="w-full h-9 rounded-md bg-foreground text-background font-bold text-xs shadow-sm mt-4 flex items-center justify-center gap-1.5 cursor-pointer">
              <app-icon name="qr" class="w-4 h-4" />
              <span>Ver y Compartir Código QR</span>
            </button>
          </div>
        } @else {
          <div class="flex flex-col h-full space-y-4">
            
            <!-- Sub-Navegación de 3 Pestañas en el Formulario -->
            <div class="flex border-b border-border gap-4 text-xs font-bold shrink-0">
              <button
                type="button"
                (click)="activeDrawerTab.set('general')"
                class="pb-2 transition-all cursor-pointer border-b-2"
                [class.border-primary]="activeDrawerTab() === 'general'"
                [class.text-primary]="activeDrawerTab() === 'general'"
                [class.border-transparent]="activeDrawerTab() !== 'general'"
                [class.text-muted-foreground]="activeDrawerTab() !== 'general'"
              >
                Detalles Generales
              </button>
              <button
                type="button"
                (click)="activeDrawerTab.set('frames')"
                class="pb-2 transition-all cursor-pointer border-b-2"
                [class.border-primary]="activeDrawerTab() === 'frames'"
                [class.text-primary]="activeDrawerTab() === 'frames'"
                [class.border-transparent]="activeDrawerTab() !== 'frames'"
                [class.text-muted-foreground]="activeDrawerTab() !== 'frames'"
              >
                Marcos / Overlays
              </button>
              <button
                type="button"
                (click)="activeDrawerTab.set('limits')"
                class="pb-2 transition-all cursor-pointer border-b-2"
                [class.border-primary]="activeDrawerTab() === 'limits'"
                [class.text-primary]="activeDrawerTab() === 'limits'"
                [class.border-transparent]="activeDrawerTab() !== 'limits'"
                [class.text-muted-foreground]="activeDrawerTab() !== 'limits'"
              >
                Plan y Límites
              </button>
            </div>

            <form (submit)="onFormSubmit(); $event.preventDefault()" class="space-y-4 flex-1 flex flex-col justify-between">
              
              <!-- PESTAÑA 1: DETALLES GENERALES -->
              @if (activeDrawerTab() === 'general') {
                <div class="space-y-3 animate-in fade-in duration-200">
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-foreground">Nombre del Evento *</label>
                    <input type="text" hlmInput [formField]="eventForm.name" placeholder="Ej. Boda Sofía & Carlos 360" class="h-9 rounded-md text-xs" />
                    @if (eventForm.name().touched() && eventForm.name().errors().length) {
                      <p class="text-[10px] text-rose-500 font-medium">{{ eventForm.name().errors()[0].message }}</p>
                    }
                  </div>

                  <div class="space-y-1">
                    <label class="text-xs font-bold text-foreground">Descripción del Evento</label>
                    <textarea hlmInput [formField]="eventForm.description" rows="2" placeholder="Ej. Celebración civil en jardín principal..." class="w-full rounded-md text-xs p-2 bg-card border border-border resize-none"></textarea>
                  </div>

                  <div class="space-y-1">
                    <label class="text-xs font-bold text-foreground">Ubicación / Lugar</label>
                    <input type="text" hlmInput [formField]="eventForm.location" placeholder="Ej. Salón Real Ritz Carlton" class="h-9 rounded-md text-xs" />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div class="space-y-1">
                      <label class="text-xs font-bold text-foreground">Fecha del Evento *</label>
                      <input type="date" hlmInput [formField]="eventForm.eventDate" class="h-9 rounded-md text-xs" />
                    </div>
                    <div class="space-y-1">
                      <label class="text-xs font-bold text-foreground">Hora Inicio / Fin</label>
                      <div class="flex items-center gap-1">
                        <input type="time" hlmInput [formField]="eventForm.startTime" class="h-9 rounded-md text-xs w-1/2" />
                        <input type="time" hlmInput [formField]="eventForm.endTime" class="h-9 rounded-md text-xs w-1/2" />
                      </div>
                    </div>
                  </div>

                  <div class="pt-2 border-t border-border/40 space-y-2">
                    <span class="text-xs font-bold text-foreground block">Datos del Anfitrión</span>
                    <div class="space-y-1">
                      <label class="text-[11px] font-medium text-muted-foreground">Nombre Completo *</label>
                      <input type="text" hlmInput [formField]="eventForm.hostName" placeholder="Ej. Sofía Martínez" class="h-9 rounded-md text-xs" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div class="space-y-1">
                        <label class="text-[11px] font-medium text-muted-foreground">Teléfono Anfitrión</label>
                        <input type="text" hlmInput [formField]="eventForm.hostPhone" placeholder="+52 55 1234 5678" class="h-9 rounded-md text-xs" />
                      </div>
                      <div class="space-y-1">
                        <label class="text-[11px] font-medium text-muted-foreground">Correo Anfitrión</label>
                        <input type="email" hlmInput [formField]="eventForm.hostEmail" placeholder="sofia@gmail.com" class="h-9 rounded-md text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- PESTAÑA 2: MARCOS / OVERLAYS -->
              @if (activeDrawerTab() === 'frames') {
                <div class="space-y-3 animate-in fade-in duration-200">
                  <div class="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/40 transition-colors cursor-pointer group space-y-2">
                    <div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <app-icon name="camera" class="w-5 h-5 text-primary" />
                    </div>
                    <p class="text-xs font-bold text-foreground">Arrastra tus marcos en PNG aquí</p>
                    <p class="text-[10px] text-muted-foreground">Soporta capa de transparencia PNG (Recomendado 1080x1920)</p>
                  </div>
                  
                  <div class="p-3 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground space-y-1">
                    <span class="font-bold text-foreground block">Marcos Predeterminados Disponibles:</span>
                    <div class="flex items-center gap-2 pt-1">
                      <span class="px-2 py-1 rounded bg-card border border-border text-[10px] font-mono text-foreground">Marco Elegante 360 (PNG)</span>
                      <span class="px-2 py-1 rounded bg-card border border-border text-[10px] font-mono text-foreground">Gold Celebration (PNG)</span>
                    </div>
                  </div>
                </div>
              }

              <!-- PESTAÑA 3: PLAN Y LÍMITES -->
              @if (activeDrawerTab() === 'limits') {
                <div class="space-y-3 animate-in fade-in duration-200">
                  <h4 class="text-xs font-bold text-foreground border-b border-border/40 pb-1">Reglas de Monetización & Cuotas Prisma</h4>
                  
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-foreground">Máximo Fotos / Invitado *</label>
                    <input type="number" hlmInput [formField]="eventForm.maxPhotosPerGuest" class="h-9 rounded-md text-xs font-mono" />
                    <p class="text-[10px] text-muted-foreground">Cuántas capturas de fotos 360° puede tomar cada persona.</p>
                  </div>

                  <div class="space-y-1 pt-1">
                    <label class="text-xs font-bold text-foreground">Máximo Impresiones Térmicas *</label>
                    <input type="number" hlmInput [formField]="eventForm.maxPrintsPerGuest" class="h-9 rounded-md text-xs font-mono" />
                    <p class="text-[10px] text-muted-foreground">Cuántas de esas fotos puede mandar a la estación física de impresión.</p>
                  </div>

                  <div class="space-y-1 pt-1">
                    <label class="text-xs font-bold text-foreground">Días de Retención de Galería Cloud</label>
                    <input type="number" hlmInput [formField]="eventForm.galleryRetentionDays" class="h-9 rounded-md text-xs font-mono" />
                    <p class="text-[10px] text-muted-foreground">Días que permanecerán las fotos disponibles para descarga pública por QR.</p>
                  </div>
                </div>
              }

              <div class="pt-4">
                <button type="submit" hlmBtn class="w-full h-9 rounded-md bg-foreground text-background font-bold text-xs shadow-sm cursor-pointer" [disabled]="eventForm().invalid()">
                  {{ drawerMode() === 'create' ? 'Guardar Evento en BD' : 'Actualizar Cambios' }}
                </button>
              </div>
            </form>
          </div>
        }
      </app-drawer>

      <!-- QR CODE MODAL (100% Sólido sin Transparencias y Backdrop Pantalla Completa) -->
      @if (isQrModalOpen() && selectedEvent(); as ev) {
        <div class="fixed inset-0 w-screen h-screen z-[100000] flex items-center justify-center p-4">
          <div class="fixed inset-0 w-full h-full bg-black/70 backdrop-blur-md" (click)="isQrModalOpen.set(false)"></div>
          <div class="relative bg-popover-solid text-popover-foreground border border-border rounded-2xl shadow-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto space-y-4 z-[100001] animate-in zoom-in-95 duration-200 flex flex-col justify-between no-scrollbar">
            <div class="flex items-center justify-between border-b border-border/60 pb-2 shrink-0">
              <h3 class="text-sm font-bold text-foreground">Código QR de Invitados</h3>
              <button (click)="isQrModalOpen.set(false)" class="text-muted-foreground hover:text-foreground cursor-pointer text-xs">✕</button>
            </div>
            
            <div class="text-center space-y-2 flex-1">
              <h4 class="text-sm font-extrabold text-foreground leading-tight">{{ ev.title }}</h4>
              <p class="text-[11px] text-muted-foreground">Pide a tus invitados que escaneen este código o ingresen la clave de acceso:</p>
              
              <div class="p-2.5 bg-white rounded-xl border border-border flex items-center justify-center mx-auto w-40 h-40 my-2 shadow-xs">
                <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + ev.qrToken" alt="QR Evento" class="w-full h-full object-contain" />
              </div>

              <div class="p-2 rounded-lg bg-muted border border-border font-mono text-center">
                <span class="text-[10px] text-muted-foreground block uppercase">Código de Acceso</span>
                <span class="text-sm font-extrabold text-primary tracking-widest">{{ ev.uniqueCode }}</span>
              </div>
            </div>

            <div class="space-y-2 shrink-0 mt-2">
              <button (click)="openGuestViewLocal(ev)" class="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5">
                <span>⚡ Abrir Vista Invitado en Local</span>
              </button>
              
              <button (click)="copyQrLink(ev)" class="w-full py-2 rounded-lg bg-foreground text-background font-bold text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5">
                <app-icon name="qr" class="w-4 h-4" />
                <span>Copiar Enlace de Invitado</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- PRINT QUEUE & PHOTOS MODAL (100% Sólido sin Transparencias) -->
      <app-print-queue-modal
        [(isOpen)]="isPrintQueueModalOpen"
        [eventTitle]="selectedEvent()?.title ?? ''"
        [photos]="mockPrintPhotos()"
        (notifyWhatsApp)="onNotifyWhatsApp($event)"
        (markAsPrinted)="onMarkAsPrinted($event)"
      />

      <!-- CONFIRM DELETE DIALOG -->
      <app-confirm-dialog
        [(isOpen)]="isDeleteConfirmOpen"
        title="¿Eliminar evento?"
        [message]="'¿Estás seguro de que deseas eliminar el evento ' + (selectedEvent()?.title ?? '') + '? Se conservará el respaldo de fotos en el servidor.'"
        (confirmed)="executeDelete()"
      />

    </div>
  `,
})
export class EventsPage implements OnInit {
  private readonly _eventsService = inject(EventsService);
  private readonly _toastService = inject(ToastService);
  private readonly _router = inject(Router);
  private readonly _preferencesService = inject(PreferencesService);

  private readonly initialPref = this._preferencesService.getPageFilter('events');

  protected readonly isLoading = signal(true);
  protected readonly viewMode = signal<'cards' | 'table'>(this.initialPref.viewMode ?? 'cards');
  protected readonly activeRowMenuId = signal<string | null>(null);
  protected readonly activeDrawerTab = signal<'general' | 'frames' | 'limits'>('general');

  protected readonly eventsList = signal<EventItemResponseDto[]>([]);

  protected readonly searchQuery = signal(this.initialPref.searchQuery ?? '');
  protected readonly selectedStatusFilter = signal<string>(this.initialPref.statusFilter ?? 'ALL');

  protected readonly currentPage = signal(1);
  protected readonly pageSize = 6;

  protected readonly isFormDrawerOpen = signal(false);
  protected readonly isQrModalOpen = signal(false);
  protected readonly isPrintQueueModalOpen = signal(false);
  protected readonly isDeleteConfirmOpen = signal(false);
  protected readonly drawerMode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly selectedEvent = signal<EventItemResponseDto | null>(null);

  protected readonly mockPrintPhotos = signal<PrintPhotoItem[]>([
    {
      id: 'ph_1',
      guestName: 'Sofía Martínez',
      guestPhone: '+52 55 9876 5432',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      frameName: 'Marco Gold 360',
      requestedAt: '19:42 PM',
      status: 'Pending',
    },
    {
      id: 'ph_2',
      guestName: 'Carlos Mendoza',
      guestPhone: '+52 55 1234 5678',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      frameName: 'Gocam360 Emerald',
      requestedAt: '19:45 PM',
      status: 'Printed',
    },
  ]);

  protected readonly eventModel = signal({
    name: '',
    description: '',
    hostName: '',
    hostPhone: '',
    hostEmail: '',
    location: '',
    eventDate: new Date().toISOString().substring(0, 10),
    startTime: '18:00',
    endTime: '23:00',
    maxPhotosPerGuest: 10,
    maxPrintsPerGuest: 1,
    galleryRetentionDays: 7,
  });

  protected readonly eventForm = form(this.eventModel, (s) => {
    required(s.name, { message: 'El nombre del evento es obligatorio' });
    required(s.hostName, { message: 'El nombre del anfitrión es obligatorio' });
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(notify = false): void {
    if (this._eventsService.events() && !notify) {
      this.eventsList.set(this._eventsService.events()!);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(true);
    }

    this._eventsService.findAll(notify).subscribe({
      next: (data) => {
        this.eventsList.set(data);
        this.isLoading.set(false);
        if (notify) {
          this._toastService.info('Sincronización Completa', 'Lista de eventos actualizada desde la base de datos');
        }
      },
      error: () => {
        this.isLoading.set(false);
        if (notify) {
          this._toastService.error('Error de Sincronización', 'No se pudieron recuperar los eventos');
        }
      },
    });
  }

  // Métricas calculadas desde los eventos de NestJS
  protected readonly totalEventsCount = computed(() => this.eventsList().length);
  protected readonly activeEventsCount = computed(() => this.eventsList().filter((e) => e.status === 'ACTIVE').length);
  protected readonly totalPhotosCount = computed(() => this.eventsList().reduce((acc, e) => acc + (e.totalPhotos || 0), 0));
  protected readonly totalPrintsCount = computed(() => this.eventsList().reduce((acc, e) => acc + (e.totalPrints || 0), 0));

  protected readonly filteredEvents = computed(() => {
    let list = this.eventsList();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatusFilter();

    if (query) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query) ||
          e.hostName.toLowerCase().includes(query)
      );
    }

    if (status !== 'ALL') {
      list = list.filter((e) => e.status === status);
    }

    return list;
  });

  protected readonly paginatedEvents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredEvents().slice(start, start + this.pageSize);
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredEvents().length / this.pageSize))
  );

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('events', { searchQuery: input.value });
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter.set(status);
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('events', { statusFilter: status });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatusFilter.set('ALL');
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('events', { searchQuery: '', statusFilter: 'ALL' });
  }

  toggleRowMenu(id: string): void {
    this.activeRowMenuId.update((curr) => (curr === id ? null : id));
  }

  goToPrintQueue(ev?: EventItemResponseDto): void {
    if (ev) {
      this.selectedEvent.set(ev);
    }
    this.isPrintQueueModalOpen.set(true);
  }

  onNotifyWhatsApp(photo: PrintPhotoItem): void {
    const message = encodeURIComponent(`¡Hola ${photo.guestName}! Tu foto 360° en ${this.selectedEvent()?.title ?? 'el evento'} está lista. 📸✨`);
    const cleanPhone = photo.guestPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    this._toastService.success('WhatsApp Abierto', `Notificación lista para enviar a ${photo.guestName}`);
  }

  onMarkAsPrinted(photoId: string): void {
    this.mockPrintPhotos.update((photos) =>
      photos.map((p) => (p.id === photoId ? { ...p, status: 'Printed' as const } : p))
    );
    this._toastService.success('Impresión Procesada', 'Se envió la orden de impresión térmica.');
  }

  openLiveWall(ev: EventItemResponseDto): void {
    this.activeRowMenuId.set(null);
    this._router.navigate(['/live-wall', ev.id]);
  }

  openCreateDrawer(): void {
    this.activeDrawerTab.set('general');
    this.eventModel.set({
      name: '',
      description: '',
      hostName: '',
      hostPhone: '',
      hostEmail: '',
      location: '',
      eventDate: new Date().toISOString().substring(0, 10),
      startTime: '18:00',
      endTime: '23:00',
      maxPhotosPerGuest: 10,
      maxPrintsPerGuest: 1,
      galleryRetentionDays: 7,
    });
    this.drawerMode.set('create');
    this.isFormDrawerOpen.set(true);
  }

  openViewDrawer(ev: EventItemResponseDto): void {
    this.selectedEvent.set(ev);
    this.activeRowMenuId.set(null);
    this.drawerMode.set('view');
    this.isFormDrawerOpen.set(true);
  }

  openEditDrawer(ev: EventItemResponseDto): void {
    this.selectedEvent.set(ev);
    this.activeRowMenuId.set(null);
    this.activeDrawerTab.set('general');
    this.eventModel.set({
      name: ev.title,
      description: ev.description || '',
      hostName: ev.hostName,
      hostPhone: ev.hostPhone || '',
      hostEmail: ev.hostEmail || '',
      location: ev.location,
      eventDate: typeof ev.date === 'string' ? ev.date.substring(0, 10) : new Date(ev.date).toISOString().substring(0, 10),
      startTime: '18:00',
      endTime: '23:00',
      maxPhotosPerGuest: ev.maxPhotosPerGuest || 10,
      maxPrintsPerGuest: ev.maxPrintsPerGuest || 1,
      galleryRetentionDays: ev.galleryRetentionDays || 7,
    });
    this.drawerMode.set('edit');
    this.isFormDrawerOpen.set(true);
  }

  openQrModal(ev: EventItemResponseDto): void {
    this.selectedEvent.set(ev);
    this.activeRowMenuId.set(null);
    this.isQrModalOpen.set(true);
  }

  openGuestViewLocal(ev: EventItemResponseDto): void {
    this.isQrModalOpen.set(false);
    this._router.navigate(['/guest/event-join'], {
      queryParams: { code: ev.uniqueCode },
    });
  }

  copyQrLink(ev: EventItemResponseDto): void {
    navigator.clipboard.writeText(`${window.location.origin}/guest/event-join?code=${ev.uniqueCode}`);
    this._toastService.success('Enlace Copiado', 'Link directo del evento copiado al portapapeles');
    this.isQrModalOpen.set(false);
  }

  onFormSubmit(): void {
    submit(this.eventForm, async () => {
      const formVal = this.eventModel();
      const eventDateIso = formVal.eventDate ? new Date(formVal.eventDate).toISOString() : new Date().toISOString();

      if (this.drawerMode() === 'create') {
        const payload: CreateEventDto = {
          name: formVal.name,
          description: formVal.description,
          hostName: formVal.hostName,
          hostPhone: formVal.hostPhone,
          hostEmail: formVal.hostEmail,
          location: formVal.location,
          eventDate: eventDateIso,
          startTime: eventDateIso,
          endTime: eventDateIso,
          maxPhotosPerGuest: Number(formVal.maxPhotosPerGuest),
          maxPrintsPerGuest: Number(formVal.maxPrintsPerGuest),
          galleryRetentionDays: Number(formVal.galleryRetentionDays),
        };

        this._eventsService.create(payload).subscribe({
          next: (newEv) => {
            this.eventsList.update((list) => [newEv, ...list]);
            this._toastService.success('Evento Creado', `Se creó el evento "${newEv.title}".`);
            this.isFormDrawerOpen.set(false);
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo crear el evento';
            this._toastService.error('Error', msg);
          },
        });

      } else if (this.drawerMode() === 'edit' && this.selectedEvent()) {
        const targetId = this.selectedEvent()!.id;
        const payload: UpdateEventDto = {
          name: formVal.name,
          description: formVal.description,
          hostName: formVal.hostName,
          hostPhone: formVal.hostPhone,
          hostEmail: formVal.hostEmail,
          location: formVal.location,
          eventDate: eventDateIso,
          maxPhotosPerGuest: Number(formVal.maxPhotosPerGuest),
          maxPrintsPerGuest: Number(formVal.maxPrintsPerGuest),
          galleryRetentionDays: Number(formVal.galleryRetentionDays),
        };

        this._eventsService.update(targetId, payload).subscribe({
          next: (updatedEv) => {
            this.eventsList.update((list) =>
              list.map((e) => (e.id === targetId ? updatedEv : e))
            );
            this._toastService.info('Evento Actualizado', 'Los cambios se guardaron.');
            this.isFormDrawerOpen.set(false);
          },
          error: () => {
            this._toastService.error('Error', 'No se pudo actualizar el evento');
          },
        });
      }
    });
  }

  confirmDelete(ev: EventItemResponseDto): void {
    this.selectedEvent.set(ev);
    this.activeRowMenuId.set(null);
    this.isDeleteConfirmOpen.set(true);
  }

  executeDelete(): void {
    if (this.selectedEvent()) {
      const id = this.selectedEvent()!.id;
      this._eventsService.remove(id).subscribe({
        next: () => {
          this.eventsList.update((list) => list.filter((e) => e.id !== id));
          this._toastService.error('Evento Eliminado', 'El evento ha sido eliminado.');
        },
        error: () => {
          this._toastService.error('Error', 'No se pudo eliminar el evento.');
        },
      });
    }
  }
}
