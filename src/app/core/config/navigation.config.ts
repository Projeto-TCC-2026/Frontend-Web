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
    roles: ['ADMIN', 'HOSPITAL', 'DOCTOR'],
    loadComponent: () => import('../../pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    label: 'Hospitais',
    path: 'admin-hospitals',
    icon: 'building-2',
    roles: ['ADMIN'],
    loadComponent: () => import('../../pages/admin-hospitals/admin-hospitals.component').then(m => m.AdminHospitalsComponent),
  },
  {
    label: 'Doutores',
    path: 'medicos',
    icon: 'user-round',
    roles: ['ADMIN', 'HOSPITAL'],
    loadComponent: () => import('../../pages/medicos/medicos.component').then(m => m.MedicosComponent),
  },
  {
    label: 'Pacientes',
    path: 'pacientes',
    icon: 'users',
    roles: ['HOSPITAL', 'DOCTOR'],
    loadComponent: () => import('../../pages/patients/patients.component').then(m => m.PatientsComponent),
  },
  {
    label: 'Alertas',
    path: 'alertas',
    icon: 'bell-ring',
    roles: ['DOCTOR'],
    loadComponent: () => import('../../pages/alerts/alerts.component').then(m => m.AlertsComponent),
  },
  {
    label: 'Procedimentos',
    path: 'procedimentos',
    icon: 'clipboard-list',
    roles: ['ADMIN', 'HOSPITAL'],
    loadComponent: () => import('../../pages/procedimentos/procedimentos.component').then(m => m.ProcedimentosComponent),
  },
  {
    label: 'Meus Procedimentos',
    path: 'meus-procedimentos',
    icon: 'clipboard-list',
    roles: ['DOCTOR'],
    loadComponent: () => import('../../pages/meus-procedimentos/meus-procedimentos.component').then(m => m.MeusProcedimentosComponent),
  },
  {
    label: 'Meu Hospital',
    path: 'hospital',
    icon: 'building-2',
    roles: ['HOSPITAL'],
    loadComponent: () => import('../../pages/hospital/hospital.component').then(m => m.HospitalComponent),
  },
  {
    label: 'Relatórios',
    path: 'relatorios',
    icon: 'file-spreadsheet',
    roles: ['HOSPITAL', 'DOCTOR'],
    loadComponent: () => import('../../pages/reports/reports.component').then(m => m.ReportsComponent),
  },
  {
    label: 'Configurações',
    path: 'configuracoes',
    icon: 'settings',
    roles: ['ADMIN', 'HOSPITAL', 'DOCTOR'],
    loadComponent: () => import('../../pages/settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    label: 'Componentes',
    path: 'componentes',
    icon: 'layout-dashboard',
    roles: ['ADMIN'],
    showInSidebar: false,
    loadComponent: () => import('../../pages/components-demo/components-demo.component').then(m => m.ComponentsDemoComponent),
  },
];

/** Fallback loader for items without a dedicated component */
export const TEMPLATE_PAGE_LOADER = templatePage;
