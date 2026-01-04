/**
 * Generate .claude/commands/*.md files
 */

import type { CommandDefinition, GeneratedFile } from "../types";

/**
 * Generate markdown content for a command
 */
export function generateCommandMarkdown(
  name: string,
  command: CommandDefinition
): string {
  const frontmatterLines: string[] = ["---"];

  // Description is required
  frontmatterLines.push(`description: ${escapeYaml(command.description)}`);

  // Optional fields
  if (command.argumentHint) {
    frontmatterLines.push(`argument-hint: ${escapeYaml(command.argumentHint)}`);
  }

  if (command.allowedTools && command.allowedTools.length > 0) {
    frontmatterLines.push(`allowed-tools: ${command.allowedTools.join(", ")}`);
  }

  frontmatterLines.push("---");

  // Combine frontmatter and content
  return `${frontmatterLines.join("\n")}\n\n${command.content}`;
}

/**
 * Generate all command files
 */
export function generateCommandFiles(
  commands: Record<string, CommandDefinition>,
  basePath: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  for (const [name, command] of Object.entries(commands)) {
    const filename = `${sanitizeFilename(name)}.md`;
    const content = generateCommandMarkdown(name, command);

    files.push({
      path: `${basePath}/commands/${filename}`,
      content,
    });
  }

  return files;
}

/**
 * Escape special characters for YAML
 */
function escapeYaml(str: string): string {
  if (/[:\n"']/.test(str) || str.includes("#")) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

/**
 * Sanitize filename
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
