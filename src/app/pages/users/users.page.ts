import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { form, FormField, submit, required, email } from '@angular/forms/signals';
import { UserRole } from '../../shared/models/user.model';
import { HlmButtonDirective } from '../../shared/ui/button/hlm-button.directive';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../shared/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { UsersService, AdminUserResponseDto, CreateAdminDto, UpdateAdminDto } from './services/users.service';
import { PreferencesService } from '../../shared/services/preferences.service';


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
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
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
  protected readonly activeRowMenuId = signal<string | null>(null);

  protected readonly adminsList = signal<AdminUserResponseDto[]>([]);

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

  onFullNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nameVal = input.value;

    if (this.drawerMode() === 'create') {
      const generatedEmail = this.slugifyName(nameVal);
      this.adminModel.update((m) => ({
        ...m,
        fullName: nameVal,
        email: generatedEmail,
      }));
    } else {
      this.adminModel.update((m) => ({ ...m, fullName: nameVal }));
    }
  }

  private slugifyName(name: string): string {
    if (!name.trim()) return '';
    const clean = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina acentos y tildes
      .replace(/[^a-z0-9\s.]/g, '') // Quita caracteres especiales
      .trim()
      .replace(/\s+/g, '.'); // Reemplaza espacios por puntos
    return `${clean}@gocam.com`;
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
        const finalPassword = formVal.password && formVal.password.trim().length >= 6 
          ? formVal.password.trim() 
          : 'Admin360#';

        const payload: CreateAdminDto = {
          fullName: formVal.fullName,
          email: formVal.email,
          password: finalPassword,
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
}
