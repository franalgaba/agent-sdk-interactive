/**
 * Default configuration values
 */

import type { CLIConfig, ResolvedConfig } from "../types";

/**
 * Default settings
 */
export const DEFAULT_CONFIG: Required<
  Pick<ResolvedConfig, "name" | "agents" | "commands" | "mcpServers" | "hooks" | "settingSources" | "additionalDirectories" | "settings" | "session">
> = {
  name: "claude-code-interactive",
  agents: {},
  commands: {},
  mcpServers: {},
  hooks: {},
  settingSources: ["project"],
  additionalDirectories: [],
  settings: {
    maxTurns: 500,
  },
  session: {},
};

/**
 * Resolve config with defaults
 */
export function resolveConfig(config: CLIConfig): ResolvedConfig {
  return {
    name: config.name ?? DEFAULT_CONFIG.name,
    cwd: config.cwd ?? process.cwd(),
    systemPrompt: config.systemPrompt,
    tools: config.tools,
    agents: config.agents ?? DEFAULT_CONFIG.agents,
    commands: config.commands ?? DEFAULT_CONFIG.commands,
    mcpServers: config.mcpServers ?? DEFAULT_CONFIG.mcpServers,
    hooks: config.hooks ?? DEFAULT_CONFIG.hooks,
    settingSources: config.settingSources ?? DEFAULT_CONFIG.settingSources,
    additionalDirectories: config.additionalDirectories ?? DEFAULT_CONFIG.additionalDirectories,
    settings: {
      ...DEFAULT_CONFIG.settings,
      ...config.settings,
    },
    session: config.session ?? DEFAULT_CONFIG.session,
  };
}
