import { Component, Input } from '@angular/core';
import { LucideInbox } from '@lucide/angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [LucideInbox],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  @Input() title = 'Nenhum item encontrado';
  @Input() description = '';
}
