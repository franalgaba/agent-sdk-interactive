import { describe, expect, test } from "bun:test";
import { resolveConfig, DEFAULT_CONFIG } from "./defaults";
import type { CLIConfig } from "../types";

describe("DEFAULT_CONFIG", () => {
  test("has correct default name", () => {
    expect(DEFAULT_CONFIG.name).toBe("claude-code-interactive");
  });

  test("has empty agents by default", () => {
    expect(DEFAULT_CONFIG.agents).toEqual({});
  });

  test("has empty commands by default", () => {
    expect(DEFAULT_CONFIG.commands).toEqual({});
  });

  test("has empty mcpServers by default", () => {
    expect(DEFAULT_CONFIG.mcpServers).toEqual({});
  });

  test("has empty hooks by default", () => {
    expect(DEFAULT_CONFIG.hooks).toEqual({});
  });

  test("has project in settingSources by default", () => {
    expect(DEFAULT_CONFIG.settingSources).toEqual(["project"]);
  });

  test("has empty additionalDirectories by default", () => {
    expect(DEFAULT_CONFIG.additionalDirectories).toEqual([]);
  });

  test("has correct default settings", () => {
    expect(DEFAULT_CONFIG.settings.maxTurns).toBe(500);
  });

  test("has empty session by default", () => {
    expect(DEFAULT_CONFIG.session).toEqual({});
  });
});

