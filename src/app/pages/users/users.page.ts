import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { form, FormField, submit, required, email } from '@angular/forms/signals';
import { UserRole } from '../../shared/models/user.model';
import { HlmButtonDirective } from '../../ui/button/hlm-button.directive';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../shared/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { UsersService, AdminUserResponseDto, CreateAdminDto, UpdateAdminDto } from './services/users.service';
import { PreferencesService } from '../../shared/services/preferences.service';

export interface ColumnVisibility {
  admin: boolean;
  email: boolean;
  role: boolean;
  status: boolean;
  lastLogin: boolean;
  createdAt: boolean;
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    FormField,
    HlmButtonDirective,
    HlmInputDirective,
    DrawerComponent,
    ConfirmDialogComponent,
    IconComponent,
    DatePipe,
  ],
  template: `
    <div class="h-full flex flex-col min-h-0 space-y-4 overflow-hidden pb-1">
      
      <!-- Standardized Page Title Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold tracking-tight text-foreground">Gestión de Administradores</h2>
          <p class="text-xs text-muted-foreground mt-1">Administra cuentas del equipo, contraseñas, roles de acceso y estado activo/inactivo de administradores gocam360.</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="loadAdmins(true)"
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
            <app-icon name="user-plus" class="w-3.5 h-3.5" />
            <span>Nuevo Administrador</span>
          </button>
        </div>
      </div>

      <!-- Top Section: 4 KPI Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        
        <!-- Total Admins KPI -->
        <div class="p-3.5 rounded-lg border border-border/80 bg-card space-y-1 shadow-none hover:border-primary/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <app-icon name="users" class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Administradores Totales</span>
            </span>
            <app-icon name="info" class="w-3.5 h-3.5 text-muted-foreground/60" />
          </div>
          <div>
            <span class="text-2xl font-extrabold text-foreground tracking-tight font-mono">{{ totalAdminsCount() }}</span>
          </div>
          <p class="text-[10px] text-muted-foreground font-medium">Registrados en la plataforma</p>
        </div>

        <!-- Active Admins KPI -->
        <div class="p-3.5 rounded-lg border border-border/80 bg-card space-y-1 shadow-none hover:border-primary/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <app-icon name="shield" class="w-3.5 h-3.5 text-emerald-500" />
              <span>Cuentas Activas</span>
            </span>
            <span class="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">Activo</span>
          </div>
          <div>
            <span class="text-2xl font-extrabold text-foreground tracking-tight font-mono">{{ activeAdminsCount() }}</span>
          </div>
          <p class="text-[10px] text-emerald-500 font-medium">Operativos con acceso al backend</p>
        </div>

        <!-- Inactive Admins KPI -->
        <div class="p-3.5 rounded-lg border border-border/80 bg-card space-y-1 shadow-none hover:border-primary/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <app-icon name="shield" class="w-3.5 h-3.5 text-rose-500" />
              <span>Cuentas Inactivas</span>
            </span>
            <span class="px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-400 text-[9px] font-bold">Bloqueado</span>
          </div>
          <div>
            <span class="text-2xl font-extrabold text-foreground tracking-tight font-mono">{{ inactiveAdminsCount() }}</span>
          </div>
          <p class="text-[10px] text-muted-foreground font-medium">Sin acceso a la API</p>
        </div>

        <!-- Super Admins KPI -->
        <div class="p-3.5 rounded-lg border border-border/80 bg-card space-y-1 shadow-none hover:border-primary/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <app-icon name="crown" class="w-3.5 h-3.5 text-amber-500" />
              <span>Super Administradores</span>
            </span>
            <span class="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-bold">Maestro</span>
          </div>
          <div>
            <span class="text-2xl font-extrabold text-foreground tracking-tight font-mono">{{ superAdminsCount() }}</span>
          </div>
          <p class="text-[10px] text-muted-foreground font-medium">Permisos globales del sistema</p>
        </div>

      </div>

      <!-- Toolbar: Search Bar, Bulk Actions, Status Filter, Role Filter, Column Visibility & View Switcher -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        
        <!-- Left: Search Input, Bulk Delete & Filter Dropdowns -->
        <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          
          <!-- Search Bar (Alineación perfecta del ícono de lupa dentro del input) -->
          <div class="relative flex-1 sm:w-64 flex items-center">
            <app-icon name="search" class="absolute left-2.5 text-muted-foreground w-3.5 h-3.5 pointer-events-none z-10" />
            <input
              type="text"
              hlmInput
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              placeholder="Buscar por nombre o correo..."
              class="h-8 pl-8 pr-3 w-full rounded-md bg-card border border-border text-xs focus:outline-none"
            />
          </div>

          <!-- Bulk Action Button -->
          @if (selectedAdminIds().length > 0) {
            <button
              type="button"
              (click)="openBulkDeleteDialog()"
              class="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all animate-in fade-in cursor-pointer"
            >
              <app-icon name="trash" class="w-3.5 h-3.5 text-rose-400" />
              <span>Eliminar ({{ selectedAdminIds().length }})</span>
            </button>
          }

          <!-- Status Dropdown Filter (Con bg-popover-solid de opacidad) -->
          <div class="relative">
            <button
              type="button"
              (click)="showStatusDropdown.update(v => !v); showRoleDropdown.set(false); showColumnsDropdown.set(false)"
              class="px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <app-icon name="filter" class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Estado</span>
              <app-icon name="chevron-down" class="w-3 h-3 text-muted-foreground" />
            </button>

            @if (showStatusDropdown()) {
              <div
                class="absolute left-0 top-full mt-1.5 w-44 bg-popover-solid text-popover-foreground border border-border rounded-lg shadow-2xl p-2 z-[9999] space-y-1 text-xs animate-dropdown-smooth"
                (click)="$event.stopPropagation()"
              >
                <label (click)="setStatusFilter('ALL')" class="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <input type="radio" name="status" [checked]="selectedStatusFilter() === 'ALL'" />
                  <span>Todos los Estados</span>
                </label>
                <label (click)="setStatusFilter('ACTIVE')" class="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer font-medium text-emerald-400">
                  <input type="radio" name="status" [checked]="selectedStatusFilter() === 'ACTIVE'" />
                  <span>Activos</span>
                </label>
                <label (click)="setStatusFilter('INACTIVE')" class="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer font-medium text-rose-400">
                  <input type="radio" name="status" [checked]="selectedStatusFilter() === 'INACTIVE'" />
                  <span>Inactivos</span>
                </label>
              </div>
            }
          </div>

          <!-- Role Dropdown Filter (Con bg-popover-solid de opacidad) -->
          <div class="relative">
            <button
              type="button"
              (click)="showRoleDropdown.update(v => !v); showStatusDropdown.set(false); showColumnsDropdown.set(false)"
              class="px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <app-icon name="shield" class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Rol</span>
              <app-icon name="chevron-down" class="w-3 h-3 text-muted-foreground" />
            </button>

            @if (showRoleDropdown()) {
              <div
                class="absolute left-0 top-full mt-1.5 w-44 bg-popover-solid text-popover-foreground border border-border rounded-lg shadow-2xl p-2 z-[9999] space-y-1 text-xs animate-dropdown-smooth"
                (click)="$event.stopPropagation()"
              >
                <label (click)="setRoleFilter('ALL')" class="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <input type="radio" name="role" [checked]="selectedRoleFilter() === 'ALL'" />
                  <span>Todos los Roles</span>
                </label>
                <label (click)="setRoleFilter('SUPER_ADMIN')" class="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <input type="radio" name="role" [checked]="selectedRoleFilter() === 'SUPER_ADMIN'" />
                  <span>SUPERADMIN</span>
                </label>
                <label (click)="setRoleFilter('ADMIN')" class="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <input type="radio" name="role" [checked]="selectedRoleFilter() === 'ADMIN'" />
                  <span>ADMIN</span>
                </label>
              </div>
            }
          </div>
        </div>

        <!-- Right Action Buttons -->
        <div class="flex items-center gap-2">
          
          <!-- Column Visibility Selector Dropdown -->
          <div class="relative">
            <button
              type="button"
              (click)="showColumnsDropdown.update(v => !v); showStatusDropdown.set(false); showRoleDropdown.set(false)"
              class="px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <app-icon name="settings" class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Columnas</span>
              <app-icon name="chevron-down" class="w-3 h-3 text-muted-foreground" />
            </button>

            @if (showColumnsDropdown()) {
              <div
                class="absolute right-0 top-full mt-1.5 w-48 bg-popover-solid text-popover-foreground border border-border rounded-lg shadow-2xl p-2 z-[9999] space-y-1 text-xs animate-dropdown-smooth-right"
                (click)="$event.stopPropagation()"
              >
                <div class="px-2 py-1 text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground border-b border-border/40">
                  Ver/Ocultar Columnas
                </div>
                <label (click)="toggleColumn('admin')" class="flex items-center justify-between p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <span>Administrador</span>
                  <input type="checkbox" [checked]="columns().admin" />
                </label>
                <label (click)="toggleColumn('email')" class="flex items-center justify-between p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <span>Correo Electrónico</span>
                  <input type="checkbox" [checked]="columns().email" />
                </label>
                <label (click)="toggleColumn('role')" class="flex items-center justify-between p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <span>Rol</span>
                  <input type="checkbox" [checked]="columns().role" />
                </label>
                <label (click)="toggleColumn('status')" class="flex items-center justify-between p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <span>Estado</span>
                  <input type="checkbox" [checked]="columns().status" />
                </label>
                <label (click)="toggleColumn('lastLogin')" class="flex items-center justify-between p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <span>Último Acceso</span>
                  <input type="checkbox" [checked]="columns().lastLogin" />
                </label>
                <label (click)="toggleColumn('createdAt')" class="flex items-center justify-between p-1.5 rounded hover:bg-muted cursor-pointer font-medium">
                  <span>Fecha de Registro</span>
                  <input type="checkbox" [checked]="columns().createdAt" />
                </label>
              </div>
            }
          </div>

          <!-- View Switcher -->
          <div class="flex items-center bg-muted/40 p-0.5 rounded-md border border-border">
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
          </div>
        </div>

      </div>

      <!-- MAIN FLEX-1 CONTAINER: TABLE / CARDS WITH SKELETON LOADING -->
      @if (isLoading()) {
        <div class="flex-1 rounded-lg border border-border/80 bg-card p-4 space-y-3 animate-pulse">
          <div class="h-8 bg-muted/60 rounded-md w-full"></div>
          <div class="h-10 bg-muted/40 rounded-md w-full"></div>
          <div class="h-10 bg-muted/40 rounded-md w-full"></div>
          <div class="h-10 bg-muted/40 rounded-md w-full"></div>
        </div>
      } @else {
        @if (viewMode() === 'table') {
          <div class="flex-1 rounded-lg border border-border/80 bg-popover-solid shadow-none overflow-hidden flex flex-col justify-between min-h-0 view-mode-container animate-in fade-in duration-300">
            <div class="overflow-x-auto overflow-y-auto flex-1 no-scrollbar bg-popover-solid">
              <table class="w-full text-left text-xs">
                <!-- Header 100% Opaco y Sólido sin Transparencia (bg-popover-solid) -->
                <thead class="bg-popover-solid border-b border-border/60 text-muted-foreground font-semibold sticky top-0 z-20 shadow-xs">
                  <tr>
                    <th class="p-3 w-8 bg-popover-solid">
                      <input
                        type="checkbox"
                        [checked]="isAllSelected()"
                        (change)="toggleSelectAll()"
                        class="rounded border-border cursor-pointer"
                      />
                    </th>
                    @if (columns().admin) { <th class="py-2.5 px-3 bg-popover-solid">Administrador</th> }
                    @if (columns().email) { <th class="py-2.5 px-3 bg-popover-solid">Correo Electrónico</th> }
                    @if (columns().role) { <th class="py-2.5 px-3 bg-popover-solid">Rol</th> }
                    @if (columns().status) { <th class="py-2.5 px-3 bg-popover-solid">Estado</th> }
                    @if (columns().lastLogin) { <th class="py-2.5 px-3 bg-popover-solid">Último Acceso</th> }
                    @if (columns().createdAt) { <th class="py-2.5 px-3 bg-popover-solid">Fecha de Registro</th> }
                    <th class="py-2.5 px-3 text-right bg-popover-solid">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/40 font-medium bg-popover-solid">
                  @for (admin of paginatedAdmins(); track admin.id) {
                    <tr class="hover:bg-muted/40 transition-all duration-200 group table-row-smooth animate-in fade-in duration-200">
                      <td class="p-3">
                        <input
                          type="checkbox"
                          [checked]="selectedAdminIds().includes(admin.id)"
                          (change)="toggleSelectAdmin(admin.id)"
                          class="rounded border-border cursor-pointer"
                        />
                      </td>
                      @if (columns().admin) {
                        <td class="py-2.5 px-3 column-smooth animate-in fade-in duration-200">
                          <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-border shrink-0 uppercase font-mono">
                              {{ admin.fullName.substring(0, 2) }}
                            </div>
                            <span class="font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{{ admin.fullName }}</span>
                          </div>
                        </td>
                      }
                      @if (columns().email) {
                        <td class="py-2.5 px-3 text-muted-foreground font-mono text-[11px] column-smooth animate-in fade-in duration-200">{{ admin.email }}</td>
                      }
                      @if (columns().role) {
                        <td class="py-2.5 px-3 column-smooth animate-in fade-in duration-200">
                          <span
                            class="px-2 py-0.5 rounded border text-[10px] font-bold inline-flex items-center gap-1"
                            [class]="admin.role === 'SUPER_ADMIN' || admin.role === 'SUPERADMIN' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-border bg-muted/40 text-foreground'"
                          >
                            <app-icon name="shield" class="w-3 h-3 text-muted-foreground" />
                            {{ admin.role === 'SUPER_ADMIN' || admin.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN' }}
                          </span>
                        </td>
                      }
                      @if (columns().status) {
                        <td class="py-2.5 px-3 column-smooth animate-in fade-in duration-200">
                          @if (admin.status) {
                            <span class="px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 flex items-center gap-1 w-fit">
                              <span>●</span> Activo
                            </span>
                          } @else {
                            <span class="px-2 py-0.5 rounded-full border border-rose-500/30 text-rose-400 text-[10px] font-semibold bg-rose-500/10 flex items-center gap-1 w-fit">
                              <span>●</span> Inactivo
                            </span>
                          }
                        </td>
                      }
                      @if (columns().lastLogin) {
                        <td class="py-2.5 px-3 text-muted-foreground font-mono text-[11px] column-smooth animate-in fade-in duration-200">
                          {{ admin.lastLoginAt ? (admin.lastLoginAt | date:'short') : 'Nunca ha ingresado' }}
                        </td>
                      }
                      @if (columns().createdAt) {
                        <td class="py-2.5 px-3 text-muted-foreground font-mono text-[11px] column-smooth animate-in fade-in duration-200">
                          {{ admin.createdAt | date:'shortDate' }}
                        </td>
                      }
                      <td class="py-2.5 px-3 text-right relative">
                        <button
                          type="button"
                          (click)="toggleRowActions(admin)"
                          class="text-muted-foreground hover:text-foreground text-xs p-1 rounded hover:bg-muted cursor-pointer transition-colors"
                        >
                          <app-icon name="more" class="w-4 h-4" />
                        </button>

                        <!-- Menú flotante contextual de acciones (Con bg-popover-solid opaco) -->
                        @if (activeRowMenuId() === admin.id) {
                          <div
                            class="absolute right-3 top-8 w-36 bg-popover-solid text-popover-foreground border border-border rounded-lg shadow-2xl p-1 z-[9999] text-left space-y-0.5 animate-dropdown-smooth-right"
                            (click)="$event.stopPropagation()"
                          >
                            <button (click)="openViewDrawer(admin)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded text-[11px] text-foreground font-medium cursor-pointer">
                              <app-icon name="eye" class="w-3.5 h-3.5 text-muted-foreground" /> Ver Detalles
                            </button>
                            <button (click)="openEditDrawer(admin)" class="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted rounded text-[11px] text-foreground font-medium cursor-pointer">
                              <app-icon name="edit" class="w-3.5 h-3.5 text-muted-foreground" /> Editar Cuenta
                            </button>
                            <button (click)="confirmSingleDelete(admin)" class="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded text-[11px] font-bold cursor-pointer">
                              <app-icon name="trash" class="w-3.5 h-3.5 text-rose-400" /> Eliminar
                            </button>
                          </div>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="p-12 text-center text-muted-foreground">
                        <div class="max-w-xs mx-auto space-y-2">
                          <app-icon name="search" class="w-8 h-8 mx-auto text-muted-foreground" />
                          <h4 class="text-sm font-bold text-foreground">No se encontraron administradores</h4>
                          <p class="text-xs">No hay registros que coincidan con la búsqueda "{{ searchQuery() }}".</p>
                          <button (click)="clearFilters()" class="mt-2 px-3 py-1 rounded-md border border-border bg-muted hover:bg-card text-xs font-semibold cursor-pointer">Limpiar Filtros</button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Fixed Bottom Pagination Footer -->
            <div class="p-2.5 border-t border-border/60 bg-popover-solid flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground shrink-0">
              <span>{{ selectedAdminIds().length }} de {{ filteredAdmins().length }} filas seleccionadas</span>

              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span>Filas por página:</span>
                  <select
                    [value]="pageSize()"
                    (change)="onPageSizeChange($event)"
                    class="px-2 py-0.5 rounded border border-border bg-card text-foreground text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <span class="font-bold text-foreground">Página {{ currentPage() }} de {{ totalPages() }}</span>

                <div class="flex items-center gap-1">
                  <button [disabled]="currentPage() === 1" (click)="currentPage.set(1)" class="px-2 py-0.5 rounded border border-border bg-card text-xs hover:bg-muted font-mono disabled:opacity-30 cursor-pointer">K</button>
                  <button [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)" class="px-2 py-0.5 rounded border border-border bg-card text-xs hover:bg-muted font-mono disabled:opacity-30 cursor-pointer">‹</button>
                  <button [disabled]="currentPage() >= totalPages()" (click)="currentPage.set(currentPage() + 1)" class="px-2 py-0.5 rounded border border-border bg-card text-xs hover:bg-muted font-mono disabled:opacity-30 cursor-pointer">›</button>
                  <button [disabled]="currentPage() >= totalPages()" (click)="currentPage.set(totalPages())" class="px-2 py-0.5 rounded border border-border bg-card text-xs hover:bg-muted font-mono disabled:opacity-30 cursor-pointer">❯</button>
                </div>
              </div>
            </div>

          </div>
        } @else {
          <!-- GRID VIEW -->
          <div class="flex-1 overflow-y-auto no-scrollbar view-mode-container animate-in fade-in duration-300">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-300">
              @for (admin of paginatedAdmins(); track admin.id) {
                <div class="p-4 rounded-lg border border-border/80 bg-card space-y-3 relative group hover:border-primary/50 transition-all duration-200 shadow-none table-row-smooth animate-in fade-in duration-200">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-border shrink-0 uppercase font-mono">
                        {{ admin.fullName.substring(0, 2) }}
                      </div>
                      <div>
                        <h4 class="text-xs font-bold text-foreground">{{ admin.fullName }}</h4>
                        <p class="text-[11px] text-muted-foreground font-mono">{{ admin.email }}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      [checked]="selectedAdminIds().includes(admin.id)"
                      (change)="toggleSelectAdmin(admin.id)"
                      class="rounded border-border cursor-pointer mt-1"
                    />
                  </div>

                  <div class="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                    <span class="text-muted-foreground font-mono text-[10px]">Rol: {{ admin.role }}</span>
                    @if (admin.status) {
                      <span class="px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold bg-emerald-500/10">● Activo</span>
                    } @else {
                      <span class="px-2 py-0.5 rounded-full border border-rose-500/30 text-rose-400 text-[10px] font-semibold bg-rose-500/10">● Inactivo</span>
                    }
                  </div>

                  <div class="flex justify-end gap-2 pt-2 border-t border-border/40">
                    <button (click)="openViewDrawer(admin)" class="px-2.5 py-1 rounded border border-border text-xs font-semibold hover:bg-muted flex items-center gap-1 cursor-pointer">
                      <app-icon name="eye" class="w-3.5 h-3.5" /> Ver
                    </button>
                    <button (click)="openEditDrawer(admin)" class="px-2.5 py-1 rounded border border-border text-xs font-semibold hover:bg-muted flex items-center gap-1 cursor-pointer">
                      <app-icon name="edit" class="w-3.5 h-3.5" /> Editar
                    </button>
                    <button (click)="confirmSingleDelete(admin)" class="p-1 rounded border border-rose-500/30 text-rose-400 text-xs font-semibold cursor-pointer">
                      <app-icon name="trash" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- CREATE / EDIT ADMIN DRAWER -->
      <app-drawer
        [(isOpen)]="isFormDrawerOpen"
        [title]="drawerMode() === 'create' ? 'Nuevo Administrador' : drawerMode() === 'edit' ? 'Editar Administrador' : 'Detalles de Cuenta'"
        [subtitle]="drawerMode() === 'view' ? 'Información de solo lectura.' : 'Completa los campos a continuación para guardar en la base de datos.'"
      >
        @if (drawerMode() === 'view' && selectedAdmin(); as a) {
          <div class="space-y-4 text-xs">
            <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div class="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-border shrink-0 uppercase font-mono">
                {{ a.fullName.substring(0, 2) }}
              </div>
              <div>
                <h4 class="text-sm font-bold text-foreground">{{ a.fullName }}</h4>
                <p class="text-muted-foreground text-[11px] font-mono">{{ a.email }}</p>
                <span class="px-2 py-0.5 rounded border border-border text-[10px] font-bold text-foreground bg-muted mt-1 block w-fit">{{ a.role }}</span>
              </div>
            </div>

            <div class="space-y-2 pt-2">
              <div class="flex justify-between py-1 border-b border-border/40"><span class="text-muted-foreground">Estado</span><span class="font-bold" [class.text-emerald-500]="a.status" [class.text-rose-500]="!a.status">{{ a.status ? 'Activo' : 'Inactivo' }}</span></div>
              <div class="flex justify-between py-1 border-b border-border/40"><span class="text-muted-foreground">Último Acceso</span><span class="font-mono text-foreground">{{ a.lastLoginAt ? (a.lastLoginAt | date:'medium') : 'Nunca ha ingresado' }}</span></div>
              <div class="flex justify-between py-1 border-b border-border/40"><span class="text-muted-foreground">Fecha de Creación</span><span class="font-mono text-foreground">{{ a.createdAt | date:'mediumDate' }}</span></div>
            </div>
          </div>
        } @else {
          <form (submit)="onFormSubmit(); $event.preventDefault()" class="space-y-4">
            
            <div class="space-y-1">
              <label class="text-xs font-bold text-foreground">Nombre Completo</label>
              <input type="text" hlmInput [formField]="adminForm.fullName" placeholder="Ej. Mathew Gulgowski" class="h-9 rounded-md text-xs" />
              @if (adminForm.fullName().touched() && adminForm.fullName().errors().length) {
                <p class="text-[10px] text-rose-500 font-medium">{{ adminForm.fullName().errors()[0].message }}</p>
              }
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-foreground">Correo Electrónico</label>
              <input type="email" hlmInput [formField]="adminForm.email" placeholder="admin@gocam360.io" class="h-9 rounded-md text-xs" />
              @if (adminForm.email().touched() && adminForm.email().errors().length) {
                <p class="text-[10px] text-rose-500 font-medium">{{ adminForm.email().errors()[0].message }}</p>
              }
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-foreground">Contraseña {{ drawerMode() === 'edit' ? '(Dejar en blanco para conservar)' : '' }}</label>
              <input type="password" hlmInput [formField]="adminForm.password" placeholder="••••••••" class="h-9 rounded-md text-xs" />
              @if (adminForm.password().touched() && adminForm.password().errors().length) {
                <p class="text-[10px] text-rose-500 font-medium">{{ adminForm.password().errors()[0].message }}</p>
              }
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-foreground">Rol de Administrador</label>
              <select [formField]="adminForm.role" class="w-full h-9 px-3 rounded-md border border-border bg-background text-xs font-bold text-foreground focus:outline-none">
                <option value="ADMIN">ADMIN</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
              </select>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" id="statusCheck" [checked]="adminModel().status" (change)="toggleFormStatus($event)" class="rounded border-border cursor-pointer" />
              <label for="statusCheck" class="text-xs font-medium text-foreground cursor-pointer">Cuenta activa con acceso al sistema</label>
            </div>

            <div class="pt-4">
              <button
                type="submit"
                hlmBtn
                class="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                [disabled]="adminForm().invalid()"
              >
                {{ drawerMode() === 'create' ? 'Guardar Nuevo Administrador' : 'Actualizar Cambios' }}
              </button>
            </div>
          </form>
        }
      </app-drawer>

      <!-- SINGLE DELETE CONFIRM DIALOG -->
      <app-confirm-dialog
        [(isOpen)]="isSingleDeleteConfirmOpen"
        title="¿Eliminar administrador?"
        [message]="'¿Estás seguro de que deseas eliminar la cuenta de ' + (selectedAdmin()?.fullName ?? '') + '? Esta acción borrará permanentemente sus credenciales.'"
        (confirmed)="executeSingleDelete()"
      />

      <!-- BULK DELETE CONFIRM DIALOG -->
      <app-confirm-dialog
        [(isOpen)]="isBulkDeleteConfirmOpen"
        title="Eliminar Administradores Seleccionados"
        [message]="'¿Estás seguro de que deseas eliminar las ' + selectedAdminIds().length + ' cuentas de administrador seleccionadas? Esta acción no se puede deshacer.'"
        (confirmed)="executeBulkDelete()"
      />

    </div>
  `,
})
export class UsersPage implements OnInit {
  private readonly _usersService = inject(UsersService);
  private readonly _toastService = inject(ToastService);
  private readonly _preferencesService = inject(PreferencesService);
  private readonly initialPref = this._preferencesService.getPageFilter('users');

