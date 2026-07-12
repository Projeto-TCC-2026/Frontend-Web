import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideLogOut, LucideMenu } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideLogOut, LucideMenu],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private auth = inject(AuthService);

  @Output() menuToggle = new EventEmitter<void>();

  protected get userName(): string {
    const user = this.auth.getCurrentUser();
    return user?.fullName ?? user?.email ?? '';
  }

  protected get userRole(): string {
    const role = this.auth.getRole();
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'DOCTOR': return 'Médico';
      default: return '';
    }
  }

  protected get userInitials(): string {
    const name = this.userName;
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  protected logout(): void {
    this.auth.logout();
  }

  protected onMenuToggle(): void {
    this.menuToggle.emit();
  }
}
