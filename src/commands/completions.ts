import { log } from "../utils/logger.js";

const BASH_COMPLETION = `# fama bash completion
_fama_completion() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="run plan review debug workflow agents skills mcp init completions"

  case "\${prev}" in
    fama)
      COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
      return 0
      ;;
    --agent)
      local agents=$(fama agents list --json 2>/dev/null | grep '"slug"' | sed 's/.*: "\\(.*\\)".*/\\1/')
      COMPREPLY=( $(compgen -W "\${agents}" -- "\${cur}") )
      return 0
      ;;
  esac

  COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
}
complete -F _fama_completion fama`;

const ZSH_COMPLETION = `# fama zsh completion
#compdef fama

_fama() {
  local -a commands
  commands=(
    'run:Run an agent on a task'
    'plan:Create or execute an implementation plan'
    'review:Run code review on a path'
    'debug:Start a debugging session'
    'workflow:Manage PREVEC workflow'
    'agents:List and show agents'
    'skills:List and show skills'
    'mcp:Start as MCP server'
    'init:Initialize a fama project'
    'completions:Generate shell completions'
  )

  _arguments -C \\
    '--json[Output results as JSON]' \\
    '1: :->cmds' \\
    '*::arg:->args'

  case $state in
    cmds)
      _describe -t commands 'fama commands' commands
      ;;
  esac
}

_fama`;

const FISH_COMPLETION = `# fama fish completion
complete -c fama -n '__fish_use_subcommand' -a 'run' -d 'Run an agent on a task'
complete -c fama -n '__fish_use_subcommand' -a 'plan' -d 'Create or execute a plan'
complete -c fama -n '__fish_use_subcommand' -a 'review' -d 'Run code review'
complete -c fama -n '__fish_use_subcommand' -a 'debug' -d 'Start debugging session'
complete -c fama -n '__fish_use_subcommand' -a 'workflow' -d 'Manage PREVEC workflow'
complete -c fama -n '__fish_use_subcommand' -a 'agents' -d 'List and show agents'
complete -c fama -n '__fish_use_subcommand' -a 'skills' -d 'List and show skills'
complete -c fama -n '__fish_use_subcommand' -a 'mcp' -d 'Start as MCP server'
complete -c fama -n '__fish_use_subcommand' -a 'init' -d 'Initialize a fama project'
complete -c fama -n '__fish_use_subcommand' -a 'completions' -d 'Generate shell completions'`;

const SHELLS: Record<string, string> = {
  bash: BASH_COMPLETION,
  zsh: ZSH_COMPLETION,
  fish: FISH_COMPLETION,
};

export function completionsCommand(shell: string) {
  const script = SHELLS[shell];
  if (!script) {
    log.error(`Unsupported shell: "${shell}". Supported: bash, zsh, fish`);
    process.exit(1);
  }
  console.log(script);
}
