import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { LucideChevronLeft } from '@lucide/angular';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [LucideChevronLeft],
  templateUrl: './about-us.component.html',
})
export class AboutUsComponent {
  constructor(private location: Location) {}

  protected goBack(): void {
    this.location.back();
  }
}
