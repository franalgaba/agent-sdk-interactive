/**
 * Zod schemas for configuration validation
 */

import { z } from "zod";

/**
 * Agent definition schema
 */
export const AgentDefinitionSchema = z.object({
  description: z.string().min(1, "Agent description is required"),
  prompt: z.string().min(1, "Agent prompt is required"),
  model: z.enum(["sonnet", "opus", "haiku", "inherit"]).optional(),
  tools: z.array(z.string()).optional(),
});

/**
 * Command definition schema
 */
export const CommandDefinitionSchema = z.object({
  description: z.string().min(1, "Command description is required"),
  content: z.string().min(1, "Command content is required"),
  argumentHint: z.string().optional(),
  allowedTools: z.array(z.string()).optional(),
});

/**
 * MCP server config schemas
 */
export const McpStdioConfigSchema = z.object({
  type: z.literal("stdio").optional(),
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

export const McpSSEConfigSchema = z.object({
  type: z.literal("sse"),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
});

export const McpHttpConfigSchema = z.object({
  type: z.literal("http"),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
});

export const McpSdkServerSchema = z.object({
  type: z.literal("sdk"),
  name: z.string(),
  instance: z.any(), // McpServer instance - can't validate at runtime
});

export const McpServerConfigSchema = z.union([
  McpStdioConfigSchema,
  McpSSEConfigSchema,
  McpHttpConfigSchema,
  McpSdkServerSchema,
  z.any(), // Allow Agent SDK types we can't validate
]);

/**
 * Hook matcher schema
 */
export const HookMatcherSchema = z.object({
  matcher: z.string().optional(),
  command: z.string().optional(),
  handler: z.function().optional(),
}).refine(
  (data) => data.command !== undefined || data.handler !== undefined,
  { message: "Hook must have either 'command' or 'handler'" }
);

/**
 * Hook event types
 */
export const HookEventSchema = z.enum([
  "PreToolUse",
  "PostToolUse",
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "Notification",
  "Stop",
]);

/**
 * Setting source types
 */
export const SettingSourceSchema = z.enum(["user", "project", "local"]);

/**
 * Permission mode
 */
export const PermissionModeSchema = z.enum([
  "default",
  "acceptEdits",
  "bypassPermissions",
  "plan",
]);

/**
 * System prompt schema
 */
export const SystemPromptSchema = z.union([
  z.string(),
  z.object({
    type: z.literal("preset"),
    preset: z.literal("claude_code"),
    append: z.string().optional(),
  }),
]);

/**
 * Tools config schema
 */
export const ToolsConfigSchema = z.union([
  z.array(z.string()),
  z.object({
    type: z.literal("preset"),
    preset: z.literal("claude_code"),
  }),
]);

/**
 * Settings schema
 */
export const SettingsSchema = z.object({
  allowedTools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  model: z.string().optional(),
  customInstructions: z.string().optional(),
  permissionMode: PermissionModeSchema.optional(),
  maxTurns: z.number().positive().optional(),
  maxThinkingTokens: z.number().positive().optional(),
});

/**
 * Session options schema
 */
export const SessionSchema = z.object({
  resume: z.string().optional(),
  continue: z.boolean().optional(),
});

/**
 * Main CLI config schema
 */
export const CLIConfigSchema = z.object({
  name: z.string().optional(),
  cwd: z.string().optional(),
  systemPrompt: SystemPromptSchema.optional(),
  tools: ToolsConfigSchema.optional(),
  agents: z.record(AgentDefinitionSchema).optional(),
  commands: z.record(CommandDefinitionSchema).optional(),
  mcpServers: z.record(McpServerConfigSchema).optional(),
  hooks: z.record(HookEventSchema, z.array(HookMatcherSchema)).optional(),
  settingSources: z.array(SettingSourceSchema).optional(),
  additionalDirectories: z.array(z.string()).optional(),
  settings: SettingsSchema.optional(),
  session: SessionSchema.optional(),
});

/**
 * Validate CLI config
 */
export function validateConfig(config: unknown): z.infer<typeof CLIConfigSchema> {
  return CLIConfigSchema.parse(config);
}

/**
 * Safe validation (returns result instead of throwing)
 */
export function safeValidateConfig(config: unknown) {
  return CLIConfigSchema.safeParse(config);
}
