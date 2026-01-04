/**
 * Generate .claude/settings.json
 */

import type { ResolvedConfig, McpServerConfig } from "../types";

interface SettingsJson {
  mcpServers?: Record<string, unknown>;
  allowedTools?: string[];
  disallowedTools?: string[];
  model?: string;
  customInstructions?: string;
}

/**
 * Convert MCP server config to settings.json format
 * Note: In-process SDK servers are passed directly to Agent SDK, not via settings.json
 */
function convertMcpConfig(config: McpServerConfig): unknown | null {
  // SDK servers are handled by Agent SDK directly
  if ("type" in config && config.type === "sdk") {
    return null;
  }

  // External servers go to settings.json
  if ("command" in config) {
    return {
      type: "stdio",
      command: config.command,
      args: config.args,
      env: config.env,
    };
  }

  if ("type" in config && config.type === "sse") {
    return {
      type: "sse",
      url: config.url,
      headers: config.headers,
    };
  }

  if ("type" in config && config.type === "http") {
    return {
      type: "http",
      url: config.url,
      headers: config.headers,
    };
  }

  return null;
}

/**
 * Generate settings.json content
 */
export function generateSettingsJson(config: ResolvedConfig): string {
  const settings: SettingsJson = {};

  // Add external MCP servers (SDK servers are handled separately)
  const externalServers: Record<string, unknown> = {};
  for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
    const converted = convertMcpConfig(serverConfig);
    if (converted) {
      externalServers[name] = converted;
    }
  }
  if (Object.keys(externalServers).length > 0) {
    settings.mcpServers = externalServers;
  }

  // Add tool restrictions
  if (config.settings.allowedTools) {
    settings.allowedTools = config.settings.allowedTools;
  }
  if (config.settings.disallowedTools) {
    settings.disallowedTools = config.settings.disallowedTools;
  }

  // Add model preference
  if (config.settings.model) {
    settings.model = config.settings.model;
  }

  // Add custom instructions
  if (config.settings.customInstructions) {
    settings.customInstructions = config.settings.customInstructions;
  }

  return JSON.stringify(settings, null, 2);
}

/**
 * Check if we need to generate settings.json
 */
export function needsSettingsJson(config: ResolvedConfig): boolean {
  // Check for external MCP servers
  for (const serverConfig of Object.values(config.mcpServers)) {
    if (!("type" in serverConfig) || serverConfig.type !== "sdk") {
      return true;
    }
  }

  // Check for other settings
  return !!(
    config.settings.allowedTools?.length ||
    config.settings.disallowedTools?.length ||
    config.settings.model ||
    config.settings.customInstructions
  );
}
