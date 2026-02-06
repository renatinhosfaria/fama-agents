import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _cachedRoot: string | null = null;

/**
 * Resolves the fama-agents package root directory.
 *
 * Resolution order:
 * 1. FAMA_ROOT env var (set by the Claude Code plugin entry point)
 * 2. Walk up from the current file to find package.json
 *
 * Works correctly in all modes:
 * - Dev (tsx): src/utils/ → 2 levels up → root ✓
 * - Built (node): dist/src/utils/ → 3 levels up → root ✓
 * - Plugin: uses FAMA_ROOT env var → plugin root ✓
 */
export function getPackageRoot(): string {
  if (_cachedRoot) return _cachedRoot;

  if (process.env.FAMA_ROOT) {
    _cachedRoot = process.env.FAMA_ROOT;
    return _cachedRoot;
  }

  let dir = __dirname;
  while (dir !== dirname(dir)) {
    if (existsSync(resolve(dir, "package.json"))) {
      _cachedRoot = dir;
      return dir;
    }
    dir = dirname(dir);
  }

  // Fallback: assume 2 levels up (dev mode)
  _cachedRoot = resolve(__dirname, "..", "..");
  return _cachedRoot;
}
