import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideSettings } from '@lucide/angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, LucideSettings],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {}