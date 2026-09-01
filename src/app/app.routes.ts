import { Routes, Route } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
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
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: '403', component: ForbiddenComponent },

  // ─── Authenticated routes (inside MainLayout shell) ──────────
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      ...buildChildRoutes(),
      {
        path: 'configuracoes/editar-conta',
        data: { breadcrumb: 'Editar conta' },
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/settings/edit-account/edit-account.component').then(
            m => m.EditAccountComponent
          ),
      },
      {
        path: 'configuracoes/termos-privacidade',
        data: { breadcrumb: 'Termos de Privacidade' },
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/settings/privacy-terms/privacy-terms.component').then(
            m => m.PrivacyTermsComponent
          ),
      },
      {
        path: 'configuracoes/sobre-nos',
        data: { breadcrumb: 'Sobre nós' },
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/settings/about-us/about-us.component').then(
            m => m.AboutUsComponent
          ),
      },
      {
        path: 'configuracoes/redefinir-senha',
        data: { breadcrumb: 'Redefinir senha' },
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/settings/change-password/change-password.component').then(
            m => m.ChangePasswordComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ─── Wildcard ────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
