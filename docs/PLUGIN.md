# fama-agents — Claude Code Plugin

## Installation

### Via Git (recommended)

```bash
/plugin install github:renatinhosfaria/fama-agents
```

### Via local path (development)

```bash
/plugin install /path/to/fama-agents
```

## What's Included

### 15 Skills (Agent Skills Specification compliant)

| Skill | Phases | Description |
|-------|--------|-------------|
| adversarial-review | R, V | Devil's advocate review with mandatory re-analysis |
| brainstorming | P | Interactive design refinement before implementation |
| code-review | R, V | Severity-based code quality review |
| deployment-checklist | C | Pre-deploy validation checklist |
| documentation-review | C | Documentation completeness assessment |
| executing-plans | E | Disciplined batch plan execution |
| feature-breakdown | P | Epic to executable task decomposition |
| implementation-readiness | P, R | Pre-execution artifact alignment validation |
| refactoring | E | Safe structural improvement with TDD |
| release-notes | C | Structured changelog generation |
| security-audit | R, V | OWASP-based vulnerability assessment |
| systematic-debugging | E, V | Evidence-based root cause analysis |
| test-driven-development | E, V | RED-GREEN-REFACTOR enforcement |
| verification | E, V, C | Evidence-based completion verification |
| writing-plans | P | Bite-sized implementation plan creation |

### Iron Laws

Three non-negotiable principles enforced by skills:

1. **TDD**: "No production code without a failing test first."
2. **Verification**: "Evidence before claims, always."
3. **Debugging**: "No fixes without root cause investigation first."

### Progressive Disclosure

Skills use a 3-level loading system to minimize context window usage:

- **Level 1** (~100 tokens/skill): Name + description loaded at startup
- **Level 2** (<500 words): Full skill body loaded on activation
- **Level 3** (on demand): Reference files from `references/` subdirectories

## Configuration

Set your API key:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

Optional configuration via `.fama.yaml` in your project root:

```yaml
model: sonnet
maxTurns: 50
lang: pt-BR
skillsDir: skills
```

## CLI Usage (standalone)

```bash
# Install globally
npm install -g fama-agents

# Run with an agent
fama run --agent architect "Design the authentication system"

# List available skills
fama skills list

# Show skill content
fama skills show test-driven-development
```
