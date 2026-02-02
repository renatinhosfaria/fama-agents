<p align="center">
  <img src="https://img.shields.io/badge/Node.js-≥20.0.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Claude-Agent_SDK-7C3AED?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude Agent SDK">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

# 🤖 fama-agents

> **Framework modular de agentes de IA para automação inteligente de fluxos de trabalho de desenvolvimento de software**

O **fama-agents** é um sistema completo que orquestra agentes especializados com habilidades (skills) reutilizáveis, permitindo planejar, revisar, executar e validar tarefas de engenharia de software de forma automatizada e inteligente.

---

## ✨ Principais Características

| Feature | Descrição |
|---------|-----------|
| 🏗️ **Agentes Especializados** | 10 agentes com personas únicas (arquitetura, QA, segurança, performance, etc.) |
| 🎯 **Skills Modulares** | 11 skills reutilizáveis com documentação dedicada |
| ⚡ **Engine de Workflow** | Sistema PREVEC com fases, gates de qualidade e escalonamento |
| 🔧 **CLI Completa** | Interface de linha de comando intuitiva e poderosa |
| 🔌 **MCP Ready** | Integração nativa com Model Context Protocol |
| 👥 **Multi-Agent** | Suporte a discussões e colaboração entre múltiplos agentes |
| 📦 **Sistema de Módulos** | Extensibilidade através de módulos instaláveis |

---

## 📁 Estrutura do Projeto

```
fama-agents/
├── agents/                 # 📋 Definições dos agentes (Markdown + YAML frontmatter)
│   ├── architect.md
│   ├── bug-fixer.md
│   ├── code-reviewer.md
│   ├── devops-specialist.md
│   ├── documentation-writer.md
│   ├── feature-developer.md
│   ├── performance-optimizer.md
│   ├── refactoring-specialist.md
│   ├── security-auditor.md
│   └── test-writer.md
├── skills/                 # 🎯 Skills com documentação (SKILL.md)
│   ├── adversarial-review/
│   ├── brainstorming/
│   ├── code-review/
│   ├── executing-plans/
│   ├── feature-breakdown/
│   ├── refactoring/
│   ├── security-audit/
│   ├── systematic-debugging/
│   ├── test-driven-development/
│   ├── verification/
│   └── writing-plans/
├── workflows/              # 📊 Templates de workflow
│   ├── architecture-design/
│   ├── prd-generation/
│   └── tech-spec/
├── src/
│   ├── agents/             # Implementações TypeScript dos agentes
│   ├── commands/           # Comandos da CLI
│   ├── core/               # Núcleo (registry, runner, workflow engine)
│   ├── mcp/                # Servidor MCP e ferramentas
│   ├── utils/              # Utilitários e helpers
│   └── workflow/           # Engine de workflow (fases, gates, orquestração)
├── tests/                  # Testes unitários e de integração
└── bin/                    # Entrypoint da CLI
```

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 20.0.0 ou superior
- **npm**, **pnpm** ou **yarn**

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/renatinhosfaria/fama-agents.git
cd fama-agents

# Instale as dependências
npm install

# Build do projeto
npm run build
```

### Instalação Global (após build)

```bash
npm link
# Agora você pode usar: fama <comando>
```

---

## 💻 Uso

### Comandos Principais

```bash
# Exibir ajuda
fama --help

# Executar uma tarefa (seleção automática de agente)
fama run "implementar autenticação OAuth2"

# Executar com agente específico
fama run "otimizar queries do banco" --agent performance-optimizer

# Criar um plano de implementação
fama plan "sistema de notificações push"

# Revisar código
fama review ./src --validate

# Debugar um problema
fama debug "usuários não conseguem fazer login"
```

### Workflow PREVEC

O sistema de workflow organiza o desenvolvimento em fases estruturadas:

```bash
# Inicializar um novo workflow
fama workflow init "feature-auth" --scale medium

# Ver status atual
fama workflow status

# Executar tarefa na fase atual
fama workflow run "design do schema de autenticação"

# Marcar fase como completa
fama workflow complete

# Avançar para próxima fase
fama workflow advance

# Executar workflow por template
fama workflow exec architecture-design
```

### Multi-Agent Party

Realize discussões colaborativas entre múltiplos agentes:

```bash
# Discussão sobre arquitetura
fama party "qual a melhor abordagem para microsserviços?" \
  --agents architect,security-auditor,devops-specialist \
  --rounds 3
```

### Gerenciamento de Agentes e Skills

```bash
# Listar agentes disponíveis
fama agents list

# Ver detalhes de um agente
fama agents show architect

# Ver menu de comandos do agente
fama agents menu architect

# Listar skills
fama skills list

# Ver conteúdo de uma skill
fama skills show brainstorming
```

### Módulos

```bash
# Listar módulos instalados
fama module list

