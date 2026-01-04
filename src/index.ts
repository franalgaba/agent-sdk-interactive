/**
 * claude-code-interactive
 *
 * TypeScript SDK that bridges the Claude Code plugin system and Agent SDK,
 * allowing you to define plugin entities in TypeScript, mix in custom code,
 * and launch Claude Code's TUI.
 */

// Main API
export { CLI, createCLI } from "./cli";

// Types
export type {
  CLIConfig,
  CLIResult,
  CLIMode,
  TUIConfig,
  ResolvedConfig,
  AgentDefinition,
  CommandDefinition,
  HookMatcher,
  HookEvent,
  McpServerConfig,
  McpStdioConfig,
  McpSSEConfig,
  McpHttpConfig,
  GeneratedFile,
  PermissionMode,
  SettingSource,
} from "./types";

// Config utilities
export { validateConfig, safeValidateConfig } from "./config/schema";
export { resolveConfig, DEFAULT_CONFIG } from "./config/defaults";

// Generators (for advanced use cases)
export { generatePlugin, cleanupPlugin } from "./generators/plugin";

// Runtime (for advanced use cases)
export { Session, createSession } from "./runtime/session";
export type { SessionOptions } from "./runtime/session";

// TUI (for custom TUI mode)
export { TUIApp, runTUIApp, createTheme } from "./tui";
export type { TUIAppConfig, Theme, TUIThemeConfig } from "./tui";

// Re-export useful types and functions from Agent SDK
export {
  // Core functions
  tool,
  createSdkMcpServer,
  query,

  // Types that users might need
  type SDKMessage,
  type SDKUserMessage,
  type SDKResultMessage,
  type HookCallback,
} from "@anthropic-ai/claude-agent-sdk";
