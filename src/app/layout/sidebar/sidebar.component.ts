import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideLayoutDashboard,
  LucideUsers,
  LucideCalendarDays,
  LucideClipboardList,
  LucideMessageSquare,
  LucideChartBar,
  LucideSettings,
  LucideActivity,
  LucideShield,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { NAV_ITEMS, NavItem } from '../../core/config/navigation.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LucideLayoutDashboard,
    LucideUsers,
    LucideCalendarDays,
    LucideClipboardList,
    LucideMessageSquare,
    LucideChartBar,
    LucideSettings,
    LucideActivity,
    LucideShield,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private auth = inject(AuthService);

  protected get visibleItems(): NavItem[] {
    const role = this.auth.getRole();
    if (!role) return [];
    return NAV_ITEMS
      .filter(item => item.showInSidebar !== false)
      .filter(item => item.roles.includes(role));
  }

  protected getRoute(item: NavItem): string {
    return `/app/${item.path}`;
  }

  protected get isSidebarCollapsed(): boolean {
    return this._collapsed;
  }

  private _collapsed = false;

  toggleCollapse(): void {
    this._collapsed = !this._collapsed;
  }
}
