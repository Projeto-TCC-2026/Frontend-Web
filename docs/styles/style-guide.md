# Style Guide — Sistema de Monitoramento Pós-Cirúrgico

**Versão:** 1.0
**Escopo:** Web (Angular) e Mobile (React Native / Expo)
**Objetivo:** Padronizar identidade visual, componentes e tokens de design entre as duas plataformas do projeto.

---

## Sumário

1. [Princípios de design](#1-princípios-de-design)
2. [Paleta de cores](#2-paleta-de-cores)
3. [Cores funcionais / semânticas](#3-cores-funcionais--semânticas)
4. [Cores de texto](#4-cores-de-texto)
5. [Tipografia](#5-tipografia)
6. [Estados de input](#6-estados-de-input)
7. [Variantes de botão](#7-variantes-de-botão)
8. [Cards](#8-cards)
9. [Tokens consolidados (CSS/SCSS variables)](#9-tokens-consolidados)
10. [Acessibilidade e contraste](#10-acessibilidade-e-contraste)

---

## 1. Princípios de design

O sistema monitora pacientes em pós-operatório por meio de dispositivos vestíveis, com foco em **alertas automáticos**. A interface precisa priorizar:

| Princípio | Aplicação prática |
|---|---|
| **Triagem visual rápida** | Status clínico (estável/atenção/crítico) deve ser identificável sem leitura de texto — cor e posição fazem o trabalho primeiro. |
| **Precisão numérica** | Valores de sinais vitais usam fonte monoespaçada com números tabulares, para evitar ambiguidade de leitura em contexto de decisão clínica. |
| **Consistência entre plataformas** | Web e mobile compartilham os mesmos tokens de cor, tipografia e espaçamento — a implementação muda, o design system não. |
| **Confiança visual** | Paleta azul/aqua transmite estabilidade clínica e tecnologia, evitando o branco genérico de "app de hospital". |

---

## 2. Paleta de cores

Paleta primária definida para o projeto, com nomes semânticos para uso em código e documentação.

| Nome | Hex | RGB | Uso recomendado |
|---|---|---|---|
| `aqua-claro` | `#99D5E0` | rgb(153, 213, 224) | Destaques leves, background de ícones, elementos secundários de gráfico |
| `azul-primario` | `#0C4C8A` | rgb(12, 76, 138) | **Cor de marca.** Botões primários, links, ícones ativos, elementos de destaque |
| `azul-marinho` | `#1F375D` | rgb(31, 55, 93) | Headers, barra de navegação, superfícies escuras intermediárias |
| `aqua-suave` | `#AEDEDE` | rgb(174, 222, 222) | Backgrounds de seção, hover suave, estados "selecionado" leves |
| `azul-profundo` | `#142D54` | rgb(20, 45, 84) | Sidebar, títulos de maior hierarquia, footer, elementos de alto contraste |

> **Regra de uso:** a paleta primária (azul/aqua) é reservada para **identidade de marca e navegação** — nunca para comunicar status clínico. Status usa exclusivamente as cores funcionais da seção 3.

### Neutros (derivados, para texto e superfícies)

A paleta original não define neutros — foram derivados com leve tonalidade fria (dessaturação do azul-marinho) para manter coesão visual.

| Token | Hex | Uso |
|---|---|---|
| `neutro-900` | `#142230` | Texto de título, ícones de alto contraste |
| `neutro-700` | `#445468` | Texto de corpo/parágrafo |
| `neutro-500` | `#7C8DA1` | Texto secundário, descrições, placeholders |
| `neutro-300` | `#C3CDD6` | Texto inativo/desabilitado, bordas de input em repouso |
| `neutro-150` | `#E4E9ED` | Bordas de card, divisores |
| `neutro-100` | `#EEF2F5` | Backgrounds de superfície secundária, fundo de página |
| `branco` | `#FFFFFF` | Superfície de card, fundo padrão |

---

## 3. Cores funcionais / semânticas

Cores que comunicam **estado do sistema e estado clínico do paciente**. Cada uma tem uma variante "forte" (texto/ícone/borda) e uma variante "bg" (fundo suave, para badges e alertas).

| Estado | Token | Hex (forte) | Hex (bg) | Significado clínico |
|---|---|---|---|---|
| **Sucesso / Estável** | `sucesso` / `sucesso-bg` | `#2F9E6E` | `#E5F6EE` | Sinal vital dentro da faixa normal, ação concluída com sucesso, confirmação |
| **Atenção** | `atencao` / `atencao-bg` | `#E5A139` | `#FBF1DF` | Sinal vital se aproximando do limite, alerta de baixa prioridade, aviso não bloqueante |
| **Crítico** | `critico` / `critico-bg` | `#D9484B` | `#FBE7E7` | Alerta automático disparado — sinal vital fora da faixa segura, requer resposta imediata |
| **Informativo** | `info` / `info-bg` | `#2E77B8` | `#E7F1FA` | Mensagens neutras do sistema, tooltips, notificações não urgentes |
| **Desabilitado** | `desabilitado` / `desabilitado-bg` | `#B8C0C8` | `#F1F3F5` | Elementos inativos, funcionalidade bloqueada, campo não editável |

### Mapeamento de severidade de alerta (regra de negócio)

Como o projeto usa análise baseada em regras (rule-based) para sinais vitais, recomenda-se mapear diretamente os thresholds do SSM Parameter Store para essas cores:

```
faixa_normal        → sucesso   (#2F9E6E)
faixa_atencao        → atencao   (#E5A139)
faixa_critica        → critico   (#D9484B)
```

Isso garante que o mesmo vocabulário de cor usado no backend (nível de severidade do alerta) seja refletido 1:1 na UI, sem tradução ambígua entre times.

---

## 4. Cores de texto

Hierarquia de 4 níveis, todos testados para contraste mínimo AA sobre fundo branco/neutro-100 (ver seção 10).

| Nível | Token | Hex | Peso recomendado | Exemplo de uso |
|---|---|---|---|---|
| **Título** | `texto-titulo` | `#142230` (neutro-900) | 600–800 | H1, H2, H3, nomes de paciente em destaque |
| **Parágrafo** | `texto-paragrafo` | `#445468` (neutro-700) | 400–500 | Corpo de texto, descrições longas, conteúdo de tabela |
| **Descrição / Secundário** | `texto-secundario` | `#7C8DA1` (neutro-500) | 400–500 | Timestamps, legendas, texto de apoio, placeholder |
| **Inativo / Desabilitado** | `texto-inativo` | `#C3CDD6` (neutro-300) | 400 | Texto de campos desabilitados, itens de menu bloqueados |

---

## 5. Tipografia

Três famílias, cada uma com papel funcional específico — a escolha não é estética, é orientada por caso de uso clínico.

### 5.1 Famílias

| Família | Papel | Justificativa |
|---|---|---|
| **Manrope** (700/800) | Display — títulos, navegação, nomes de seção | Geométrica e com peso forte, dá identidade de marca sem soar "corporativo genérico". Boa legibilidade em headings grandes. |
| **Inter** (400/500/600) | Corpo — texto de interface, formulários, botões | Desenhada especificamente para telas; excelente legibilidade em tamanhos pequenos (12–16px), amplamente suportada em Angular e React Native. |
| **IBM Plex Mono** (500/600) | Dados — valores de sinais vitais, timestamps, códigos | Números tabulares monoespaçados: essencial para leitura rápida e não-ambígua de BPM, SpO2, pressão arterial — o mesmo princípio usado em displays de monitores hospitalares reais. |

Todas open-source, disponíveis via Google Fonts — sem custo de licenciamento (relevante dado o constraint de custo zero do projeto).

### 5.2 Escala tipográfica

| Estilo | Família | Peso | Tamanho / Altura de linha | Uso |
|---|---|---|---|---|
| H1 | Manrope | 800 | 32px / 40px | Título de página |
| H2 | Manrope | 700 | 24px / 32px | Título de seção |
| H3 | Manrope | 600 | 20px / 28px | Subtítulo, título de card |
| Body Large | Inter | 400 | 16px / 24px | Texto corrido principal |
| Body | Inter | 400 | 14px / 20px | Texto padrão de UI, formulários |
| Caption | Inter | 500 | 12px / 16px, uppercase, letter-spacing 0.06em | Legendas, labels de campo, timestamps |
| Data XL | IBM Plex Mono | 600 | 44px / 48px | Sinal vital em destaque (hero do dashboard) |
| Data MD | IBM Plex Mono | 600 | 22px / 28px | Sinal vital em card de paciente |
| Data SM | IBM Plex Mono | 500 | 13px / 18px | Timestamps, IDs de dispositivo, código de paciente |

### 5.3 Import (web)

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
```

### 5.4 React Native

```bash
npx expo install expo-font @expo-google-fonts/manrope @expo-google-fonts/inter @expo-google-fonts/ibm-plex-mono
```

---

## 6. Estados de input

Todos os inputs seguem o mesmo padrão de comportamento — consistência é o que permite o usuário aprender o sistema uma vez e reconhecer em qualquer tela.

| Estado | Borda | Background | Comportamento |
|---|---|---|---|
| **Default** | `neutro-300` (1.5px) | branco | Repouso, sem interação |
| **Hover** (web) | `neutro-500` | branco | Leve escurecimento da borda, cursor pointer |
| **Foco** | `azul-primario` (1.5px) + glow `rgba(12,76,138,0.14)` 3px | branco | Ao clicar/tabular para o campo. Transição 150ms |
| **Preenchido** | `neutro-300` | branco | Valor válido digitado, sem erro |
| **Desabilitado** | `neutro-150` | `desabilitado-bg` (#F1F3F5) | Texto em `neutro-500`, cursor `not-allowed`, sem interação |
| **Erro** | `critico` (1.5px) | branco | Ativado por validação falha. Helper text abaixo em `critico`, com ícone ⚠ |
| **Sucesso / Validado** | `sucesso` (1.5px) | branco | Ativado após validação positiva (ex: telefone confirmado). Helper text em `sucesso` com ícone ✓ |

### Regras de comportamento

- **Transição:** todas as mudanças de estado (borda, background, glow) usam `transition: 150ms ease`.
- **Erro é reativo, não proativo:** o estado de erro só aparece após o campo perder o foco (`blur`) ou após tentativa de submit — nunca enquanto o usuário ainda está digitando a primeira vez.
- **Helper text muda de função conforme o estado:** em repouso, é uma dica (`neutro-500`); em erro, é a mensagem do que corrigir (`critico`); em sucesso, é uma confirmação (`sucesso`).
- **Placeholder** sempre em `neutro-500`, nunca em `neutro-300` (contraste insuficiente).
- **Inputs numéricos de dados clínicos** (ex: threshold de frequência cardíaca) usam a fonte `IBM Plex Mono` para o valor digitado, mesmo que o label esteja em Inter.

---

## 7. Variantes de botão

Hierarquia de 5 tipos, pensada para que ações de consequência clínica (ex: encerrar monitoramento) sejam visualmente distintas de ações neutras.

| Variante | Background | Texto | Uso |
|---|---|---|---|
| **Primary** | `azul-primario` | branco | Ação principal da tela (salvar, confirmar, avançar) |
| **Secondary** | branco, borda `azul-primario` 1.5px | `azul-primario` | Ação alternativa (cancelar, voltar) |
| **Ghost / Texto** | transparente | `azul-primario` | Ações terciárias, links de ação dentro de listas/tabelas |
| **Destrutivo** | `critico` | branco | Ações irreversíveis ou de alto impacto clínico (encerrar monitoramento, remover paciente) |
| **Confirmação positiva** | `sucesso` | branco | Ações de confirmação clínica positiva (confirmar alta, marcar como resolvido) |

### Estados por variante

| Estado | Comportamento |
|---|---|
| **Default** | Cor base da variante |
| **Hover** (web) | Escurece a cor base em ~8–10% (ex: `azul-primario` → `#0A3F72`) |
| **Active/Pressed** | Escurece mais um nível (ex: `#083058`), sem movimento/scale — evita jank em telas de monitoramento |
| **Processando (loading)** | Opacidade 85%, ícone de spinner (14px, borda 2px, animação de rotação 700ms linear) à esquerda do texto, texto muda para verbo no gerúndio ("Salvando...") — botão fica com `pointer-events: none` |
| **Desabilitado** | Background muda para `desabilitado` (#B8C0C8), texto branco mantido, `cursor: not-allowed`, sem hover/active |

### Regras de copy (texto do botão)

- Verbo no infinitivo/imperativo, nunca genérico: **"Salvar alterações"**, não "Enviar" ou "OK"
- O nome da ação se mantém do botão até a confirmação: se o botão diz "Encerrar monitoramento", a mensagem de sucesso deve dizer "Monitoramento encerrado", não "Operação concluída"
- Botões destrutivos sempre pedem confirmação em modal antes de executar — nunca disparam a ação diretamente no clique

---

## 8. Cards

O card de paciente é o componente central do dashboard clínico.

### Anatomia

```
┌─ borda esquerda 4px (cor de status) ──────────┐
│  Nome do paciente          [Status Pill]      │
│  Leito · Dia pós-operatório                   │
│                                                │
│  BPM        SpO2                              │
│  78         98%                               │
└────────────────────────────────────────────────┘
```

| Elemento | Especificação |
|---|---|
| **Container** | `border-radius: 14px`, `border: 1px solid neutro-150`, background branco |
| **Borda de status** | `border-left: 4px solid` — cor conforme severidade (sucesso/atencao/critico) |
| **Nome do paciente** | Manrope 700, 15px, `neutro-900` |
| **Metadado (leito/dia)** | Inter 400, 11.5px, `neutro-500` |
| **Status pill** | Badge com bg suave + texto forte da cor semântica correspondente, uppercase, `IBM Plex Mono` 10px |
| **Valores de sinais vitais** | `IBM Plex Mono` 600, 22px — cor muda para `critico` automaticamente se o valor estiver fora da faixa seletiva daquele paciente |
| **Unidade (bpm/%)** | Inter 500, 11px, `neutro-500`, ao lado do valor |

### Regra de cor condicional

O valor numérico do sinal vital **herda a cor semântica do status geral do paciente apenas quando aquele sinal específico é o motivo do alerta** — evita que todos os números fiquem vermelhos quando só um está fora da faixa, preservando a precisão da triagem visual.

---

## 9. Tokens consolidados

Pronto para copiar como CSS custom properties (web) ou objeto JS (React Native / Styled Components).

```css
:root {
  /* Paleta primária */
  --color-aqua-claro: #99D5E0;
  --color-azul-primario: #0C4C8A;
  --color-azul-marinho: #1F375D;
  --color-aqua-suave: #AEDEDE;
  --color-azul-profundo: #142D54;

  /* Neutros */
  --color-neutro-900: #142230;
  --color-neutro-700: #445468;
  --color-neutro-500: #7C8DA1;
  --color-neutro-300: #C3CDD6;
  --color-neutro-150: #E4E9ED;
  --color-neutro-100: #EEF2F5;
  --color-branco: #FFFFFF;

  /* Semânticas */
  --color-sucesso: #2F9E6E;
  --color-sucesso-bg: #E5F6EE;
  --color-atencao: #E5A139;
  --color-atencao-bg: #FBF1DF;
  --color-critico: #D9484B;
  --color-critico-bg: #FBE7E7;
  --color-info: #2E77B8;
  --color-info-bg: #E7F1FA;
  --color-desabilitado: #B8C0C8;
  --color-desabilitado-bg: #F1F3F5;

  /* Tipografia */
  --font-display: 'Manrope', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-data: 'IBM Plex Mono', monospace;

  /* Raio de borda */
  --radius-sm: 9px;
  --radius-md: 12px;
  --radius-lg: 14px;

  /* Transição padrão */
  --transition-default: 150ms ease;
}
```

```javascript
// tokens.js — para uso em React Native / Styled Components
export const colors = {
  aquaClaro: '#99D5E0',
  azulPrimario: '#0C4C8A',
  azulMarinho: '#1F375D',
  aquaSuave: '#AEDEDE',
  azulProfundo: '#142D54',

  neutro900: '#142230',
  neutro700: '#445468',
  neutro500: '#7C8DA1',
  neutro300: '#C3CDD6',
  neutro150: '#E4E9ED',
  neutro100: '#EEF2F5',
  branco: '#FFFFFF',

  sucesso: '#2F9E6E',
  sucessoBg: '#E5F6EE',
  atencao: '#E5A139',
  atencaoBg: '#FBF1DF',
  critico: '#D9484B',
  criticoBg: '#FBE7E7',
  info: '#2E77B8',
  infoBg: '#E7F1FA',
  desabilitado: '#B8C0C8',
  desabilitadoBg: '#F1F3F5',
};

export const fonts = {
  display: 'Manrope',
  body: 'Inter',
  data: 'IBMPlexMono',
};
```

---

## 10. Acessibilidade e contraste

Verificação de contraste (WCAG 2.1) para as combinações de texto mais usadas:

| Combinação | Contraste aproximado | Nível WCAG | Observação |
|---|---|---|---|
| `neutro-900` sobre branco | ~15:1 | AAA | Uso livre em qualquer tamanho |
| `neutro-700` sobre branco | ~8:1 | AAA | Uso livre em qualquer tamanho |
| `neutro-500` sobre branco | ~4.6:1 | AA (texto normal) | Adequado para texto ≥14px; evitar em texto abaixo de 12px |
| `azul-primario` sobre branco | ~7.3:1 | AAA | Seguro para links e botões secundários |
| Branco sobre `azul-primario` | ~7.3:1 | AAA | Seguro para botões primários |
| Branco sobre `critico` | ~4.9:1 | AA | Adequado para botões; evitar texto pequeno (<14px) em cima |
| `aqua-claro` sobre branco | ~1.6:1 | **Falha** | **Nunca usar para texto** — apenas background/decoração |
| `neutro-300` sobre branco | ~1.9:1 | **Falha** | Reservado para texto inativo/desabilitado, nunca para conteúdo ativo |

### Recomendações adicionais

- Nunca comunicar status **apenas por cor** — sempre acompanhar de texto (badge "Crítico") ou ícone, para usuários com daltonismo.
- Manter foco visível (outline/glow) em todos os elementos interativos — obrigatório para navegação por teclado no dashboard web.
- Em mobile, alvo de toque mínimo de 44×44px para todos os botões, especialmente os destrutivos (evitar toque acidental).

---

*Documento vivo — deve ser atualizado junto ao repositório do projeto conforme novos componentes forem definidos (modais, tabelas, gráficos de série temporal).*
