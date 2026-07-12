# Guia de Componentes Reutilizáveis

Todos são **standalone** (importe direto no `imports` do seu componente), estilizados com Tailwind + tokens de marca. Vitrine ao vivo em `/app/componentes`.

Import base:
```ts
import { ButtonComponent } from '../../shared/components/button/button.component';
// ... e assim por diante
```

---

## Presentacionais

### Button — `<app-button>`

| Input | Tipo | Default | Descrição |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'destructive' \| 'success'` | `'primary'` | Estilo visual |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Tipo HTML |
| `disabled` | `boolean` | `false` | Desabilita |
| `loading` | `boolean` | `false` | Mostra spinner + `loadingText` |
| `loadingText` | `string` | `'Processando...'` | Texto durante loading |
| `fullWidth` | `boolean` | `false` | Ocupa 100% da largura |

| Output | Payload | Descrição |
|---|---|---|
| `clicked` | `MouseEvent` | Emitido ao clicar (não dispara se disabled/loading) |

```html
<app-button variant="destructive" (clicked)="excluir()">Excluir</app-button>
<app-button variant="primary" [loading]="salvando()">Salvar</app-button>
```

### Input — `<app-input>`

Implementa `ControlValueAccessor` — funciona com `formControl`, `formControlName` e `ngModel`.

| Input | Tipo | Default | Descrição |
|---|---|---|---|
| `label` | `string` | `''` | Rótulo acima do campo |
| `placeholder` | `string` | `''` | Placeholder |
| `type` | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'url'` | `'text'` | Tipo do input |
| `state` | `'default' \| 'error' \| 'success'` | `'default'` | Estado visual |
| `helperText` | `string` | `''` | Texto de apoio (cor segue o `state`) |
| `required` | `boolean` | `false` | Mostra asterisco no label |
| `disabled` | `boolean` | `false` | Desabilita (bg cinza + cursor not-allowed) |

```html
<app-input label="E-mail" type="email" [formControl]="emailCtrl"
           state="error" helperText="E-mail inválido"></app-input>
```

### Card — `<app-card>`

Container com content projection.

| Input | Tipo | Default | Descrição |
|---|---|---|---|
| `title` | `string` | `''` | Título opcional |
| `subtitle` | `string` | `''` | Subtítulo opcional |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Espaçamento interno |
| `bordered` | `boolean` | `true` | Mostra borda |

```html
<app-card title="Sinais vitais" subtitle="Últimas 24h">
  <!-- conteúdo -->
</app-card>
```

### Loading — `<app-loading>`

| Input | Tipo | Default | Descrição |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho do spinner |
| `text` | `string` | `''` | Texto opcional abaixo |
| `fullPage` | `boolean` | `false` | Centraliza em `min-h-[50vh]` |

```html
<app-loading size="lg" text="Carregando pacientes..." [fullPage]="true"></app-loading>
```

### Empty State — `<app-empty-state>`

| Input | Tipo | Default | Descrição |
|---|---|---|---|
| `title` | `string` | `'Nenhum item encontrado'` | Título |
| `description` | `string` | `''` | Descrição opcional |

Aceita `<ng-content>` para uma ação (ex.: botão).

```html
<app-empty-state title="Sem pacientes" description="Adicione um para começar.">
  <app-button variant="primary" size="sm">Adicionar</app-button>
</app-empty-state>
```

---

## Comportamentais (CDK)

### Dialog — `<app-dialog>`

Modal sobre CDK com focus-trap; fecha por ESC e clique no backdrop.

| Input | Tipo | Default | Descrição |
|---|---|---|---|
| `open` | `boolean` | `false` | Controla visibilidade |
| `title` | `string` | `''` | Título no header |
| `closable` | `boolean` | `true` | Mostra X e permite fechar por ESC/backdrop |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Largura máxima |

| Output | Descrição |
|---|---|
| `closed` | Emitido ao fechar |

Use o atributo `dialogActions` para projetar o rodapé.

```html
<app-dialog [open]="aberto()" title="Novo agendamento" (closed)="aberto.set(false)">
  <p>Conteúdo do dialog.</p>
  <div dialogActions>
    <app-button variant="ghost" size="sm" (clicked)="aberto.set(false)">Cancelar</app-button>
    <app-button variant="primary" size="sm" (clicked)="salvar()">Salvar</app-button>
  </div>
</app-dialog>
```

### DialogService (confirm programático)

Para confirmações rápidas sem montar template. Requer `<app-confirm-dialog>` montado uma vez (ex.: na demo/shell).

```ts
private dialog = inject(DialogService);

async excluir() {
  const ok = await this.dialog.confirm({
    title: 'Excluir paciente?',
    message: 'Esta ação não pode ser desfeita.',
    confirmLabel: 'Excluir',
    cancelLabel: 'Cancelar',
    variant: 'destructive',
  });
  if (ok) { /* ... */ }
}
```

### Data Table — `<app-data-table>`

Tabela com colunas configuráveis e paginação client-side.

| Input | Tipo | Default | Descrição |
|---|---|---|---|
| `columns` | `TableColumn[]` | `[]` | Definição das colunas |
| `data` | `any[]` | `[]` | Linhas |
| `pageSize` | `number` | `10` | Itens por página |

| Output | Payload | Descrição |
|---|---|---|
| `pageChange` | `PageEvent` | Emitido ao trocar de página |

```ts
columns: TableColumn[] = [
  { key: 'name', label: 'Paciente' },
  { key: 'age', label: 'Idade', format: (v) => `${v} anos` },
];
```
```html
<app-data-table [columns]="columns" [data]="pacientes" [pageSize]="5"></app-data-table>
```

---

## Notificações (Toast)

`NotificationService` (`core/services/`) renderiza toasts via CDK Overlay com auto-dismiss.

```ts
private notify = inject(NotificationService);

this.notify.success('Paciente salvo!');
this.notify.error('Falha ao salvar.');     // dismiss em 6s
this.notify.warning('Reveja os campos.');
this.notify.info('Sincronizando...');       // dismiss em 4s
```

Erros HTTP 5xx/rede já disparam toast automaticamente pelo `error.interceptor` — não precisa chamar manualmente.
