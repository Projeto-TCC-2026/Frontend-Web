import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { LucideChevronLeft } from '@lucide/angular';

@Component({
  selector: 'app-privacy-terms',
  standalone: true,
  imports: [LucideChevronLeft],
  templateUrl: './privacy-terms.component.html',
})
export class PrivacyTermsComponent {
  constructor(private location: Location) {}

  protected goBack(): void {
    this.location.back();
  }
}
