import type { TranslationKeys } from "./types.js";

export const ptBR: TranslationKeys = {
  // CLI - Geral
  "cli.heading": "fama-agents",
  "cli.version": "Versão {version}",
  "cli.done": "Concluído.",
  "cli.cancelled": "Cancelado.",
  "cli.noResults": "Nenhum resultado encontrado.",

  // CLI - Init
  "cli.init.success": "Projeto inicializado com sucesso.",
  "cli.init.alreadyExists": "Configuração já existe. Use --force para sobrescrever.",
  "cli.init.createdConfig": "Criado {path}",
  "cli.init.createdDir": "Diretório criado {path}",

  // CLI - Run
  "cli.run.heading": "Executando Agente",
  "cli.run.agent": "Agente: {agent}",
  "cli.run.model": "Modelo: {model}",
  "cli.run.provider": "Provedor: {provider}",
  "cli.run.scale": "Escala: {scale}",
  "cli.run.task": "Tarefa: {task}",
  "cli.run.dryRun": "[DRY RUN] Executaria com a configuração acima.",
  "cli.run.starting": "Iniciando execução do agente...",
  "cli.run.complete": "Execução do agente concluída.",
  "cli.run.turns": "Turnos: {turns}",
  "cli.run.cost": "Custo: ${cost}",
  "cli.run.duration": "Duração: {duration}s",

  // CLI - Quick
  "cli.quick.heading": "Tarefa Rápida",
  "cli.quick.running": "Executando tarefa rápida...",

  // CLI - Plan
  "cli.plan.heading": "Plano de Implementação",
  "cli.plan.generating": "Gerando plano...",
  "cli.plan.executing": "Executando plano...",
  "cli.plan.saved": "Plano salvo em {path}",

  // CLI - Review
  "cli.review.heading": "Revisão de Código",
  "cli.review.running": "Executando revisão de código...",
  "cli.review.noFindings": "Nenhum problema encontrado.",
  "cli.review.findings": "{count} problema(s) encontrado(s).",

  // CLI - Debug
  "cli.debug.heading": "Sessão de Debug",
  "cli.debug.starting": "Iniciando sessão de debug...",

  // CLI - Stack
  "cli.stack.heading": "Detecção de Stack",
  "cli.stack.detecting": "Detectando stack do projeto...",
  "cli.stack.noStack": "Nenhuma stack tecnológica detectada.",

  // CLI - Export
  "cli.export.heading": "Exportação",
  "cli.export.generating": "Gerando exportação {preset}...",
  "cli.export.written": "Escrito: {path}",
  "cli.export.complete": "Exportação concluída. {count} arquivo(s) escrito(s).",

  // CLI - Workflow
  "cli.workflow.heading": "Workflow",
  "cli.workflow.initialized": "Workflow '{name}' inicializado com escala {scale}.",
  "cli.workflow.advanced": "Avançou para a fase: {phase}",
  "cli.workflow.completed": "Fase '{phase}' marcada como concluída.",
  "cli.workflow.currentPhase": "Fase atual: {phase}",
  "cli.workflow.noActive": "Nenhum workflow ativo. Execute `fama workflow init` primeiro.",

  // CLI - Agents
  "cli.agents.heading": "Agentes",
  "cli.agents.list": "Agentes disponíveis:",
  "cli.agents.notFound": "Agente '{slug}' não encontrado.",
  "cli.agents.available": "{count} agente(s) disponível(is).",

  // CLI - Skills
  "cli.skills.heading": "Skills",
  "cli.skills.list": "Skills disponíveis:",
  "cli.skills.notFound": "Skill '{slug}' não encontrada.",

  // CLI - Teams
  "cli.teams.heading": "Times",
  "cli.teams.list": "Times configurados:",
  "cli.teams.notFound": "Time '{name}' não encontrado.",

  // CLI - Party
  "cli.party.heading": "Discussão Multi-Agentes",
  "cli.party.round": "Rodada {n}/{total}",
  "cli.party.synthesis": "Sintetizando discussão...",

  // CLI - Module
  "cli.module.heading": "Módulos",
  "cli.module.installed": "Módulo '{name}' instalado.",
  "cli.module.uninstalled": "Módulo '{name}' desinstalado.",
  "cli.module.list": "Módulos instalados:",

  // Erros
  "error.apiKeyMissing":
    "Chave de API para {provider} não configurada. Defina a variável de ambiente {envVar}.",
  "error.agentNotFound":
    "Agente '{slug}' não encontrado. Execute `fama agents list` para ver os agentes disponíveis.",
  "error.skillNotFound":
    "Skill '{slug}' não encontrada. Execute `fama skills list` para ver as skills disponíveis.",
  "error.agentExecution": "Falha na execução do agente: {message}",
  "error.agentBuild": "Falha ao construir agente '{slug}': {message}",
  "error.workflowState": "Erro no estado do workflow: {message}",
  "error.gateCheck": "Verificação de gate falhou: {gate} — {message}",
  "error.configParse": "Falha ao analisar configuração: {message}",
  "error.providerError": "Erro no provedor '{provider}': {message}",
  "error.providerNotFound":
    "Provedor '{provider}' não encontrado. Disponíveis: claude, openai, openrouter.",
  "error.unknown": "Ocorreu um erro inesperado: {message}",

  // Fases do workflow
  "workflow.phase.planning": "Planejamento",
  "workflow.phase.review": "Revisão",
  "workflow.phase.execution": "Execução",
  "workflow.phase.validation": "Validação",
  "workflow.phase.completion": "Conclusão",

  // Escala
  "scale.quick": "Rápido",
  "scale.small": "Pequeno",
  "scale.medium": "Médio",
  "scale.large": "Grande",

  // Provedor
  "provider.usingDefault": "Usando provedor padrão: {provider}",
  "provider.fallback": "Provedor '{provider}' falhou, usando fallback '{fallback}'.",
  "provider.noSubagents":
    "Provedor '{provider}' não suporta subagentes. Subagentes serão ignorados.",
  "provider.noMcp":
    "Provedor '{provider}' não suporta MCP. Ferramentas MCP não estarão disponíveis.",

  // Detecção de stack
  "stack.languages": "Linguagens",
  "stack.frameworks": "Frameworks",
  "stack.buildTools": "Ferramentas de Build",
  "stack.testFrameworks": "Frameworks de Teste",
  "stack.packageManagers": "Gerenciadores de Pacotes",
  "stack.databases": "Bancos de Dados",
  "stack.ciTools": "CI/CD",
  "stack.monorepo": "Monorepo",
  "stack.detected": "Stack Detectada",

  // Labels gerais
  "label.yes": "Sim",
  "label.no": "Não",
  "label.none": "Nenhum",
  "label.unknown": "Desconhecido",
  "label.success": "Sucesso",
  "label.failure": "Falha",
  "label.warning": "Aviso",
  "label.info": "Info",
};
