import { log } from "../utils/logger.js";
import { ModuleRegistry } from "../core/module-registry.js";
import { installModule, uninstallModule } from "../core/module-loader.js";

export function moduleListCommand(cwd: string = process.cwd()): void {
  const registry = new ModuleRegistry(cwd);
  const modules = registry.getAll();

  if (modules.length === 0) {
    log.info("Nenhum módulo instalado.");
    log.dim("  Use: fama module install <source> para instalar um módulo.");
    return;
  }

  log.heading("Módulos Instalados");
  for (const mod of modules) {
    const agents = mod.agents?.length ? `${mod.agents.length} agents` : "";
    const skills = mod.skills?.length ? `${mod.skills.length} skills` : "";
    const workflows = mod.workflows?.length ? `${mod.workflows.length} workflows` : "";
    const parts = [agents, skills, workflows].filter(Boolean).join(", ");
    console.log(`  ${mod.name}@${mod.version}  ${parts}`);
    if (mod.description) {
      log.dim(`    ${mod.description}`);
    }
  }
}

export function moduleInstallCommand(
  source: string,
  cwd: string = process.cwd(),
): void {
  const result = installModule(source, cwd);
  if (!result) {
    process.exit(1);
  }
}

export function moduleUninstallCommand(
  name: string,
  cwd: string = process.cwd(),
): void {
  const success = uninstallModule(name, cwd);
  if (!success) {
    process.exit(1);
  }
}
