import { Routes, Route } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { NAV_ITEMS } from './core/config/navigation.config';

/**
 * Maps each NavItem to a lazy-loaded child route.
 * Dashboard gets its own component; the rest use the template placeholder.
 */
function buildChildRoutes(): Route[] {
  return NAV_ITEMS.map(item => ({
    path: item.path,
    data: { breadcrumb: item.label, roles: item.roles },
    canActivate: [roleGuard],
    loadComponent: item.path === 'dashboard'
      ? () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      : () => import('./pages/_template/template-page.component').then(m => m.TemplatePageComponent),
  }));
}

export const routes: Routes = [
  // ─── Public routes (outside shell) ───────────────────────────
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: '403', component: ForbiddenComponent },

  // ─── Authenticated routes (inside MainLayout shell) ──────────
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      ...buildChildRoutes(),
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ─── Wildcard ────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