# Instalar módulo de um diretório
fama module install ./meu-modulo

# Desinstalar módulo
fama module uninstall nome-modulo
```

### Servidor MCP

```bash
# Iniciar como servidor MCP
fama mcp
```

---

## 🤖 Agentes Disponíveis

| Agente | Ícone | Especialidade |
|--------|-------|---------------|
| **architect** | 🏗️ | Design de sistemas e decomposição de features |
| **feature-developer** | 👨‍💻 | Implementação de novas funcionalidades |
| **bug-fixer** | 🐛 | Diagnóstico e correção de bugs |
| **code-reviewer** | 🔍 | Revisão de código e garantia de qualidade |
| **security-auditor** | 🔒 | Auditoria de segurança e vulnerabilidades |
| **performance-optimizer** | ⚡ | Otimização de performance |
| **test-writer** | 🧪 | Criação de testes automatizados |
| **refactoring-specialist** | ♻️ | Refatoração e melhoria de código |
| **documentation-writer** | 📝 | Documentação técnica |
| **devops-specialist** | 🚀 | CI/CD, infraestrutura e deploy |

---

## 🎯 Skills Disponíveis

| Skill | Fase | Descrição |
|-------|------|-----------|
| **brainstorming** | P | Exploração de ideias e design interativo |
| **feature-breakdown** | P | Decomposição de features em tarefas |
| **writing-plans** | P | Criação de planos de implementação |
| **code-review** | R, V | Revisão sistemática de código |
| **adversarial-review** | V | Revisão adversarial com validação rigorosa |
| **refactoring** | E | Técnicas de refatoração de código |
| **security-audit** | V | Auditoria de segurança |
| **systematic-debugging** | E | Debugging sistemático |
| **test-driven-development** | E | Desenvolvimento orientado a testes |
| **executing-plans** | E | Execução de planos de implementação |
| **verification** | V | Verificação e validação |

---

## ⚙️ Configuração

### Arquivo de Configuração

Crie um arquivo `.fama.yaml` ou `.fama.json` na raiz do projeto:

```yaml
# .fama.yaml
model: sonnet  # Modelo padrão
maxTurns: 50   # Máximo de turnos por execução
verbose: false # Exibir chamadas de ferramentas

# Configuração de times
teams:
  backend:
    agents:
      - architect
      - feature-developer
      - test-writer
  security:
    agents:
      - security-auditor
      - code-reviewer
```

### Variáveis de Ambiente

```bash
# Configurar API key do Anthropic
export ANTHROPIC_API_KEY=sua-chave-aqui
```

---

## 🧪 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build do projeto
npm run build

# Executar testes
npm test

# Testes em modo watch
npm run test:watch

# Verificação de tipos
npm run typecheck

# Linting
npm run lint

# Formatação
npm run format

# CI completo (lint + typecheck + build + test)
npm run ci
```

### Estrutura de Testes

```bash
tests/
├── agents/           # Testes dos agentes
├── commands/         # Testes dos comandos CLI
├── core/             # Testes do núcleo
├── fixtures/         # Fixtures de teste
├── mcp/              # Testes do servidor MCP
├── utils/            # Testes de utilitários
└── workflow/         # Testes do engine de workflow
```

---

## 📚 API e Integração

### Uso Programático

```typescript
import { AgentRunner, AgentRegistry, SkillRegistry } from 'fama-agents';

// Carregar registros
const agentRegistry = new AgentRegistry();
const skillRegistry = new SkillRegistry();

// Executar um agente
const runner = new AgentRunner(agentRegistry, skillRegistry);
const result = await runner.run({
  agent: 'architect',
  task: 'Projetar sistema de cache distribuído',
  skills: ['brainstorming', 'feature-breakdown'],
});
```

### Integração MCP

O servidor MCP expõe ferramentas que podem ser consumidas por clientes compatíveis:

```bash
# Iniciar servidor
fama mcp

# O servidor estará disponível para conexões MCP
```

---

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1. **Fork** o repositório
2. Crie uma branch de feature:
   ```bash
   git checkout -b feature/minha-nova-feature
   ```
3. Faça suas alterações seguindo o estilo do projeto
4. Execute os testes:
   ```bash
   npm run ci
   ```
5. Commit suas alterações:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade X"
   ```
6. Push para sua branch:
   ```bash
   git push origin feature/minha-nova-feature
   ```
7. Abra um **Pull Request**

### Convenções de Commit

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

## 🔗 Links Úteis

- [Claude Agent SDK](https://docs.anthropic.com/claude/docs/agent-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Anthropic API](https://docs.anthropic.com/)

---

<p align="center">
  Desenvolvido com ❤️ usando <a href="https://www.anthropic.com/">Claude</a>
</p>

