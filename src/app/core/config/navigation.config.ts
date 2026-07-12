import { UserRole } from '../models/entities/user.model';

/**
 * Single source of truth for authenticated navigation items.
 * Used by:
 * - app.routes.ts (generates routes with correct roles, breadcrumb, guard)
 * - SidebarComponent (renders menu items filtered by user role)
 */
export interface NavItem {
  /** Display label (also used as breadcrumb) */
  label: string;
  /** Route path segment (e.g. 'dashboard', 'pacientes') */
  path: string;
  /** Lucide icon name in kebab-case (for sidebar @switch) */
  icon: string;
  /** Roles allowed to see/access this item */
  roles: UserRole[];
  /** Whether to show in sidebar (default: true) */
  showInSidebar?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Administração',  path: 'admin',          icon: 'shield',           roles: ['ADMIN'] },
  { label: 'Dashboard',      path: 'dashboard',      icon: 'layout-dashboard', roles: ['ADMIN', 'DOCTOR'] },
  { label: 'Pacientes',      path: 'pacientes',      icon: 'users',            roles: ['ADMIN', 'DOCTOR'] },
  { label: 'Configurações',  path: 'configuracoes',  icon: 'settings',         roles: ['ADMIN', 'DOCTOR'] },
];
