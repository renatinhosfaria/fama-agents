---
name: adversarial-review
description: Revisão adversarial forçada — zero findings dispara re-análise obrigatória
phases: [R, V]
---

# Adversarial Review

## A Lei de Ferro

**Zero findings é um resultado INVÁLIDO.** Se sua primeira análise não encontrou problemas, você NÃO revisou com rigor suficiente. Volte e analise novamente com lentes diferentes.

## Processo

### Passo 1: Análise Inicial
1. Leia TODO o código sob revisão — não apenas os diffs, mas o contexto completo
2. Identifique os requisitos ou plano original
3. Faça sua análise normal de qualidade

### Passo 2: Verificação de Zero Findings
- Se encontrou 0 issues → **PARE**. Você precisa re-analisar.
- Aplique cada lente abaixo até encontrar pelo menos 1 finding real:
  - **Lente de Segurança**: Inputs não validados? Race conditions? Secrets expostos?
  - **Lente de Edge Cases**: O que acontece com null? String vazia? Lista enorme? Concorrência?
  - **Lente de Manutenção**: Alguém novo entenderia isso? Nomes claros? Abstração adequada?
  - **Lente de Performance**: N+1 queries? Loops desnecessários? Memory leaks?
  - **Lente de Conformidade**: Segue os padrões do projeto? Testes suficientes?

### Passo 3: Classificação de Severidade

| Severidade | Definição | Ação |
|------------|-----------|------|
| **Crítico** | Bug, falha de segurança, risco de perda de dados | Bloqueia merge |
| **Importante** | Problema de design, edge case não coberto | Deve corrigir |
| **Sugestão** | Melhoria de estilo, abordagem alternativa | Considerar |
| **Observação** | Nota informativa, não requer ação | Documentar |

### Passo 4: Relatório Estruturado

Para cada finding:
```
[SEVERIDADE] arquivo:linha - Descrição curta
  Contexto: O que foi observado
  Impacto: O que pode acontecer se não corrigir
  Sugestão: Como resolver
```

## Tabela de Racionalização

| Desculpa | Realidade |
|----------|-----------|
| "O código parece bom" | "Parece bom" não é uma análise. Aplique cada lente. |
| "É um change pequeno" | Changes pequenos causam bugs grandes. Verifique. |
| "O autor é experiente" | Experiência não previne bugs. O código é que importa. |
| "Já tem testes" | Testes existentes podem não cobrir o novo comportamento. |
| "Não encontrei nada" | Você não olhou com atenção suficiente. Tente novamente. |

## Checklist de Validação

Antes de entregar o relatório, verifique:
- [ ] Pelo menos 1 finding foi documentado
- [ ] Cada finding tem severidade, contexto e sugestão
- [ ] Findings críticos incluem evidência (código ou output)
- [ ] O relatório cobre todas as 5 lentes
- [ ] Nenhum finding é genérico — todos são específicos ao código revisado
