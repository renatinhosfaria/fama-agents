import chalk from "chalk";
import { structuredLog, LogLevel } from "./structured-logger.js";

function shouldPrint(level: LogLevel): boolean {
  return level >= structuredLog.getLevel();
}

export const log = {
  info: (msg: string) => {
    structuredLog.info(msg);
    if (shouldPrint(LogLevel.INFO)) console.log(chalk.blue("â„¹"), msg);
  },
  success: (msg: string) => {
    structuredLog.info(msg, { type: "success" });
    if (shouldPrint(LogLevel.INFO)) console.log(chalk.green("âœ“"), msg);
  },
  warn: (msg: string) => {
    structuredLog.warn(msg);
    if (shouldPrint(LogLevel.WARN)) console.log(chalk.yellow("âš "), msg);
  },
  error: (msg: string) => {
    structuredLog.error(msg);
    if (shouldPrint(LogLevel.ERROR)) console.error(chalk.red("âœ—"), msg);
  },
  dim: (msg: string) => {
    structuredLog.debug(msg);
    if (shouldPrint(LogLevel.DEBUG)) console.log(chalk.dim(msg));
  },
  heading: (msg: string) => {
    structuredLog.info(msg, { type: "heading" });
    if (shouldPrint(LogLevel.INFO)) console.log(chalk.bold.cyan(`\n${msg}\n`));
  },
  table: (rows: string[][]) => {
    if (!shouldPrint(LogLevel.INFO)) return;
    for (const row of rows) {
      console.log(row.map((col, i) => (i === 0 ? chalk.bold(col) : col)).join("  "));
    }
  },
};

export { structuredLog, LogLevel };
