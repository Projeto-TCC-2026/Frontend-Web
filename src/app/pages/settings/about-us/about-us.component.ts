import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [],
  templateUrl: './about-us.component.html',
})
export class AboutUsComponent {
  constructor(private location: Location) {}

  protected goBack(): void {
    this.location.back();
  }
}
