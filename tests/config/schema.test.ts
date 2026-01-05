import { describe, expect, test } from "bun:test";
import {
  validateConfig,
  safeValidateConfig,
  AgentDefinitionSchema,
  CommandDefinitionSchema,
  McpStdioConfigSchema,
  McpSSEConfigSchema,
  McpHttpConfigSchema,
  HookMatcherSchema,
  SettingsSchema,
} from "../../src/config/schema";

describe("AgentDefinitionSchema", () => {
  test("validates valid agent", () => {
    const agent = {
      description: "Test agent",
      prompt: "You are a test agent",
    };
    expect(() => AgentDefinitionSchema.parse(agent)).not.toThrow();
  });

  test("validates agent with all fields", () => {
    const agent = {
      description: "Test agent",
      prompt: "You are a test agent",
      model: "opus" as const,
      tools: ["Read", "Write"],
    };
    const result = AgentDefinitionSchema.parse(agent);
    expect(result.model).toBe("opus");
    expect(result.tools).toEqual(["Read", "Write"]);
  });

  test("rejects agent without description", () => {
    const agent = { prompt: "Test prompt" };
    expect(() => AgentDefinitionSchema.parse(agent)).toThrow();
  });

  test("rejects agent without prompt", () => {
    const agent = { description: "Test" };
    expect(() => AgentDefinitionSchema.parse(agent)).toThrow();
  });

  test("rejects agent with empty description", () => {
    const agent = { description: "", prompt: "Test" };
    expect(() => AgentDefinitionSchema.parse(agent)).toThrow();
  });

  test("validates model enum values", () => {
    const validModels = ["sonnet", "opus", "haiku", "inherit"];
    for (const model of validModels) {
      const agent = {
        description: "Test",
        prompt: "Test",
        model,
      };
      expect(() => AgentDefinitionSchema.parse(agent)).not.toThrow();
    }
  });

  test("rejects invalid model", () => {
    const agent = {
      description: "Test",
      prompt: "Test",
      model: "invalid",
    };
    expect(() => AgentDefinitionSchema.parse(agent)).toThrow();
  });
});

describe("CommandDefinitionSchema", () => {
  test("validates valid command", () => {
    const command = {
      description: "Test command",
      content: "Do something",
    };
    expect(() => CommandDefinitionSchema.parse(command)).not.toThrow();
  });

  test("validates command with all fields", () => {
    const command = {
      description: "Test command",
      content: "Do something",
      argumentHint: "<file>",
      allowedTools: ["Read", "Bash"],
    };
    const result = CommandDefinitionSchema.parse(command);
    expect(result.argumentHint).toBe("<file>");
    expect(result.allowedTools).toEqual(["Read", "Bash"]);
  });

  test("rejects command without description", () => {
    const command = { content: "Test" };
    expect(() => CommandDefinitionSchema.parse(command)).toThrow();
  });

  test("rejects command without content", () => {
    const command = { description: "Test" };
    expect(() => CommandDefinitionSchema.parse(command)).toThrow();
  });
});

describe("McpStdioConfigSchema", () => {
  test("validates minimal stdio config", () => {
    const config = { command: "node" };
    expect(() => McpStdioConfigSchema.parse(config)).not.toThrow();
  });

  test("validates full stdio config", () => {
    const config = {
      type: "stdio" as const,
      command: "node",
      args: ["server.js"],
      env: { KEY: "value" },
    };
    const result = McpStdioConfigSchema.parse(config);
    expect(result.args).toEqual(["server.js"]);
    expect(result.env).toEqual({ KEY: "value" });
  });

  test("rejects config without command", () => {
    const config = { type: "stdio" };
    expect(() => McpStdioConfigSchema.parse(config)).toThrow();
  });
});

describe("McpSSEConfigSchema", () => {
  test("validates valid SSE config", () => {
    const config = {
      type: "sse" as const,
      url: "https://example.com/sse",
    };
    expect(() => McpSSEConfigSchema.parse(config)).not.toThrow();
  });

  test("validates SSE config with headers", () => {
    const config = {
      type: "sse" as const,
      url: "https://example.com/sse",
      headers: { Authorization: "Bearer token" },
    };
    const result = McpSSEConfigSchema.parse(config);
    expect(result.headers).toEqual({ Authorization: "Bearer token" });
  });

  test("rejects invalid URL", () => {
    const config = {
      type: "sse" as const,
      url: "not-a-url",
    };
    expect(() => McpSSEConfigSchema.parse(config)).toThrow();
  });
});

