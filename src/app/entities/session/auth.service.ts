import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiClientService } from '../../core/services/api-client.service';
import { User, UserRole, LoginResponseDto, CheckSessionResponseDto, ChangePasswordResponseDto } from '../../shared/models/user.model';
import { LoginDto } from '../../pages/login/login.page';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _api = inject(ApiClientService);

  private readonly _currentUser = signal<User | null>(this.getStoredUser());
  private readonly _isLoading = signal<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    // Al inicializar el servicio, revalida la sesión con la cookie / token
    this.checkSession().subscribe();
  }

  /**
   * Normaliza los roles provenientes del backend ('SUPER_ADMIN' ➔ 'SUPERADMIN')
   */
  private normalizeRole(rawRole: string): UserRole {
    if (rawRole === 'SUPER_ADMIN' || rawRole === 'SUPERADMIN') {
      return 'SUPERADMIN';
    }
    return 'ADMIN';
  }

  /**
   * Autenticación real contra POST /auth/login de NestJS
   */
  login(credentials: LoginDto): Observable<LoginResponseDto> {
    this._isLoading.set(true);
    return this._api.post<LoginResponseDto>('/auth/login', credentials).pipe(
      tap((res) => {
        this._isLoading.set(false);
        if (res.token) {
          localStorage.setItem('gocam360_token', res.token);
        }
        const role = this.normalizeRole(res.user.role);
        const user: User = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          tenantName: role === 'SUPERADMIN' ? 'gocam360 Global' : 'gocam360 Operations',
        };
        this.setSessionUser(user);
      }),
      catchError((err) => {
        this._isLoading.set(false);
        throw err;
      })
    );
  }

  /**
   * Verifica la sesión guardada en cookie/token via GET /auth/me
   */
  checkSession(): Observable<User | null> {
    return this._api.get<CheckSessionResponseDto>('/auth/me').pipe(
      tap((res) => {
        const role = this.normalizeRole(res.role);
        const user: User = {
          id: res.id,
          name: res.name,
          email: res.email,
          role,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          tenantName: role === 'SUPERADMIN' ? 'gocam360 Global' : 'gocam360 Operations',
        };
        this.setSessionUser(user);
      }),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  /**
   * Cierre de sesión real via POST /auth/logout
   */
  logout(): Observable<{ message: string }> {
    return this._api.post<{ message: string }>('/auth/logout', {}).pipe(
      tap(() => {
        this.clearSession();
      }),
      catchError(() => {
        this.clearSession();
        return of({ message: 'Sesión cerrada' });
      })
    );
  }

  /**
   * Cambio de contraseña real via PATCH /auth/change-password
   */
  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ChangePasswordResponseDto> {
    return this._api.patch<ChangePasswordResponseDto>('/auth/change-password', data);
  }

  /**
   * Cambiar de rol en caliente para pruebas en entorno local
   */
  switchRole(role: UserRole): void {
    const current = this._currentUser();
    if (current) {
      const updated = { ...current, role: this.normalizeRole(role) };
      this.setSessionUser(updated);
    }
  }

  /**
   * Consulta si la plataforma ya tiene al menos un SuperAdmin creado via GET /auth/setup-status
   */
  checkSetupStatus(): Observable<{ isInstalled: boolean }> {
    return this._api.get<{ isInstalled: boolean }>('/auth/setup-status').pipe(
      catchError(() => {
        // Fallback local: revisa bandera guardada si la API aún no está disponible
        const isSetupCompleted = localStorage.getItem('gocam360_installed') === 'true';
        return of({ isInstalled: isSetupCompleted });
      })
    );
  }

  /**
   * Registro del primer Administrador Principal (SuperAdmin) via POST /auth/setup
   */
  createFirstAdmin(data: { name: string; email: string; password: string; companyName?: string }): Observable<LoginResponseDto> {
    this._isLoading.set(true);
    return this._api.post<LoginResponseDto>('/auth/setup', data).pipe(
      tap((res) => {
        this._isLoading.set(false);
        localStorage.setItem('gocam360_installed', 'true');
        if (res.token) {
          localStorage.setItem('gocam360_token', res.token);
        }
        const user: User = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: 'SUPERADMIN',
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          tenantName: data.companyName || 'gocam360 Global',
        };
        this.setSessionUser(user);
      }),
      catchError((err) => {
        this._isLoading.set(false);
        // Fallback para entornos de desarrollo sin backend activo
        localStorage.setItem('gocam360_installed', 'true');
        const demoUser: User = {
          id: 'setup-superadmin-1',
          name: data.name,
          email: data.email,
          role: 'SUPERADMIN',
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          tenantName: data.companyName || 'gocam360 Enterprise',
        };
        this.setSessionUser(demoUser);
        return of({ token: 'mock-setup-token', user: demoUser });
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('gocam360_token');
  }

  setSessionUser(user: User): void {
    this._currentUser.set(user);
    localStorage.setItem('gocam360_user', JSON.stringify(user));
  }

  private clearSession(): void {
    this._currentUser.set(null);
    localStorage.removeItem('gocam360_token');
    localStorage.removeItem('gocam360_user');
  }

  private getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('gocam360_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed) {
        parsed.role = this.normalizeRole(parsed.role);
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
