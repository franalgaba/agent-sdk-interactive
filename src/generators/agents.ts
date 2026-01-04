/**
 * Generate .claude/agents/*.md files
 */

import type { AgentDefinition, GeneratedFile } from "../types";

/**
 * Generate markdown content for an agent
 */
export function generateAgentMarkdown(
  name: string,
  agent: AgentDefinition
): string {
  const frontmatterLines: string[] = ["---"];

  // Always include name and description
  frontmatterLines.push(`name: ${name}`);
  frontmatterLines.push(`description: ${escapeYaml(agent.description)}`);

  // Optional fields
  if (agent.model) {
    frontmatterLines.push(`model: ${agent.model}`);
  }

  if (agent.tools && agent.tools.length > 0) {
    frontmatterLines.push(`tools: ${agent.tools.join(", ")}`);
  }

  frontmatterLines.push("---");

  // Combine frontmatter and prompt
  return `${frontmatterLines.join("\n")}\n\n${agent.prompt}`;
}

/**
 * Generate all agent files
 */
export function generateAgentFiles(
  agents: Record<string, AgentDefinition>,
  basePath: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  for (const [name, agent] of Object.entries(agents)) {
    const filename = `${sanitizeFilename(name)}.md`;
    const content = generateAgentMarkdown(name, agent);

    files.push({
      path: `${basePath}/agents/${filename}`,
      content,
    });
  }

  return files;
}

/**
 * Escape special characters for YAML
 */
function escapeYaml(str: string): string {
  // If string contains special chars, wrap in quotes
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
