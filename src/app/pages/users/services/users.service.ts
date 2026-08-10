import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';
import { UserRole } from '../../../shared/models/user.model';

export interface AdminUserResponseDto {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: boolean;
  lastLoginAt: string | Date | null;
  createdAt: string | Date;
}

export interface CreateAdminDto {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  status?: boolean;
}

export interface UpdateAdminDto {
  fullName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly _api = inject(ApiClientService);

  private readonly _users = signal<AdminUserResponseDto[] | null>(null);
  readonly users = this._users.asReadonly();

  /**
   * Obtener todos los administradores desde GET /users con soporte para caché en memoria
   */
  findAll(forceRefresh = false): Observable<AdminUserResponseDto[]> {
    if (this._users() && !forceRefresh) {
      return of(this._users()!);
    }

    return this._api.get<AdminUserResponseDto[]>('/users').pipe(
      tap((data) => this._users.set(data))
    );
  }

  /**
   * Obtener detalles de un administrador por ID via GET /users/:id
   */
  findOne(id: string): Observable<AdminUserResponseDto> {
    return this._api.get<AdminUserResponseDto>(`/users/${id}`);
  }

  /**
   * Crear un nuevo administrador via POST /users
   */
  create(data: CreateAdminDto): Observable<AdminUserResponseDto> {
    return this._api.post<AdminUserResponseDto>('/users', data).pipe(
      tap((newUser) => {
        if (this._users()) {
          this._users.update((list) => [newUser, ...(list || [])]);
        }
      })
    );
  }

  /**
   * Actualizar un administrador existente via PATCH /users/:id
   */
  update(id: string, data: UpdateAdminDto): Observable<AdminUserResponseDto> {
    return this._api.patch<AdminUserResponseDto>(`/users/${id}`, data).pipe(
      tap((updated) => {
        if (this._users()) {
          this._users.update((list) =>
            (list || []).map((u) => (u.id === id ? updated : u))
          );
        }
      })
    );
  }

  /**
   * Eliminar un administrador via DELETE /users/:id
   */
  remove(id: string): Observable<{ message: string }> {
    return this._api.delete<{ message: string }>(`/users/${id}`).pipe(
      tap(() => {
        if (this._users()) {
          this._users.update((list) => (list || []).filter((u) => u.id !== id));
        }
      })
    );
  }

  /**
   * Eliminar múltiples administradores via DELETE /users/bulk
   */
  bulkRemove(ids: string[]): Observable<{ message: string }> {
    return this._api.delete<{ message: string }>('/users/bulk', { ids }).pipe(
      tap(() => {
        if (this._users()) {
          this._users.update((list) => (list || []).filter((u) => !ids.includes(u.id)));
        }
      })
    );
  }
}
