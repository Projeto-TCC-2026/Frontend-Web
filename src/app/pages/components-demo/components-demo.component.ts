import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-components-demo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    CardComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  templateUrl: './components-demo.component.html',
})
export class ComponentsDemoComponent {
  protected nameControl = new FormControl('');
  protected emailControl = new FormControl('');

  protected loadingBtn = signal(false);

  protected simulateLoading(): void {
    this.loadingBtn.set(true);
    setTimeout(() => this.loadingBtn.set(false), 2000);
  }
}
