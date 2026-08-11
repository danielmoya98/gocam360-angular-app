import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { form, FormField, submit, required } from '@angular/forms/signals';
import { AuthService } from '../../entities/session/auth.service';
import { UsersService } from '../users/services/users.service';
import { ToastService } from '../../shared/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormField, IconComponent, HlmInputDirective, SlicePipe],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage implements OnInit {
  private readonly _authService = inject(AuthService);
  private readonly _usersService = inject(UsersService);
  private readonly _toastService = inject(ToastService);

  protected readonly user = this._authService.currentUser;
  protected readonly userRole = this._authService.userRole;

  protected readonly isSavingProfile = signal(false);
  protected readonly isSavingPassword = signal(false);

  protected readonly profileModel = signal({
    name: '',
  });

  protected readonly profileForm = form(this.profileModel, (s) => {
    required(s.name, { message: 'El nombre es obligatorio' });
  });

  protected readonly passwordModel = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  protected readonly passwordForm = form(this.passwordModel, (s) => {
    required(s.currentPassword, { message: 'Debes ingresar tu contraseña actual' });
    required(s.newPassword, { message: 'Debes ingresar la nueva contraseña' });
    required(s.confirmPassword, { message: 'Confirma la nueva contraseña' });
  });

  protected readonly passwordMismatch = computed(() => {
    const val = this.passwordModel();
    return val.confirmPassword.length > 0 && val.newPassword !== val.confirmPassword;
  });

  ngOnInit(): void {
    if (this.user()) {
      this.profileModel.set({
        name: this.user()?.name || '',
      });
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onSaveProfile(): void {
    submit(this.profileForm, async () => {
      const userObj = this.user();
      if (!userObj?.id) return;

      this.isSavingProfile.set(true);
      const newName = this.profileModel().name;

      this._usersService.update(userObj.id, { fullName: newName }).subscribe({
        next: (updatedUser) => {
          this.isSavingProfile.set(false);
          this._authService.setSessionUser({
            ...userObj,
            name: updatedUser.fullName,
          });
          this._toastService.success('Perfil Actualizado', 'Tu información personal ha sido guardada.');
        },
        error: () => {
          this.isSavingProfile.set(false);
          this._toastService.error('Error', 'No se pudo actualizar la información del perfil.');
        },
      });
    });
  }

  onUpdatePassword(): void {
    submit(this.passwordForm, async () => {
      if (this.passwordMismatch()) {
        this._toastService.error('Error', 'Las contraseñas no coinciden.');
        return;
      }

      this.isSavingPassword.set(true);
      const val = this.passwordModel();

      this._authService.changePassword({
        currentPassword: val.currentPassword,
        newPassword: val.newPassword,
      }).subscribe({
        next: () => {
          this.isSavingPassword.set(false);
          this._toastService.success('Seguridad Actualizada', 'Tu contraseña ha sido actualizada exitosamente.');
          this.passwordModel.set({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
        error: (err) => {
          this.isSavingPassword.set(false);
          const msg = err?.error?.message || 'No se pudo actualizar la contraseña.';
          this._toastService.error('Error de Seguridad', msg);
        },
      });
    });
  }
}
