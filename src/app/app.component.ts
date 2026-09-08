import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationHistoryService } from './core/services/navigation-history.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  /**
   * Injected for its side effect: the service must start listening to router
   * events at app startup so the "go back" target is available on /403.
   */
  private readonly navigationHistory = inject(NavigationHistoryService);
}
