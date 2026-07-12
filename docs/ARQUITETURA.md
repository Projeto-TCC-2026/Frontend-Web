# Arquitetura — Frontend Web (RecuperaSaúde)

Portal web para profissionais de saúde (médicos/admins) monitorarem pacientes em recuperação pós-cirúrgica. Angular 17 standalone, Tailwind v4 para estilo e Angular CDK para comportamento.

## Decisões-chave

| Decisão | Escolha |
|---|---|
| Componentes | **Standalone** — sem NgModules |
| Estilo | **Tailwind v4** (utilities no template) + tokens de marca em CSS custom properties |
| Comportamento acessível | **Angular CDK** (overlay, focus-trap) — **sem Angular Material** |
| Formato de estilo dos componentes | **SCSS** (quando há arquivo); `src/styles.css` fica CSS puro (PostCSS/Tailwind) |
| Acesso à API | **`ApiService`** fino e tipado como ponto único |
| Erros | Interceptor com política (401 refresh / 403→/403 / 4xx→caller / 5xx→toast) + `NotificationService` (toast CDK) + `ErrorHandler` global |
| Rotas | Públicas fora do shell; app autenticado dentro do `MainLayout` com `authGuard` na rota-pai e lazy loading nas filhas |

## Estrutura de pastas

```
src/app/
├── app.component.{ts,html}     # Raiz — apenas <router-outlet>
├── app.config.ts               # Providers (router, http + interceptors, ErrorHandler)
├── app.routes.ts               # Rotas geradas a partir de NAV_ITEMS
│
├── core/                       # Singletons e infra transversal (sem UI)
│   ├── config/
│   │   └── navigation.config.ts    # NAV_ITEMS — fonte única de navegação
│   ├── errors/
│   │   └── global-error-handler.ts # ErrorHandler global (JS não tratado)
│   ├── guards/
│   │   ├── auth.guard.ts            # Exige autenticação
│   │   └── role.guard.ts            # Exige papel (lê route.data.roles)
│   ├── interceptors/
│   │   ├── auth.interceptor.ts      # Injeta token, refresh no 401
│   │   └── error.interceptor.ts     # Política de erros
│   ├── models/
│   │   ├── dtos/                    # Contratos de request/response da API
│   │   └── entities/                # Modelos de domínio (UserProfile, UserRole)
│   └── services/
│       ├── api.service.ts           # Ponto único de acesso à API
│       ├── auth.service.ts          # Login, refresh, sessão, papel
│       ├── dialog.service.ts        # Confirms programáticos
│       └── notification.service.ts  # Toasts via CDK Overlay
│
├── layout/                     # Shell do app autenticado
│   ├── main-layout/                # Compõe sidebar + header + breadcrumb + outlet + footer
│   ├── sidebar/                    # Menu por papel (consome NAV_ITEMS)
│   ├── header/                     # Avatar, nome, papel, logout
│   ├── breadcrumb/                 # Gerado de route.data.breadcrumb
│   └── footer/
│
├── pages/                      # Telas de feature (uma pasta por rota)
│   ├── _template/                  # MODELO — copie para criar uma nova tela
│   ├── home/ login/ cadastro/ forbidden/   # Páginas públicas
│   ├── dashboard/                  # Tela autenticada
│   └── components-demo/            # Vitrine dos componentes reutilizáveis
│
└── shared/                     # Reutilizável entre features
    └── components/
        ├── button/ input/ card/ loading/ empty-state/   # Presentacionais
        ├── dialog/ confirm-dialog/ data-table/           # Comportamentais (CDK)
        └── toast/                                        # Container de toasts
```

**Regra de dependência:** `pages` e `layout` dependem de `core` e `shared`. `core` e `shared` **não** dependem de `pages`. `core` não tem UI; `shared` não tem estado global.

## Navegação — fonte única

`core/config/navigation.config.ts` define `NAV_ITEMS`. É consumido por:

- **`app.routes.ts`** — gera as rotas filhas de `/app` com breadcrumb, `roles`, `roleGuard` e lazy loading.
- **`SidebarComponent`** — renderiza o menu filtrado pelo papel do usuário.

Adicionar/remover uma tela = editar um único array. Ver "Como criar uma nova tela" abaixo.

## Camada de estilo

- Paleta, tipografia (Manrope/Inter/IBM Plex Mono) e radius vivem em `src/styles.css` como CSS custom properties dentro de `@theme` (Tailwind v4) e `:root`.
- Componentes usam utilities do Tailwind no template; cores via `bg-[var(--color-*)]` ou utilities de marca (`bg-brand-primary`, `font-heading`, etc.).
- Regras completas do design system: `docs/styles/style-guide.md`.

## Política de erros

O `error.interceptor` aplica:

- **401** → fluxo de refresh do `auth.interceptor` (transparente).
- **403** → redireciona para `/403`.
- **400–422** (validação) → re-lançado para o chamador tratar inline no formulário.
- **500 / rede / inesperado** → toast genérico via `NotificationService`.

Erros de JS não tratados caem no `GlobalErrorHandler` (que ignora `HttpErrorResponse` para não duplicar toast).

---

## Como criar uma nova tela

1. **Copie a pasta modelo:**
   `pages/_template/` → `pages/pacientes/`, renomeie os arquivos (`template-page` → `pacientes`).

2. **Ajuste o componente:**
   ```ts
   @Component({
     selector: 'app-pacientes',
     standalone: true,
     imports: [/* componentes de shared/ que usar */],
     templateUrl: './pacientes.component.html',
   })
   export class PacientesComponent {}
   ```

3. **Registre em `NAV_ITEMS`** (`core/config/navigation.config.ts`):
   ```ts
   {
     label: 'Pacientes',
     path: 'pacientes',
     icon: 'users',                 // nome do ícone Lucide em kebab-case
     roles: ['ADMIN', 'DOCTOR'],
     loadComponent: () =>
       import('../../pages/pacientes/pacientes.component')
         .then(m => m.PacientesComponent),
   }
   ```
   - A rota `/app/pacientes` é gerada automaticamente (com `roleGuard`, breadcrumb e lazy loading).
   - O item aparece na sidebar para os papéis listados.
   - Sem `loadComponent`, cai no `TemplatePageComponent` (placeholder).
   - Com `showInSidebar: false`, a rota existe mas não aparece no menu.

4. **Se o ícone for novo**, importe o componente Lucide correspondente no `SidebarComponent` e adicione o `@case` no template (`sidebar.component.html`).

Pronto — sem tocar em `app.routes.ts`.
