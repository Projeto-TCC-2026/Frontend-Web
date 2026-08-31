import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-privacy-terms',
  standalone: true,
  imports: [],
  templateUrl: './privacy-terms.component.html',
})
export class PrivacyTermsComponent {
  constructor(private location: Location) {}

  protected goBack(): void {
    this.location.back();
  }
}
