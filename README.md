# Recupera Saúde 🏥

Portal web para profissionais de saúde (médicos e administradores) acompanharem pacientes em recuperação pós-cirúrgica. Trabalho de Conclusão de Curso (TCC) 2026.

Gerado com [Angular CLI](https://github.com/angular/angular-cli) 17.3, arquitetura **standalone** (sem NgModules), **Tailwind v4** para estilo e **Angular CDK** para comportamento acessível.

## 🚀 Servidor de Desenvolvimento

```bash
ng serve
```
Navegue para `http://localhost:4200/`. Recarrega automaticamente ao alterar arquivos fonte.

## 📦 Build

```bash
ng build          # build de desenvolvimento
ng build --configuration production
```
Artefatos em `dist/recupera-saude`.

## 🛠️ Tecnologias

- **Angular 17.3** (standalone components)
- **TypeScript 5.4**
- **Tailwind CSS v4** (+ tokens de marca em CSS custom properties)
- **Angular CDK** (overlay, focus-trap)
- **@lucide/angular** (ícones)
- Autenticação JWT com interceptor funcional (refresh no 401)

## 📁 Estrutura resumida

```
src/app/
├── core/       # Serviços, guards, interceptors, models, config (infra sem UI)
├── layout/     # Shell autenticado: sidebar, header, breadcrumb, footer
├── pages/      # Telas de feature (uma pasta por rota) + _template modelo
└── shared/     # Componentes reutilizáveis (button, input, dialog, data-table, ...)
```

## 📚 Documentação

- **[docs/ARQUITETURA.md](docs/ARQUITETURA.md)** - estrutura de pastas, decisões de arquitetura, política de erros e **como criar uma nova tela**.
- **[docs/COMPONENTES.md](docs/COMPONENTES.md)** - guia de uso (API) de cada componente reutilizável.
- **[docs/styles/style-guide.md](docs/styles/style-guide.md)** - design system: paleta, tipografia, componentes.

Vitrine ao vivo dos componentes: rota `/app/componentes` (autenticado).

## 👥 Equipe

Projeto TCC 2026 - Frontend Web
