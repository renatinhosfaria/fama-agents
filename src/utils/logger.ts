import chalk from "chalk";

export const log = {
  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
  success: (msg: string) => console.log(chalk.green("✓"), msg),
  warn: (msg: string) => console.log(chalk.yellow("⚠"), msg),
  error: (msg: string) => console.error(chalk.red("✗"), msg),
  dim: (msg: string) => console.log(chalk.dim(msg)),
  heading: (msg: string) => console.log(chalk.bold.cyan(`\n${msg}\n`)),
  table: (rows: string[][]) => {
    for (const row of rows) {
      console.log(row.map((col, i) => (i === 0 ? chalk.bold(col) : col)).join("  "));
    }
  },
};
