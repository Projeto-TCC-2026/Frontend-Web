import { Routes, Route } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { NAV_ITEMS, TEMPLATE_PAGE_LOADER } from './core/config/navigation.config';

function buildChildRoutes(): Route[] {
  return NAV_ITEMS.map(item => ({
    path: item.path,
    data: { breadcrumb: item.label, roles: item.roles },
    canActivate: [roleGuard],
    loadComponent: item.loadComponent ?? TEMPLATE_PAGE_LOADER,
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
