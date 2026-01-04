/**
 * Type definitions for claude-code-interactive SDK
 */

import type {
  HookCallback,
  McpServerConfig as SDKMcpServerConfig,
  McpSdkServerConfigWithInstance,
  PermissionMode,
  AgentDefinition as SDKAgentDefinition,
  HookEvent as SDKHookEvent,
} from "@anthropic-ai/claude-agent-sdk";

// Re-export useful types from Agent SDK
export type { HookCallback, PermissionMode, SDKAgentDefinition };

/**
 * Main configuration for creating a CLI
 */
export interface CLIConfig {
  /** Name of your CLI application */
  name?: string;

  /** Working directory (default: process.cwd()) */
  cwd?: string;

  /** Mode: 'spawn' for native CLI, 'streaming' for custom TUI */
  mode?: CLIMode;

  /** TUI configuration (only used when mode is 'streaming') */
  tui?: TUIConfig;

  /** System prompt configuration */
  systemPrompt?:
    | string
    | {
        type: "preset";
        preset: "claude_code";
        append?: string;
      };

  /** Tools configuration */
  tools?: string[] | { type: "preset"; preset: "claude_code" };

  /** Custom agents - will be passed to Agent SDK */
  agents?: Record<string, AgentDefinition>;

  /** Custom commands - generates .claude/commands/*.md */
  commands?: Record<string, CommandDefinition>;

  /** MCP servers - supports both in-process and external */
  mcpServers?: Record<string, McpServerConfig>;

  /** Programmatic hooks */
  hooks?: Partial<Record<HookEvent, HookMatcher[]>>;

  /** Settings sources to load */
  settingSources?: SettingSource[];

  /** Additional directories Claude can access */
  additionalDirectories?: string[];

  /** Settings */
  settings?: {
    allowedTools?: string[];
    disallowedTools?: string[];
    model?: string;
    customInstructions?: string;
    permissionMode?: PermissionMode;
    maxTurns?: number;
    maxThinkingTokens?: number;
  };

  /** Session options */
  session?: {
    resume?: string;
    continue?: boolean;
  };
}

/**
 * Agent definition (TypeScript-friendly wrapper)
 */
export interface AgentDefinition {
  /** Description of when to use this agent */
  description: string;

  /** The agent's system prompt */
  prompt: string;

  /** Model to use (optional) */
  model?: "sonnet" | "opus" | "haiku" | "inherit";

  /** Allowed tools for this agent */
  tools?: string[];
}

/**
 * Command definition (generates markdown file)
 */
export interface CommandDefinition {
  /** Description shown in /help */
  description: string;

  /** The prompt content when command is invoked */
  content: string;

  /** Hint for command arguments */
  argumentHint?: string;

  /** Allowed tools when this command runs */
  allowedTools?: string[];
}

/**
 * MCP server configuration
 */
export type McpServerConfig =
  | SDKMcpServerConfig
  | McpSdkServerConfigWithInstance
  | McpStdioConfig
  | McpSSEConfig
  | McpHttpConfig;

export interface McpStdioConfig {
  type?: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpSSEConfig {
  type: "sse";
  url: string;
  headers?: Record<string, string>;
}

export interface McpHttpConfig {
  type: "http";
  url: string;
  headers?: Record<string, string>;
}

/**
 * Hook events
 */
export type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "SessionStart"
  | "SessionEnd"
  | "UserPromptSubmit"
  | "Notification"
  | "Stop";

/**
 * Hook matcher - supports both shell commands and TypeScript handlers
 */
export interface HookMatcher {
  /** Tool name pattern to match (optional) */
  matcher?: string;

  /** Shell command to run (plugin-style) */
  command?: string;

  /** TypeScript handler function (Agent SDK-style) */
  handler?: HookCallback;
}

/**
 * Setting source types
 */
export type SettingSource = "user" | "project" | "local";

/**
 * Result from running the CLI
 */
export interface CLIResult {
  /** Session ID */
  sessionId: string;

  /** Total cost in USD */
  totalCostUsd: number;

  /** Whether the session completed successfully */
  success: boolean;
}

/**
 * Resolved configuration (after defaults applied)
 */
export interface ResolvedConfig {
  name: string;
  cwd: string;
  systemPrompt?:
    | string
    | {
        type: "preset";
        preset: "claude_code";
        append?: string;
      };
  tools?: string[] | { type: "preset"; preset: "claude_code" };
  agents: Record<string, AgentDefinition>;
  commands: Record<string, CommandDefinition>;
  mcpServers: Record<string, McpServerConfig>;
  hooks: Partial<Record<HookEvent, HookMatcher[]>>;
  settingSources: SettingSource[];
  additionalDirectories: string[];
  settings: {
    allowedTools?: string[];
    disallowedTools?: string[];
    model?: string;
    customInstructions?: string;
    permissionMode?: PermissionMode;
    maxTurns: number;
    maxThinkingTokens?: number;
  };
  session: {
    resume?: string;
    continue?: boolean;
  };
}

/**
 * Generated file info
 */
export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * TUI Configuration for custom streaming mode
 */
export interface TUIConfig {
  /** Branding customization */
  branding: {
    /** Application name displayed in header */
    name: string;
    /** Tagline shown under the name */
    tagline?: string;
    /** Custom welcome message */
    welcomeMessage?: string;
    /** Input prompt prefix (default: "> ") */
    promptPrefix?: string;
  };

  /** Theme configuration */
  theme?: {
    colors?: {
      /** Primary accent color */
      primary?: string;
      /** Success/completion color */
      success?: string;
      /** Error/warning color */
      error?: string;
      /** Muted/secondary text color */
      muted?: string;
      /** Tool name color */
      tool?: string;
    };
  };

  /** Display options */
  display?: {
    /** Show tool execution progress (default: true) */
    showToolProgress?: boolean;
    /** Show thinking indicator (default: true) */
    showThinking?: boolean;
    /** Show cost summary at end (default: true) */
    showCost?: boolean;
    /** Truncate tool output after N chars (default: 500) */
    truncateToolOutput?: number;
  };

  /** Hide specific features */
  hide?: {
    /** Commands to hide from /help */
    commands?: string[];
  };
}

/**
 * Mode for running the CLI
 * - 'spawn': Spawn Claude Code CLI (default, uses native TUI with full features)
 * - 'tui': Use custom TUI with pi-tui framework and SDK streaming
 */
export type CLIMode = "spawn" | "tui";
