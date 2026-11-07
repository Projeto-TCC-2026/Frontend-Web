import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}