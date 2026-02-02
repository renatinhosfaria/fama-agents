import type { ExportPreset } from "../types.js";
import { cursorPreset } from "./cursor.js";
import { windsurfPreset } from "./windsurf.js";
import { copilotPreset } from "./copilot.js";
import { claudeDesktopPreset } from "./claude-desktop.js";
import { agentsMdPreset } from "./agents-md.js";

const presetMap = new Map<string, ExportPreset>([
  ["cursor", cursorPreset],
  ["windsurf", windsurfPreset],
  ["copilot", copilotPreset],
  ["claude-desktop", claudeDesktopPreset],
  ["agents-md", agentsMdPreset],
]);

export function getPreset(name: string): ExportPreset | undefined {
  return presetMap.get(name);
}

export function getAllPresets(): ExportPreset[] {
  return [...presetMap.values()];
}

export function getPresetNames(): string[] {
  return [...presetMap.keys()];
}