  protected readonly isLoading = signal(true);
  protected readonly viewMode = signal<'table' | 'cards'>(this.initialPref.viewMode ?? 'table');
  protected readonly showStatusDropdown = signal(false);
  protected readonly showRoleDropdown = signal(false);
  protected readonly showColumnsDropdown = signal(false);
  protected readonly activeRowMenuId = signal<string | null>(null);

  protected readonly adminsList = signal<AdminUserResponseDto[]>([]);

  protected readonly columns = signal<ColumnVisibility>({
    admin: true,
    email: true,
    role: true,
    status: true,
    lastLogin: true,
    createdAt: true,
    ...(this.initialPref.visibleColumns ? this.parseColumns(this.initialPref.visibleColumns) : {}),
  });

  protected readonly searchQuery = signal(this.initialPref.searchQuery ?? '');
  protected readonly selectedRoleFilter = signal<string>(this.initialPref.statusFilter ?? 'ALL');
  protected readonly selectedStatusFilter = signal<string>('ALL');

  protected readonly selectedAdminIds = signal<string[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly isFormDrawerOpen = signal(false);
  protected readonly drawerMode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly selectedAdmin = signal<AdminUserResponseDto | null>(null);

  protected readonly isSingleDeleteConfirmOpen = signal(false);
  protected readonly isBulkDeleteConfirmOpen = signal(false);

  protected readonly adminModel = signal({
    fullName: '',
    email: '',
    password: '',
    role: 'ADMIN' as UserRole,
    status: true,
  });

  protected readonly adminForm = form(this.adminModel, (s) => {
    required(s.fullName, { message: 'El nombre completo es obligatorio' });
    required(s.email, { message: 'El correo electrónico es obligatorio' });
    email(s.email, { message: 'Ingresa un correo electrónico válido' });
  });

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(notify = false): void {
    if (this._usersService.users() && !notify) {
      this.adminsList.set(this._usersService.users()!);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(true);
    }

    this._usersService.findAll(notify).subscribe({
      next: (data) => {
        this.adminsList.set(data);
        this.isLoading.set(false);
        if (notify) {
          this._toastService.info('Sincronización Completa', 'Lista de administradores actualizada desde la base de datos');
        }
      },
      error: () => {
        this.isLoading.set(false);
        if (notify) {
          this._toastService.error('Error de Sincronización', 'No se pudieron recuperar los administradores');
        }
      },
    });
  }

  toggleColumn(col: keyof ColumnVisibility): void {
    this.columns.update((curr) => ({ ...curr, [col]: !curr[col] }));
  }

  // Métricas calculadas para las 4 KPI Cards
  protected readonly totalAdminsCount = computed(() => this.adminsList().length);
  protected readonly activeAdminsCount = computed(() => this.adminsList().filter((a) => a.status).length);
  protected readonly inactiveAdminsCount = computed(() => this.adminsList().filter((a) => !a.status).length);
  protected readonly superAdminsCount = computed(() => this.adminsList().filter((a) => a.role === 'SUPER_ADMIN' || a.role === 'SUPERADMIN').length);

  protected readonly filteredAdmins = computed(() => {
    let list = this.adminsList();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatusFilter();
    const role = this.selectedRoleFilter();

    if (query) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    if (status === 'ACTIVE') {
      list = list.filter((u) => u.status === true);
    } else if (status === 'INACTIVE') {
      list = list.filter((u) => u.status === false);
    }

    if (role !== 'ALL') {
      list = list.filter((u) => u.role === role || (role === 'SUPER_ADMIN' && u.role === 'SUPERADMIN'));
    }

    return list;
  });

  protected readonly paginatedAdmins = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAdmins().slice(start, start + this.pageSize());
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredAdmins().length / this.pageSize()))
  );

  protected readonly isAllSelected = computed(() => {
    const p = this.paginatedAdmins();
    if (!p.length) return false;
    return p.every((u) => this.selectedAdminIds().includes(u.id));
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('users', { searchQuery: input.value });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatusFilter.set('ALL');
    this.selectedRoleFilter.set('ALL');
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('users', { searchQuery: '', statusFilter: 'ALL' });
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter.set(status);
    this.showStatusDropdown.set(false);
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('users', { statusFilter: status });
  }

  setRoleFilter(role: string): void {
    this.selectedRoleFilter.set(role);
    this.showRoleDropdown.set(false);
    this.currentPage.set(1);
    this._preferencesService.savePageFilter('users', { statusFilter: role });
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize.set(Number(select.value));
    this.currentPage.set(1);
  }

  toggleRowActions(admin: AdminUserResponseDto): void {
    this.activeRowMenuId.update((id) => (id === admin.id ? null : admin.id));
  }

  toggleSelectAll(): void {
    const currentPaginatedIds = this.paginatedAdmins().map((u) => u.id);
    if (this.isAllSelected()) {
      this.selectedAdminIds.update((ids) => ids.filter((id) => !currentPaginatedIds.includes(id)));
    } else {
      this.selectedAdminIds.update((ids) => Array.from(new Set([...ids, ...currentPaginatedIds])));
    }
  }

  toggleSelectAdmin(id: string): void {
    this.selectedAdminIds.update((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    );
  }

  toggleFormStatus(event: Event): void {
    const check = event.target as HTMLInputElement;
    this.adminModel.update((m) => ({ ...m, status: check.checked }));
  }

  openCreateDrawer(): void {
    this.adminModel.set({
      fullName: '',
      email: '',
      password: '',
      role: 'ADMIN',
      status: true,
    });
    this.drawerMode.set('create');
    this.isFormDrawerOpen.set(true);
  }

  openViewDrawer(admin: AdminUserResponseDto): void {
    this.selectedAdmin.set(admin);
    this.activeRowMenuId.set(null);
    this.drawerMode.set('view');
    this.isFormDrawerOpen.set(true);
  }

  openEditDrawer(admin: AdminUserResponseDto): void {
    this.selectedAdmin.set(admin);
    this.activeRowMenuId.set(null);
    this.adminModel.set({
      fullName: admin.fullName,
      email: admin.email,
      password: '',
      role: admin.role,
      status: admin.status,
    });
    this.drawerMode.set('edit');
    this.isFormDrawerOpen.set(true);
  }

  onFormSubmit(): void {
    submit(this.adminForm, async () => {
      const formVal = this.adminModel();

      if (this.drawerMode() === 'create') {
        const payload: CreateAdminDto = {
          fullName: formVal.fullName,
          email: formVal.email,
          password: formVal.password || 'password123',
          role: formVal.role,
          status: formVal.status,
        };

        this._usersService.create(payload).subscribe({
          next: (newAdmin) => {
            this.adminsList.update((list) => [newAdmin, ...list]);
            this._toastService.success('Administrador Creado', `Se creó a ${newAdmin.fullName} exitosamente.`);
            this.isFormDrawerOpen.set(false);
          },
          error: (err) => {
            const errorMsg = err?.error?.message || 'No se pudo crear el administrador';
            this._toastService.error('Error al crear', errorMsg);
          },
        });

      } else if (this.drawerMode() === 'edit' && this.selectedAdmin()) {
        const targetId = this.selectedAdmin()!.id;
        const payload: UpdateAdminDto = {
          fullName: formVal.fullName,
          email: formVal.email,
          role: formVal.role,
          status: formVal.status,
        };

        if (formVal.password && formVal.password.length >= 8) {
          payload.password = formVal.password;
        }

        this._usersService.update(targetId, payload).subscribe({
          next: (updatedAdmin) => {
            this.adminsList.update((list) =>
              list.map((u) => (u.id === targetId ? updatedAdmin : u))
            );
            this._toastService.info('Administrador Actualizado', 'Los cambios se guardaron en la base de datos.');
            this.isFormDrawerOpen.set(false);
          },
          error: (err) => {
            const errorMsg = err?.error?.message || 'Error al actualizar administrador';
            this._toastService.error('Error al actualizar', errorMsg);
          },
        });
      }
    });
  }

  confirmSingleDelete(admin: AdminUserResponseDto): void {
    this.selectedAdmin.set(admin);
    this.activeRowMenuId.set(null);
    this.isSingleDeleteConfirmOpen.set(true);
  }

  executeSingleDelete(): void {
    if (this.selectedAdmin()) {
      const id = this.selectedAdmin()!.id;
      this._usersService.remove(id).subscribe({
        next: () => {
          this.adminsList.update((list) => list.filter((u) => u.id !== id));
          this.selectedAdminIds.update((ids) => ids.filter((i) => i !== id));
          this._toastService.error('Administrador Eliminado', 'Se eliminó la cuenta del sistema.');
        },
        error: () => {
          this._toastService.error('Error', 'No se pudo eliminar el administrador.');
        },
      });
    }
  }

  openBulkDeleteDialog(): void {
    if (this.selectedAdminIds().length > 0) {
      this.isBulkDeleteConfirmOpen.set(true);
    }
  }

  executeBulkDelete(): void {
    const ids = this.selectedAdminIds();
    if (!ids.length) return;

    this._usersService.bulkRemove(ids).subscribe({
      next: (res) => {
        this.adminsList.update((list) => list.filter((u) => !ids.includes(u.id)));
        this.selectedAdminIds.set([]);
        this._toastService.error('Eliminación Masiva', res.message || `${ids.length} administradores eliminados`);
      },
      error: () => {
        this._toastService.error('Error', 'No se pudo realizar la eliminación masiva.');
      },
    });
  }

  private parseColumns(cols: string[]): Partial<ColumnVisibility> {
    const result: any = {};
    cols.forEach((col) => (result[col] = true));
    return result;
  }
}
