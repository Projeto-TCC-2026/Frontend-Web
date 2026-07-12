import { UserRole } from '../models/entities/user.model';

/**
 * Single source of truth for authenticated navigation items.
 * Used by:
 * - app.routes.ts (generates routes with correct roles, breadcrumb, guard, lazy component)
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
  /** Lazy component loader. Falls back to TemplatePageComponent if not provided. */
  loadComponent?: () => Promise<any>;
  /** Whether to show in sidebar (default: true) */
  showInSidebar?: boolean;
}

const templatePage = () =>
  import('../../pages/_template/template-page.component').then(m => m.TemplatePageComponent);

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: 'dashboard',
    icon: 'layout-dashboard',
    roles: ['ADMIN', 'DOCTOR'],
    loadComponent: () => import('../../pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  { label: 'Administração', path: 'admin',         icon: 'shield',         roles: ['ADMIN'] },
  { label: 'Pacientes',     path: 'pacientes',     icon: 'users',          roles: ['ADMIN', 'DOCTOR'] },
  { label: 'Configurações', path: 'configuracoes', icon: 'settings',       roles: ['ADMIN', 'DOCTOR'] },
  {
    label: 'Componentes',
    path: 'componentes',
    icon: 'layout-dashboard',
    roles: ['ADMIN', 'DOCTOR'],
    showInSidebar: false,
    loadComponent: () => import('../../pages/components-demo/components-demo.component').then(m => m.ComponentsDemoComponent),
  },
];

/** Fallback loader for items without a dedicated component */
export const TEMPLATE_PAGE_LOADER = templatePage;