describe("McpHttpConfigSchema", () => {
  test("validates valid HTTP config", () => {
    const config = {
      type: "http" as const,
      url: "https://api.example.com/mcp",
    };
    expect(() => McpHttpConfigSchema.parse(config)).not.toThrow();
  });

  test("rejects missing type", () => {
    const config = { url: "https://api.example.com/mcp" };
    expect(() => McpHttpConfigSchema.parse(config)).toThrow();
  });
});

describe("HookMatcherSchema", () => {
  test("validates hook with command", () => {
    const hook = { command: "echo test" };
    expect(() => HookMatcherSchema.parse(hook)).not.toThrow();
  });

  test("validates hook with handler", () => {
    const hook = { handler: async () => ({ continue: true }) };
    expect(() => HookMatcherSchema.parse(hook)).not.toThrow();
  });

  test("validates hook with matcher and command", () => {
    const hook = {
      matcher: "Bash",
      command: "echo 'Running bash'",
    };
    const result = HookMatcherSchema.parse(hook);
    expect(result.matcher).toBe("Bash");
  });

  test("rejects hook without command or handler", () => {
    const hook = { matcher: "Bash" };
    expect(() => HookMatcherSchema.parse(hook)).toThrow();
  });

  test("rejects empty hook", () => {
    const hook = {};
    expect(() => HookMatcherSchema.parse(hook)).toThrow();
  });
});

describe("SettingsSchema", () => {
  test("validates empty settings", () => {
    const settings = {};
    expect(() => SettingsSchema.parse(settings)).not.toThrow();
  });

  test("validates full settings", () => {
    const settings = {
      allowedTools: ["Read", "Write"],
      disallowedTools: ["Bash"],
      model: "claude-sonnet-4-20250514",
      customInstructions: "Be helpful",
      permissionMode: "acceptEdits" as const,
      maxTurns: 100,
      maxThinkingTokens: 5000,
    };
    const result = SettingsSchema.parse(settings);
    expect(result.maxTurns).toBe(100);
    expect(result.permissionMode).toBe("acceptEdits");
  });

  test("rejects negative maxTurns", () => {
    const settings = { maxTurns: -1 };
    expect(() => SettingsSchema.parse(settings)).toThrow();
  });

  test("rejects zero maxTurns", () => {
    const settings = { maxTurns: 0 };
    expect(() => SettingsSchema.parse(settings)).toThrow();
  });

  test("validates permission modes", () => {
    const validModes = ["default", "acceptEdits", "bypassPermissions", "plan"];
    for (const mode of validModes) {
      const settings = { permissionMode: mode };
      expect(() => SettingsSchema.parse(settings)).not.toThrow();
    }
  });
});

describe("validateConfig", () => {
  test("validates minimal config", () => {
    const config = {};
    expect(() => validateConfig(config)).not.toThrow();
  });

  test("validates full config", () => {
    const config = {
      name: "my-cli",
      cwd: "/tmp",
      agents: {
        reviewer: {
          description: "Code reviewer",
          prompt: "Review code",
        },
      },
      commands: {
        review: {
          description: "Review code",
          content: "Review the code",
        },
      },
      settings: {
        model: "claude-sonnet-4-20250514",
        maxTurns: 50,
      },
    };
    const result = validateConfig(config);
    expect(result.name).toBe("my-cli");
    expect(result.agents?.reviewer.description).toBe("Code reviewer");
  });

  test("validates systemPrompt string", () => {
    const config = { systemPrompt: "Custom prompt" };
    const result = validateConfig(config);
    expect(result.systemPrompt).toBe("Custom prompt");
  });

  test("validates systemPrompt preset", () => {
    const config = {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: "Extra instructions",
      },
    };
    const result = validateConfig(config);
    expect(result.systemPrompt).toEqual(config.systemPrompt);
  });

  test("validates tools array", () => {
    const config = { tools: ["Read", "Write", "Bash"] };
    const result = validateConfig(config);
    expect(result.tools).toEqual(["Read", "Write", "Bash"]);
  });

  test("validates tools preset", () => {
    const config = {
      tools: { type: "preset" as const, preset: "claude_code" as const },
    };
    const result = validateConfig(config);
    expect(result.tools).toEqual(config.tools);
  });

  test("throws on invalid config", () => {
    const config = {
      agents: {
        bad: { description: "" }, // Empty description
      },
    };
    expect(() => validateConfig(config)).toThrow();
  });
});

describe("safeValidateConfig", () => {
  test("returns success for valid config", () => {
    const config = { name: "test" };
    const result = safeValidateConfig(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("test");
    }
  });

  test("returns error for invalid config", () => {
    const config = {
      agents: {
        bad: { description: "" },
      },
    };
    const result = safeValidateConfig(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
