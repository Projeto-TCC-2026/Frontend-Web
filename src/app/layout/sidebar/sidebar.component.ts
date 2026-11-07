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
  LucideUserRound,
  LucideBuilding2,
  LucideFileSpreadsheet,
  LucideBellRing,
  LucideChevronLeft,
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
    LucideUserRound,
    LucideBuilding2,
    LucideFileSpreadsheet,
    LucideBellRing,
    LucideChevronLeft,
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

    protected get userName(): string {
    const user = this.auth.getCurrentUser();
    return user?.fullName ?? user?.email ?? '';
  }

  protected get userRole(): string {
    const role = this.auth.getRole();
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'HOSPITAL': return 'Hospital';
      case 'DOCTOR': return 'Médico';
      default: return '';
    }
  }

  protected get userInitials(): string {
    const name = this.userName;
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private _collapsed = false;

  toggleCollapse(): void {
    this._collapsed = !this._collapsed;
  }
}
