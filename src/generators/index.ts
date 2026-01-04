/**
 * Generator orchestrator - generates .claude/ directory structure
 */

import * as fs from "fs/promises";
import * as path from "path";
import type { ResolvedConfig, GeneratedFile } from "../types";
import { generateSettingsJson, needsSettingsJson } from "./settings";
import { generateAgentFiles } from "./agents";
import { generateCommandFiles } from "./commands";

/**
 * Generated files tracker for cleanup
 */
export interface GenerationResult {
  files: GeneratedFile[];
  directories: string[];
}

/**
 * Generate all configuration files
 */
export async function generateConfigFiles(
  config: ResolvedConfig
): Promise<GenerationResult> {
  const basePath = path.join(config.cwd, ".claude");
  const files: GeneratedFile[] = [];
  const directories: string[] = [];

  // Create base .claude directory
  directories.push(basePath);

  // Generate settings.json if needed
  if (needsSettingsJson(config)) {
    const settingsContent = generateSettingsJson(config);
    files.push({
      path: path.join(basePath, "settings.json"),
      content: settingsContent,
    });
  }

  // Generate agent files if any
  if (Object.keys(config.agents).length > 0) {
    const agentsDir = path.join(basePath, "agents");
    directories.push(agentsDir);
    const agentFiles = generateAgentFiles(config.agents, basePath);
    files.push(...agentFiles);
  }

  // Generate command files if any
  if (Object.keys(config.commands).length > 0) {
    const commandsDir = path.join(basePath, "commands");
    directories.push(commandsDir);
    const commandFiles = generateCommandFiles(config.commands, basePath);
    files.push(...commandFiles);
  }

  // Create directories
  for (const dir of directories) {
    await fs.mkdir(dir, { recursive: true });
  }

  // Write files
  for (const file of files) {
    await fs.writeFile(file.path, file.content, "utf-8");
  }

  return { files, directories };
}

/**
 * Clean up generated files
 */
export async function cleanupGeneratedFiles(
  result: GenerationResult
): Promise<void> {
  // Delete files first
  for (const file of result.files) {
    try {
      await fs.unlink(file.path);
    } catch {
      // File might already be deleted
    }
  }

  // Delete directories in reverse order (deepest first)
  const sortedDirs = [...result.directories].sort(
    (a, b) => b.split(path.sep).length - a.split(path.sep).length
  );

  for (const dir of sortedDirs) {
    try {
      const contents = await fs.readdir(dir);
      if (contents.length === 0) {
        await fs.rmdir(dir);
      }
    } catch {
      // Directory might already be deleted or not empty
    }
  }
}

/**
 * Check if .claude directory already exists
 */
export async function checkExistingConfig(cwd: string): Promise<boolean> {
  const basePath = path.join(cwd, ".claude");
  try {
    await fs.access(basePath);
    return true;
  } catch {
    return false;
  }
}
