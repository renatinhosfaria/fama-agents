import chalk from "chalk";
import { structuredLog, LogLevel } from "./structured-logger.js";

export const log = {
  info: (msg: string) => {
    structuredLog.info(msg);
    console.log(chalk.blue("ℹ"), msg);
  },
  success: (msg: string) => {
    structuredLog.info(msg, { type: "success" });
    console.log(chalk.green("✓"), msg);
  },
  warn: (msg: string) => {
    structuredLog.warn(msg);
    console.log(chalk.yellow("⚠"), msg);
  },
  error: (msg: string) => {
    structuredLog.error(msg);
    console.error(chalk.red("✗"), msg);
  },
  dim: (msg: string) => {
    structuredLog.debug(msg);
    console.log(chalk.dim(msg));
  },
  heading: (msg: string) => {
    structuredLog.info(msg, { type: "heading" });
    console.log(chalk.bold.cyan(`\n${msg}\n`));
  },
  table: (rows: string[][]) => {
    for (const row of rows) {
      console.log(row.map((col, i) => (i === 0 ? chalk.bold(col) : col)).join("  "));
    }
  },
};

export { structuredLog, LogLevel };
