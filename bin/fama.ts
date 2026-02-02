#!/usr/bin/env tsx
import "dotenv/config";
import { createCli } from "../src/cli.js";
import { FamaError } from "../src/core/errors.js";

async function main() {
  const program = createCli();
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  if (err instanceof FamaError) {
    process.stderr.write(`\nError [${err.code}]: ${err.message}\n`);
    process.exit(1);
  } else {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`\nUnexpected error: ${message}\n`);
    process.exit(2);
  }
});