describe("resolveConfig", () => {
  test("uses defaults for empty config", () => {
    const config: CLIConfig = {};
    const resolved = resolveConfig(config);

    expect(resolved.name).toBe(DEFAULT_CONFIG.name);
    expect(resolved.agents).toEqual({});
    expect(resolved.commands).toEqual({});
    expect(resolved.settings.maxTurns).toBe(500);
  });

  test("uses provided name", () => {
    const config: CLIConfig = { name: "my-agent" };
    const resolved = resolveConfig(config);

    expect(resolved.name).toBe("my-agent");
  });

  test("uses process.cwd() when cwd not provided", () => {
    const config: CLIConfig = {};
    const resolved = resolveConfig(config);

    expect(resolved.cwd).toBe(process.cwd());
  });

  test("uses provided cwd", () => {
    const config: CLIConfig = { cwd: "/custom/path" };
    const resolved = resolveConfig(config);

    expect(resolved.cwd).toBe("/custom/path");
  });

  test("passes through systemPrompt", () => {
    const config: CLIConfig = { systemPrompt: "Custom prompt" };
    const resolved = resolveConfig(config);

    expect(resolved.systemPrompt).toBe("Custom prompt");
  });

  test("passes through systemPrompt preset", () => {
    const config: CLIConfig = {
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: "Extra",
      },
    };
    const resolved = resolveConfig(config);

    expect(resolved.systemPrompt).toEqual(config.systemPrompt);
  });

  test("passes through tools", () => {
    const config: CLIConfig = { tools: ["Read", "Write"] };
    const resolved = resolveConfig(config);

    expect(resolved.tools).toEqual(["Read", "Write"]);
  });

  test("uses provided agents", () => {
    const config: CLIConfig = {
      agents: {
        reviewer: {
          description: "Reviews code",
          prompt: "You review code",
        },
      },
    };
    const resolved = resolveConfig(config);

    expect(resolved.agents.reviewer).toBeDefined();
    expect(resolved.agents.reviewer.description).toBe("Reviews code");
  });

  test("uses provided commands", () => {
    const config: CLIConfig = {
      commands: {
        review: {
          description: "Review code",
          content: "Review this code",
        },
      },
    };
    const resolved = resolveConfig(config);

    expect(resolved.commands.review).toBeDefined();
    expect(resolved.commands.review.description).toBe("Review code");
  });

  test("uses provided mcpServers", () => {
    const config: CLIConfig = {
      mcpServers: {
        postgres: {
          command: "npx",
          args: ["@mcp/postgres"],
        },
      },
    };
    const resolved = resolveConfig(config);

    expect(resolved.mcpServers.postgres).toBeDefined();
  });

  test("uses provided hooks", () => {
    const config: CLIConfig = {
      hooks: {
        PreToolUse: [{ command: "echo test" }],
      },
    };
    const resolved = resolveConfig(config);

    expect(resolved.hooks.PreToolUse).toBeDefined();
    expect(resolved.hooks.PreToolUse?.length).toBe(1);
  });

  test("uses provided settingSources", () => {
    const config: CLIConfig = {
      settingSources: ["user", "project", "local"],
    };
    const resolved = resolveConfig(config);

    expect(resolved.settingSources).toEqual(["user", "project", "local"]);
  });

  test("uses provided additionalDirectories", () => {
    const config: CLIConfig = {
      additionalDirectories: ["/extra/dir"],
    };
    const resolved = resolveConfig(config);

    expect(resolved.additionalDirectories).toEqual(["/extra/dir"]);
  });

  test("merges settings with defaults", () => {
    const config: CLIConfig = {
      settings: {
        model: "claude-opus-4-20250514",
        maxTurns: 100,
      },
    };
    const resolved = resolveConfig(config);

    // Custom settings
    expect(resolved.settings.model).toBe("claude-opus-4-20250514");
    expect(resolved.settings.maxTurns).toBe(100);
  });

  test("preserves all settings fields", () => {
    const config: CLIConfig = {
      settings: {
        allowedTools: ["Read"],
        disallowedTools: ["Bash"],
        model: "test-model",
        customInstructions: "Be helpful",
        permissionMode: "acceptEdits",
        maxTurns: 200,
        maxThinkingTokens: 5000,
      },
    };
    const resolved = resolveConfig(config);

    expect(resolved.settings.allowedTools).toEqual(["Read"]);
    expect(resolved.settings.disallowedTools).toEqual(["Bash"]);
    expect(resolved.settings.model).toBe("test-model");
    expect(resolved.settings.customInstructions).toBe("Be helpful");
    expect(resolved.settings.permissionMode).toBe("acceptEdits");
    expect(resolved.settings.maxTurns).toBe(200);
    expect(resolved.settings.maxThinkingTokens).toBe(5000);
  });

  test("uses provided session options", () => {
    const config: CLIConfig = {
      session: {
        resume: "session-123",
        continue: true,
      },
    };
    const resolved = resolveConfig(config);

    expect(resolved.session.resume).toBe("session-123");
    expect(resolved.session.continue).toBe(true);
  });

  test("full config resolution", () => {
    const config: CLIConfig = {
      name: "hawk",
      cwd: "/projects/hawk",
      systemPrompt: "You are Hawk",
      tools: { type: "preset", preset: "claude_code" },
      agents: {
        scanner: {
          description: "Security scanner",
          prompt: "Scan for vulnerabilities",
          model: "opus",
          tools: ["Read", "Grep"],
        },
      },
      commands: {
        audit: {
          description: "Run audit",
          content: "Audit the code",
          argumentHint: "<dir>",
          allowedTools: ["Read"],
        },
      },
      mcpServers: {
        snyk: { command: "snyk-mcp" },
      },
      hooks: {
        SessionStart: [{ command: "echo starting" }],
      },
      settingSources: ["project"],
      additionalDirectories: ["/shared"],
      settings: {
        model: "claude-sonnet-4-20250514",
        maxTurns: 100,
      },
      session: { continue: true },
    };

    const resolved = resolveConfig(config);

    expect(resolved.name).toBe("hawk");
    expect(resolved.cwd).toBe("/projects/hawk");
    expect(resolved.systemPrompt).toBe("You are Hawk");
    expect(resolved.agents.scanner.model).toBe("opus");
    expect(resolved.commands.audit.argumentHint).toBe("<dir>");
    expect(resolved.mcpServers.snyk).toBeDefined();
    expect(resolved.hooks.SessionStart?.length).toBe(1);
    expect(resolved.additionalDirectories).toEqual(["/shared"]);
    expect(resolved.settings.maxTurns).toBe(100);
    expect(resolved.session.continue).toBe(true);
  });
});
