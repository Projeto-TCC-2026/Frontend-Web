import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.scss']
})
export class ForbiddenComponent {

  private readonly router = inject(Router);
  private readonly navigationHistory = inject(NavigationHistoryService);

  /**
   * Returns to the last successfully activated route, falling back to the
   * dashboard when there is none (direct access or reload on this screen).
   */
  goBack(): void {
    this.router.navigateByUrl(this.navigationHistory.getBackUrl());
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }
}
