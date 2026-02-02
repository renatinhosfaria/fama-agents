import * as readline from "node:readline";

/**
 * Minimal interactive prompt utilities using Node's built-in readline.
 * No external dependencies required.
 */

const rl = () =>
  readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

/**
 * Ask a question and get a text answer.
 */
export function askText(question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const r = rl();
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    r.question(prompt, (answer) => {
      r.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

/**
 * Ask a yes/no question.
 */
export function askConfirm(question: string, defaultValue = true): Promise<boolean> {
  return new Promise((resolve) => {
    const r = rl();
    const hint = defaultValue ? "Y/n" : "y/N";
    r.question(`${question} (${hint}): `, (answer) => {
      r.close();
      const a = answer.trim().toLowerCase();
      if (!a) return resolve(defaultValue);
      resolve(a === "y" || a === "yes" || a === "s" || a === "sim");
    });
  });
}

/**
 * Ask the user to select one option from a list.
 */
export function askSelect(
  question: string,
  options: Array<{ label: string; value: string }>,
  defaultIndex = 0,
): Promise<string> {
  return new Promise((resolve) => {
    const r = rl();
    console.log(`\n${question}`);
    for (let i = 0; i < options.length; i++) {
      const marker = i === defaultIndex ? ">" : " ";
      console.log(`  ${marker} ${i + 1}. ${options[i].label}`);
    }
    r.question(`\nChoice (1-${options.length}) [${defaultIndex + 1}]: `, (answer) => {
      r.close();
      const idx = parseInt(answer.trim(), 10) - 1;
      if (idx >= 0 && idx < options.length) {
        resolve(options[idx].value);
      } else {
        resolve(options[defaultIndex].value);
      }
    });
  });
}

/**
 * Ask the user to select multiple options from a list.
 */
export function askMultiSelect(
  question: string,
  options: Array<{ label: string; value: string; selected?: boolean }>,
): Promise<string[]> {
  return new Promise((resolve) => {
    const r = rl();
    console.log(`\n${question} (comma-separated numbers)`);
    for (let i = 0; i < options.length; i++) {
      const marker = options[i].selected ? "[x]" : "[ ]";
      console.log(`  ${marker} ${i + 1}. ${options[i].label}`);
    }
    r.question(`\nChoices: `, (answer) => {
      r.close();
      if (!answer.trim()) {
        resolve(options.filter((o) => o.selected).map((o) => o.value));
        return;
      }
      const indices = answer
        .split(",")
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => i >= 0 && i < options.length);
      resolve(indices.map((i) => options[i].value));
    });
  });
}
