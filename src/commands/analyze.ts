import { CodebaseAnalyzer } from "../services/semantic/codebase-analyzer.js";
import { log } from "../utils/logger.js";

interface AnalyzeOptions {
  json?: boolean;
  cwd?: string;
}

export function analyzeCommand(opts: AnalyzeOptions): void {
  const cwd = opts.cwd ?? process.cwd();
  const analyzer = new CodebaseAnalyzer(cwd);

  log.heading("Codebase Analysis");
  log.dim("Analyzing project structure...");

  const analysis = analyzer.analyze();

  if (opts.json) {
    console.log(JSON.stringify(analysis, null, 2));
    return;
  }

  console.log();
  console.log(`Architecture: ${analysis.architecture.type} (${analysis.architecture.confidence}% confidence)`);
  if (analysis.architecture.evidence.length > 0) {
    for (const e of analysis.architecture.evidence) {
      log.dim(`  ${e}`);
    }
  }

  if (analysis.layers.length > 0) {
    console.log("\nLayers:");
    for (const layer of analysis.layers) {
      console.log(`  ${layer.name} (${layer.type}) — ${layer.fileCount} files`);
    }
  }

  if (analysis.entryPoints.length > 0) {
    console.log(`\nEntry Points: ${analysis.entryPoints.join(", ")}`);
  }

  const runtimeDeps = analysis.dependencies.filter((d) => d.type === "runtime");
  const devDeps = analysis.dependencies.filter((d) => d.type === "dev");
  console.log(`\nDependencies: ${runtimeDeps.length} runtime, ${devDeps.length} dev`);
  if (runtimeDeps.length > 0) {
    const top = runtimeDeps.slice(0, 10).map((d) => d.name);
    log.dim(`  Top: ${top.join(", ")}`);
  }

  console.log(`\nPublic API: ${analysis.publicApi.length} exports`);
  console.log(`Total Code Files: ${analysis.fileCount}`);

  log.success("\nAnalysis complete.");
}
