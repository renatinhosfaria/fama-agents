import {
  getScaffoldStatus,
  getUnfilledDocs,
  scaffoldDocs,
} from "../services/scaffold/scaffold-service.js";
import { log } from "../utils/logger.js";

interface FillOptions {
  dryRun?: boolean;
  status?: boolean;
  cwd?: string;
}

export function fillCommand(opts: FillOptions): void {
  const cwd = opts.cwd ?? process.cwd();

  if (opts.status) {
    showStatus(cwd);
    return;
  }

  // Ensure scaffold exists
  const written = scaffoldDocs(cwd);
  if (written.length > 0) {
    log.dim(`Scaffolded ${written.length} new documentation file(s).`);
  }

  const unfilled = getUnfilledDocs(cwd);

  if (unfilled.length === 0) {
    log.success("All documentation files are filled.");
    return;
  }

  log.heading("Documentation Fill");
  console.log(`\n${unfilled.length} unfilled documentation file(s):\n`);

  for (const doc of unfilled) {
    console.log(`  - ${doc.title} (${doc.path})`);
  }

  if (opts.dryRun) {
    log.dim("\n[dry-run] Would run documentation-writer agent on each unfilled file.");
    return;
  }

  console.log(
    "\nTo fill these files, run the documentation-writer agent on each one:",
  );
  for (const doc of unfilled) {
    log.dim(`  fama run "Fill ${doc.title} documentation" --agent documentation-writer`);
  }
}

function showStatus(cwd: string): void {
  const docs = getScaffoldStatus(cwd);

  if (docs.length === 0) {
    log.dim("No scaffold documentation found. Run `fama init` first.");
    return;
  }

  log.heading("Documentation Status");
  console.log();

  const filled = docs.filter((d) => d.status === "filled").length;
  const unfilled = docs.filter((d) => d.status === "unfilled").length;

  for (const doc of docs) {
    const icon = doc.status === "filled" ? "✓" : "○";
    console.log(`  ${icon} ${doc.title} — ${doc.status}`);
  }

  console.log(`\n  ${filled} filled, ${unfilled} unfilled out of ${docs.length} total`);
}
