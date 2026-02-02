import { StackDetector } from "../services/stack/stack-detector.js";
import { log } from "../utils/logger.js";

interface StackOptions {
  cwd?: string;
  json?: boolean;
}

export function stackCommand(opts: StackOptions = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const detector = new StackDetector(cwd);
  const stack = detector.detect();

  if (opts.json) {
    process.stdout.write(JSON.stringify(stack, null, 2) + "\n");
    return;
  }

  log.info(detector.formatSummary(stack));

  const recommended = detector.recommendAgents(stack);
  if (recommended.length > 0) {
    log.dim(`\nRecommended agents: ${recommended.join(", ")}`);
  }
}
