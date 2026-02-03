<p align="center">
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A520.0.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Claude-Agent_SDK-7C3AED?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude Agent SDK">
  <img src="https://img.shields.io/badge/MCP-1.25+-E34F26?style=for-the-badge&logo=data:image/svg+xml;base64,&logoColor=white" alt="MCP">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/badge/Version-0.1.0-blue?style=for-the-badge" alt="Version">
</p>

<h1 align="center">fama-agents</h1>

<p align="center">
  <strong>Framework modular de agentes de IA para automação de fluxos de desenvolvimento de software</strong>
</p>

<p align="center">
  Orquestra <strong>14 agentes especializados</strong> com <strong>15 skills reutilizáveis</strong> e um <strong>workflow engine PREVEC</strong> de 5 fases,<br>
  conectando planejamento, revisão, execução, validação e confirmação em um pipeline coeso.
</p>

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Início Rápido](#início-rápido)
- [CLI — Referência Completa](#cli--referência-completa)
- [Agentes](#agentes)
- [Skills](#skills)
- [Workflow Engine PREVEC](#workflow-engine-prevec)
- [Workflow Templates](#workflow-templates)
- [Multi-Agent Party](#multi-agent-party)
- [Servidor MCP](#servidor-mcp)
- [Exportação para Outras Ferramentas](#exportação-para-outras-ferramentas)
- [Análise Semântica de Codebase](#análise-semântica-de-codebase)
- [Scaffold de Documentação](#scaffold-de-documentação)
- [Sistema de Módulos](#sistema-de-módulos)
- [Provedores LLM](#provedores-llm)
- [Configuração](#configuração)
- [API Programática](#api-programática)
- [Testes](#testes)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Visão Geral

O **fama-agents** é um framework completo que transforma tarefas de engenharia de software em fluxos automatizados e inteligentes. Em vez de um único agente genérico, o sistema delega cada fase do trabalho a agentes com personas, ferramentas e skills específicos para o contexto.

### Diferenciais

| Capacidade | Descrição |
|---|---|
| **Agentes com persona** | Cada agente possui identidade, ferramentas e comportamento distintos definidos em Markdown |
| **Skills em 3 camadas** | Sumários (L1), conteúdo completo (L2) e referências auxiliares (L3) com lazy-loading |
| **PREVEC Engine** | Pipeline de 5 fases com quality gates configuráveis entre etapas |
| **Auto-seleção** | Detecção automática de escala da tarefa e seleção do agente ideal |
| **Multi-provider** | Suporte a Claude, OpenAI e OpenRouter com fallback chain |
| **MCP nativo** | Servidor Model Context Protocol integrado para uso com editores e IDEs |
| **Exportação** | Geração de configuração para Cursor, Windsurf, Copilot e Claude Desktop |
| **Internacionalização** | Suporte a Inglês e Português (pt-BR) |
| **Extensível** | Sistema de módulos para adicionar agentes, skills e workflows customizados |

---

## Arquitetura

```
                          ┌─────────────┐
                          │   CLI (fama) │
                          └──────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
     ┌────────▼───────┐  ┌──────▼──────┐  ┌────────▼────────┐
     │ Agent Registry  │  │Skill Registry│  │ Workflow Engine  │
     │  (14 agentes)   │  │ (15 skills)  │  │   (PREVEC)       │
     └────────┬───────┘  └──────┬──────┘  └────────┬────────┘
              │                  │                   │
     ┌────────▼───────┐  ┌──────▼──────┐  ┌────────▼────────┐
     │   Playbooks     │  │  SKILL.md   │  │  Quality Gates   │
     │  (.md + YAML)   │  │ + references │  │  (4 built-in)    │
     └────────┬───────┘  └─────────────┘  └─────────────────┘
              │
     ┌────────▼───────┐
     │  LLM Provider   │
     │ Claude │ OpenAI  │
     │   OpenRouter     │
     └─────────────────┘
```

### Fluxo de Execução

1. **Resolução** — O `AgentRegistry` localiza o agente pelo slug (ou auto-seleciona via keywords)
2. **Composição** — Skills do agente + skills solicitadas são coletadas do `SkillRegistry`
3. **Construção** — System prompt = playbook + skills + persona + memória sidecar
4. **Provider** — LLM é resolvido com fallback chain (primário → secundário → terciário)
5. **Execução** — Query é transmitida via streaming com retry (3 tentativas, backoff exponencial)
6. **Métricas** — Eventos emitidos com custo, duração e turnos consumidos

---

## Instalação

### Pré-requisitos

- **Node.js** >= 20.0.0
- **npm** ou **pnpm**
- **Chave da API Anthropic** (obrigatória para Claude; OpenAI/OpenRouter opcionais)

### Setup

```bash
# Clone o repositório
git clone https://github.com/renatinhosfaria/fama-agents.git
cd fama-agents

# Instale as dependências
npm install

# Configure a variável de ambiente
cp .env.example .env
# Edite o .env e adicione sua ANTHROPIC_API_KEY

# Build
npm run build

# (Opcional) Instalar globalmente
npm link
```

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sim | Chave da API Anthropic |
| `FAMA_MODEL` | Não | Modelo padrão (default: `sonnet`) |
| `FAMA_MAX_TURNS` | Não | Máximo de turnos por execução (default: `50`) |
| `FAMA_LANG` | Não | Idioma (`en`, `pt-BR`) |

---

## Início Rápido

```bash
# Executar tarefa com auto-seleção de agente
fama run "implementar endpoint de autenticação OAuth2"

# Tarefa rápida (escala small, mínima cerimônia)
fama quick "corrigir bug no cálculo de frete"

# Criar plano de implementação
fama plan "sistema de notificações push"

# Revisar código com modo adversarial
fama review ./src --validate

# Debugging sistemático
fama debug "usuários não conseguem fazer login após atualização"

# Discussão multi-agente
fama party "qual arquitetura para o sistema de cache?" \
  --agents architect,backend-specialist,performance-optimizer \
  --rounds 3
```

---

## CLI — Referência Completa

### Comandos de Execução

| Comando | Descrição |
|---|---|
| `fama run <task>` | Executa um agente em uma tarefa (auto-seleção se `--agent` não for informado) |
| `fama quick <task>` | Execução rápida para tarefas de escala QUICK/SMALL |
| `fama plan <description>` | Cria ou executa um plano de implementação |
| `fama review [path]` | Revisão de código (`--validate` para modo adversarial) |
| `fama debug <description>` | Sessão de debugging sistemático |

### Comandos de Workflow

| Comando | Descrição |
|---|---|
| `fama workflow init <name>` | Inicializa um workflow PREVEC |
| `fama workflow status` | Exibe status do workflow atual |
| `fama workflow run <task>` | Executa agente na fase atual |
| `fama workflow complete` | Marca fase atual como completa |
| `fama workflow advance` | Avança para a próxima fase |
| `fama workflow exec <template>` | Executa um template de workflow step-by-step |
| `fama workflow list-templates` | Lista templates de workflow disponíveis |

### Comandos de Consulta

| Comando | Descrição |
|---|---|
| `fama agents list` | Lista todos os agentes |
| `fama agents show <slug>` | Exibe detalhes de um agente |
| `fama agents menu <slug>` | Exibe comandos do menu do agente |
| `fama skills list` | Lista todas as skills |
| `fama skills show <slug>` | Exibe conteúdo de uma skill |
| `fama teams list` | Lista times configurados |
| `fama teams show <name>` | Exibe detalhes de um time |

### Comandos de Análise

| Comando | Descrição |
|---|---|
| `fama stack` | Detecta o tech stack do projeto |
| `fama analyze` | Analisa a arquitetura do codebase |
| `fama fill` | Exibe/preenche documentação scaffold |

### Comandos de Infraestrutura

| Comando | Descrição |
|---|---|
| `fama export` | Exporta configuração para ferramentas de IA (`--preset cursor\|windsurf\|copilot\|claude-desktop\|agents-md\|all`) |
| `fama module list` | Lista módulos instalados |
| `fama module install <source>` | Instala um módulo |
| `fama module uninstall <name>` | Remove um módulo |
| `fama init` | Inicializa um projeto fama interativamente |
| `fama mcp` | Inicia o servidor MCP (stdio) |
| `fama completions <shell>` | Gera script de auto-complete (bash/zsh/fish) |

---

## Agentes

O sistema possui 14 agentes especializados. Cada agente é definido por dois artefatos:

- **Playbook** (`agents/<slug>.md`) — Documento Markdown com YAML frontmatter contendo persona, tools, fases PREVEC e skills padrão
- **Factory** (`src/agents/<slug>.ts`) — Classe TypeScript com método `build()` que gera a definição programática

| Agente | Fases PREVEC | Skills Padrão | Ferramentas |
|---|---|---|---|
| **architect** | P, R | brainstorming, feature-breakdown | Read, Grep, Glob |
| **backend-specialist** | E | — | Read, Grep, Glob |
| **bug-fixer** | E | systematic-debugging | Read, Grep, Glob |
| **code-reviewer** | R, V | code-review | Read, Grep, Glob |
| **database-specialist** | E | — | Read, Grep, Glob |
| **devops-specialist** | C | deployment-checklist | Read, Grep, Glob |
| **documentation-writer** | C | — | Read, Grep, Glob |
| **feature-developer** | E | executing-plans | Read, Grep, Glob, **Edit, Write** |
| **frontend-specialist** | E | — | Read, Grep, Glob |
| **mobile-specialist** | E | — | Read, Grep, Glob |
| **performance-optimizer** | V | — | Read, Grep, Glob |
| **refactoring-specialist** | E | refactoring | Read, Grep, Glob |
| **security-auditor** | V | security-audit | Read, Grep, Glob |
| **test-writer** | E, V | test-driven-development | Read, Grep, Glob |

> O `feature-developer` é o único agente com permissão de escrita (Edit, Write). Os demais operam em modo somente-leitura.

### Auto-Seleção de Agente

Quando `--agent` não é informado, o `ScaleDetector` analisa a descrição da tarefa usando matching por keywords (EN + PT-BR) e seleciona o agente mais adequado. Fallback padrão: `feature-developer`.

---

## Skills

Skills são unidades de conhecimento reutilizáveis distribuídas em 3 níveis:

| Nível | Conteúdo | Carregamento |
|---|---|---|
| **L1 — Sumário** | Frontmatter YAML (~100 tokens) | Startup (eager) |
| **L2 — Completo** | Corpo do SKILL.md | Sob demanda (lazy, cached) |
| **L3 — Referências** | Arquivos em `references/` | Sob demanda |

Skills do projeto (`.fama/skills/`) sobrescrevem skills built-in de mesmo slug.

| Skill | Fase | Referências | Descrição |
|---|---|---|---|
| **adversarial-review** | V | — | Validação adversarial rigorosa |
| **brainstorming** | P | approach-template.md | Exploração de ideias e design interativo |
| **code-review** | R, V | — | Revisão sistemática de código |
| **deployment-checklist** | C | — | Checklist de deploy e produção |
| **documentation-review** | V | — | Revisão de documentação técnica |
| **executing-plans** | E | execution-details.md | Execução de planos de implementação |
| **feature-breakdown** | P | task-template.md | Decomposição de features em tarefas |
| **implementation-readiness** | P | — | Verificação de prontidão para implementação |
| **refactoring** | E | techniques.md | Técnicas de refatoração |
| **release-notes** | C | — | Geração de notas de release |
| **security-audit** | V | owasp-checklist.md, report-template.md | Auditoria de segurança (OWASP) |
| **systematic-debugging** | E | templates.md | Metodologia de debugging sistemático |
| **test-driven-development** | E | — | Práticas de TDD |
| **verification** | V | — | Verificação e validação |
| **writing-plans** | P | task-format.md | Criação de planos de implementação |

---

## Workflow Engine PREVEC

O PREVEC é um workflow engine de 5 fases com quality gates configuráveis entre cada transição:

```
 ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
 │     P     │───▶│     R     │───▶│     E     │───▶│     V     │───▶│     C     │
 │ Planning  │    │  Review   │    │ Execution │    │Validation │    │Confirmation│
 └───────────┘    └───────────┘    └───────────┘    └───────────┘    └───────────┘
     Gate ──────────▶ Gate ──────────▶ Gate ──────────▶ Gate ──────────▶
```

### Fases e Agentes

| Fase | Nome | Obrigatória | Agentes | Skills |
|---|---|---|---|---|
| **P** | Planning | Sim | architect, documentation-writer | brainstorming, writing-plans, feature-breakdown, implementation-readiness |
| **R** | Review | Opcional | architect, code-reviewer, security-auditor | code-review, security-audit, implementation-readiness |
| **E** | Execution | Sim | feature-developer, bug-fixer, test-writer, refactoring-specialist | executing-plans, test-driven-development, systematic-debugging |
| **V** | Validation | Sim | test-writer, code-reviewer, security-auditor, performance-optimizer | verification, test-driven-development, code-review |
| **C** | Confirmation | Opcional | documentation-writer, devops-specialist | verification, deployment-checklist, release-notes, documentation-review |

### Quality Gates (Built-in)

| Gate | Descrição |
|---|---|
| `require-plan` | Exige um plano aprovado antes de avançar |
| `require-approval` | Exige aprovação explícita |
| `require-tests` | Exige que testes estejam passando |
| `require-security` | Exige auditoria de segurança aprovada |

Gates são configuráveis via `.fama.yaml` e extensíveis via `GateRegistry`.

### Escalonamento

O sistema detecta automaticamente a escala da tarefa e ajusta o workflow:

| Escala | Fases Ativas | Exemplo |
|---|---|---|
| QUICK | E | Correção de typo, ajuste de config |
| SMALL | P → E | Bug fix simples, pequena feature |
| MEDIUM | P → R → E → V | Feature completa, refatoração |
| LARGE | P → R → E → V → C | Epic, mudança arquitetural |

---

## Workflow Templates

11 templates step-by-step prontos para cenários comuns:

| Template | Steps | Descrição |
|---|---|---|
| `architecture-design` | 3 | Design e documentação de arquitetura |
| `code-review` | 3 | Fluxo completo de revisão de código |
| `epic-creation` | 3 | Criação e decomposição de epics |
| `implementation-readiness` | 3 | Verificação de prontidão para implementação |
| `prd-generation` | 4 | Geração de Product Requirements Document |
| `product-brief` | 3 | Criação de brief de produto |
| `retrospective` | 3 | Facilitação de retrospectivas |
| `sprint-planning` | 3 | Planejamento de sprint |
| `story-creation` | 3 | Criação de user stories |
| `tech-spec` | 3 | Especificação técnica detalhada |
| `ux-design` | 3 | Design de experiência do usuário |

```bash
# Listar templates
fama workflow list-templates

# Executar template
fama workflow exec sprint-planning
```

---

## Multi-Agent Party

O comando `party` permite discussões colaborativas entre agentes. Cada agente contribui de acordo com sua persona, construindo sobre as contribuições anteriores.

```bash
fama party "como migrar de monolito para microsserviços?" \
  --agents architect,backend-specialist,devops-specialist,security-auditor \
  --rounds 3
```

**Fluxo:**
1. O tópico é distribuído aos agentes selecionados
2. Cada agente contribui sequencialmente, com acesso às respostas anteriores
3. O processo repete por N rodadas
4. O resultado final sintetiza todas as contribuições

---

## Servidor MCP

O fama-agents expõe um servidor [Model Context Protocol](https://modelcontextprotocol.io/) via transporte stdio, integrando-se com editores e IDEs compatíveis.

```bash
fama mcp
```

### Tools Disponíveis

**4 Gateway Tools (consolidados):**

| Tool | Actions | Descrição |
|---|---|---|
| `fama_agent` | list, show, prompt, recommend | Consultar e recomendar agentes |
| `fama_skill` | list, show, search, forPhase | Consultar e buscar skills |
| `fama_workflow` | init, status, advance, complete | Gerenciar workflows |
| `fama_explore` | stack, config, health | Explorar projeto e verificar saúde |

**5 Legacy Aliases** mantidos para compatibilidade retroativa:
`fama_list_agents`, `fama_list_skills`, `fama_get_skill`, `fama_workflow_init`, `fama_workflow_status`, `fama_workflow_advance`.

### Claude Plugin

O projeto inclui um manifesto em `.claude-plugin/manifest.json` para integração direta com o Claude Desktop e Claude Code.

---

## Exportação para Outras Ferramentas

Gere arquivos de configuração para ferramentas de IA compatíveis:

```bash
# Exportar para preset específico
fama export --preset cursor
fama export --preset copilot

# Exportar para todos
fama export --preset all
```

| Preset | Saída | Descrição |
|---|---|---|
| `cursor` | `.cursorrules` | Regras para Cursor IDE |
| `windsurf` | Formato Windsurf | Configuração Windsurf |
| `copilot` | Formato Copilot | Instruções GitHub Copilot |
| `claude-desktop` | Formato Claude | Configuração Claude Desktop |
| `agents-md` | Markdown | Exportação genérica em Markdown |

O contexto de exportação inclui agentes, skills, config, stack detectado e diretório do projeto.

---

## Análise Semântica de Codebase

O serviço de análise semântica (`fama analyze`) examina o codebase sem dependências externas (regex-based, sem tree-sitter):

- **Detecção de arquitetura** — monorepo (95%), microservices (70%), layered (75%), modular (60%), monolith (40%)
- **Descoberta de camadas** — core, api, service, ui, util, config, test
- **Mapeamento de dependências** — runtime, dev e peer a partir de `package.json`
- **Extração de API pública** — funções, classes, constantes, tipos e enums exportados
- **Identificação de entry points** — pontos de entrada do projeto
- **Relatório formatado** — saída otimizada para consumo por agentes LLM

```bash
fama analyze
```

---

## Scaffold de Documentação

Gera e gerencia documentação estruturada em `.fama/docs/`:

```bash
# Ver status dos documentos
fama fill

# Gerar templates
fama fill --scaffold
```

### 11 Templates de Documentação

| Template | Seções |
|---|---|
| `overview.md` | Visão, Objetivos, Features, Usuários-alvo |
| `architecture.md` | Visão geral, Decisões, Trade-offs, Diagramas |
| `stack.md` | Linguagens, Frameworks, Infra, Justificativa |
| `testing.md` | Tipos de teste, Ferramentas, Cobertura |
| `workflow.md` | Branching, PRs, Code Review, CI/CD |
| `deployment.md` | Ambientes, Steps, Rollback, Monitoramento |
| `security.md` | Autenticação, Autorização, Proteção de dados |
| `api.md` | Endpoints, Auth, Erros, Exemplos |
| `conventions.md` | Naming, Estrutura, Patterns, Linting |
| `onboarding.md` | Pré-requisitos, Setup, Primeira task |
| `glossary.md` | Termos, Abreviações, Conceitos de domínio |

---

## Sistema de Módulos

Extenda o fama-agents com módulos que podem contribuir novos agentes, skills e workflows:

```bash
# Instalar módulo de um diretório
fama module install ./meu-modulo

# Listar módulos
fama module list

# Remover módulo
fama module uninstall nome-modulo
```

Cada módulo é definido por um `ModuleManifest` com nome, versão, e referências aos artefatos que contribui.

---

## Provedores LLM

O sistema suporta múltiplos provedores com fallback chain:

| Provedor | Classe | Recursos |
|---|---|---|
| **Claude** (default) | `ClaudeProvider` | Subagents, MCP, streaming |
| **OpenAI** | `OpenAIProvider` | Streaming |
| **OpenRouter** | `OpenRouterProvider` | Acesso a múltiplos modelos |

### Seleção de Modelo

```yaml
# .fama.yaml
model: sonnet                    # Claude Sonnet (default)
model: openai/gpt-4o            # OpenAI via prefixo
model: openrouter/mistral-large  # OpenRouter via prefixo
```

### Fallback Chain

```yaml
# .fama.yaml
provider:
  primary: claude
  fallback:
    - openai
    - openrouter
```

Se o provedor primário falhar, o sistema tenta automaticamente os provedores de fallback na ordem configurada.

---

## Configuração

### Arquivo de Configuração

Crie `.fama.yaml` ou `.fama.json` na raiz do projeto:

```yaml
# .fama.yaml
model: sonnet
maxTurns: 50
lang: pt-BR
skillsDir: ./custom-skills    # Diretório de skills customizadas

# Provedores
provider:
  primary: claude
  fallback:
    - openai

# Workflow
workflow:
  defaultScale: medium
  gates:
    requirePlan: true
    requireApproval: false
    requireTests: true
    requireSecurity: false

# Times nomeados
teams:
  backend:
    agents:
      - architect
      - backend-specialist
      - database-specialist
      - test-writer
  security:
    agents:
      - security-auditor
      - code-reviewer
  frontend:
    agents:
      - frontend-specialist
      - feature-developer
```

---

## API Programática

O fama-agents pode ser usado como biblioteca TypeScript:

```typescript
import {
  AgentRegistry,
  SkillRegistry,
  runAgent,
  WorkflowEngine,
  StackDetector,
  CodebaseAnalyzer,
  detectScale,
  autoSelectAgent,
} from "fama-agents";

// Executar agente diretamente
const result = await runAgent({
  agent: "architect",
  task: "Projetar sistema de cache distribuído",
  skills: ["brainstorming", "feature-breakdown"],
  model: "sonnet",
  maxTurns: 30,
});

// Detectar escala e auto-selecionar agente
const scale = detectScale("implementar sistema de auth completo");
const agent = autoSelectAgent("implementar sistema de auth completo");

// Analisar codebase
const analyzer = new CodebaseAnalyzer();
const report = await analyzer.analyze("./src");
```

### Exports Disponíveis

O módulo exporta classes, funções, tipos, schemas Zod e utilitários:

- **Core:** `AgentRegistry`, `SkillRegistry`, `WorkflowEngine`, `GateRegistry`, `ModuleRegistry`
- **Runners:** `runAgent`, `executeStep`, `executeWorkflow`
- **Providers:** `ClaudeProvider`, `OpenAIProvider`, `OpenRouterProvider`, `createProvider`, `resolveProvider`
- **Detecção:** `detectScale`, `autoSelectAgent`, `StackDetector`
- **Análise:** `CodebaseAnalyzer`
- **Scaffold:** `scaffoldDocs`, `getScaffoldStatus`, `getUnfilledDocs`
- **Export:** `generateExport`, `runExport`, `getPresetNames`
- **Memory:** `loadMemory`, `saveMemory`, `appendEntry`, `clearMemory`
- **Party:** `selectAgents`, `synthesize`
- **i18n:** `t`, `initI18n`, `getLocale`, `getSupportedLocales`
- **Observability:** `StructuredLogger`, `startSpan`, `endSpan`
- **Schemas Zod:** `FamaConfigSchema`, `WorkflowStateSchema`, `AgentFrontmatterSchema`, `SkillFrontmatterSchema` e mais 12 schemas

---

## Testes

O projeto utiliza **Vitest 4.0** com cobertura abrangente:

```bash
# Executar todos os testes
npm test

# Watch mode
npm run test:watch

# Pipeline CI completo
npm run ci
```

### Distribuição dos Testes (~54 arquivos)

| Diretório | Cobertura |
|---|---|
| `tests/agents/` | Construção de prompts |
| `tests/commands/` | 11 comandos CLI |
| `tests/core/` | Registry, runner, memory, errors, gates, LLM provider, modules, party, scale detector, schemas, skill loader/registry, workflow engine |
| `tests/mcp/` | Servidor MCP e 4 gateways |
| `tests/services/export/` | Export service e 5 presets |
| `tests/services/semantic/` | Architecture detector, dependency mapper, TypeScript parser |
| `tests/services/stack/` | Stack detector e detection rules |
| `tests/utils/` | Config, frontmatter, i18n, observability, validation, structured logger |
| `tests/workflow/` | Gate registry, orchestrator, step executor, workflow loader |

---

## Estrutura do Projeto

```
fama-agents/
├── agents/                    # 14 playbooks (Markdown + YAML frontmatter)
├── skills/                    # 15 skills (SKILL.md + references/)
│   └── <skill>/
│       ├── SKILL.md           # Definição da skill (frontmatter + corpo)
│       └── references/        # Material auxiliar (L3)
├── workflows/                 # 11 templates step-file
│   └── <template>/
│       ├── workflow.yaml      # Definição do workflow
│       └── steps/             # Steps individuais
├── src/
│   ├── index.ts               # API pública
│   ├── cli.ts                 # Registro de comandos (commander)
│   ├── agents/                # Factories TypeScript dos agentes
│   │   └── build-prompt.ts    # Construtor de system prompt
│   ├── commands/              # Implementação dos 20+ comandos CLI
│   ├── core/
│   │   ├── types.ts           # Definições de tipo
│   │   ├── schemas.ts         # Schemas de validação (Zod)
│   │   ├── errors.ts          # Hierarquia de erros customizada
│   │   ├── agent-registry.ts  # Registro e lookup de agentes
│   │   ├── agent-runner.ts    # Engine de execução
│   │   ├── agent-memory.ts    # Memória sidecar persistente
│   │   ├── skill-registry.ts  # Cache de skills em 2 tiers
│   │   ├── skill-loader.ts    # Discovery de skills no filesystem
│   │   ├── workflow-engine.ts # Engine PREVEC
│   │   ├── scale-detector.ts  # Detecção de escala + auto-seleção
│   │   ├── llm-provider.ts    # Abstração multi-provider
│   │   ├── party-orchestrator.ts  # Discussão multi-agente
│   │   ├── module-registry.ts # Gerenciamento de módulos
│   │   ├── module-loader.ts   # Load/install/uninstall de módulos
│   │   └── providers/         # Claude, OpenAI, OpenRouter
│   ├── mcp/
│   │   ├── server.ts          # Servidor MCP (stdio transport)
│   │   ├── tools.ts           # Definição de tools MCP
│   │   └── gateways/          # 4 gateways (agent, skill, workflow, explore)
│   ├── workflow/
│   │   ├── phases.ts          # Definições das fases PREVEC
│   │   ├── orchestrator.ts    # Máquina de estados do workflow
│   │   ├── gates.ts           # Verificação de gates
│   │   ├── gate-registry.ts   # Registro extensível de gates
│   │   ├── gates/             # 4 gates built-in
│   │   ├── workflow-loader.ts # Carregamento de step-files
│   │   └── step-executor.ts   # Execução step-by-step
│   ├── services/
│   │   ├── semantic/          # Análise de codebase (regex-based)
│   │   ├── scaffold/          # Geração de documentação (11 templates)
│   │   ├── stack/             # Detecção de tech stack
│   │   └── export/            # Exportação (5 presets)
│   └── utils/
│       ├── logger.ts          # Logger básico
│       ├── structured-logger.ts # Logger estruturado com níveis
│       ├── observability.ts   # Tracing com spans
│       ├── config.ts          # Loader de .fama.yaml/.json
│       ├── frontmatter.ts     # Parser de YAML frontmatter
│       ├── validation.ts      # Helpers de validação
│       ├── interactive.ts     # Prompts interativos
│       └── i18n/              # Internacionalização (en, pt-BR)
├── tests/                     # ~54 arquivos de teste (Vitest)
├── bin/
│   └── fama.ts                # Entrypoint da CLI
├── .claude-plugin/
│   └── manifest.json          # Manifesto de plugin Claude
├── .env.example               # Template de variáveis de ambiente
├── package.json
└── tsconfig.json
```

---

## Desenvolvimento

### Scripts NPM

| Script | Comando | Descrição |
|---|---|---|
| `npm run dev` | `tsx bin/fama.ts` | Execução em dev com TypeScript direto |
| `npm run build` | `tsc` | Compilação TypeScript → `dist/` |
| `npm start` | `node dist/bin/fama.js` | Execução da versão compilada |
| `npm run typecheck` | `tsc --noEmit` | Verificação de tipos |
| `npm test` | `vitest run` | Testes unitários |
| `npm run test:watch` | `vitest` | Testes em watch mode |
| `npm run lint` | `eslint src/` | Análise estática |
| `npm run format` | `prettier --write .` | Formatação |
| `npm run ci` | lint + typecheck + build + test | Pipeline CI completo |

### Stack Técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | >= 20.0.0 |
| Linguagem | TypeScript | 5.9+ |
| Module system | ESM (Node16) | — |
| Build target | ES2022 | — |
| CLI | Commander | 14.0+ |
| Agent SDK | @anthropic-ai/claude-agent-sdk | 0.2.29+ |
| MCP | @modelcontextprotocol/sdk | 1.25+ |
| Validação | Zod | 3.23+ |
| YAML | yaml | 2.8+ |
| Testes | Vitest | 4.0+ |
| Lint | ESLint | 9.39+ |
| Formatação | Prettier | 3.8+ |

---

## Contribuição

1. **Fork** o repositório
2. Crie uma branch de feature:
   ```bash
   git checkout -b feat/minha-feature
   ```
3. Implemente suas alterações seguindo o estilo do projeto
4. Execute a pipeline de qualidade:
   ```bash
   npm run ci
   ```
5. Commit seguindo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(core): add custom gate support"
   ```
6. Push e abra um **Pull Request**

### Tipos de Commit

| Tipo | Uso |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição/modificação de testes |
| `perf` | Melhoria de performance |
| `chore` | Manutenção (deps, configs) |
| `build` | Build system |
| `ci` | CI/CD |

---

## Licença

Distribuído sob a licença [MIT](LICENSE).

---

<p align="center">
  <strong>fama-agents</strong> v0.1.0<br>
  <a href="https://docs.anthropic.com/">Anthropic</a> &middot;
  <a href="https://modelcontextprotocol.io/">MCP</a> &middot;
  <a href="https://github.com/renatinhosfaria/fama-agents">GitHub</a>
</p>
