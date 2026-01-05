import { describe, expect, test, mock, beforeEach } from "bun:test";
import { CLI, createCLI } from "./cli";
import type { CLIConfig, ResolvedConfig } from "./types";

describe("createCLI", () => {
  test("returns CLI instance", () => {
    const cli = createCLI({ name: "test" });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts minimal config", () => {
    const cli = createCLI({});
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts full config", () => {
    const cli = createCLI({
      name: "my-assistant",
      cwd: "/tmp",
      agents: {
        reviewer: {
          description: "Review code",
          prompt: "You are a code reviewer",
        },
      },
      commands: {
        review: {
          description: "Review changes",
          content: "Review the current changes",
        },
      },
      settings: {
        model: "claude-sonnet-4-20250514",
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with all agent options", () => {
    const cli = createCLI({
      agents: {
        full: {
          description: "Full agent",
          prompt: "Full prompt",
          model: "opus",
          tools: ["Read", "Write"],
        },
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with all command options", () => {
    const cli = createCLI({
      commands: {
        full: {
          description: "Full command",
          content: "Full content",
          argumentHint: "<file>",
          allowedTools: ["Read"],
        },
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with MCP servers", () => {
    const cli = createCLI({
      mcpServers: {
        postgres: {
          command: "npx",
          args: ["@mcp/postgres"],
        },
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with hooks", () => {
    const cli = createCLI({
      hooks: {
        PreToolUse: [
          { command: "echo pre" },
        ],
        PostToolUse: [
          { handler: async () => ({ continue: true }) },
        ],
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with system prompt string", () => {
    const cli = createCLI({
      systemPrompt: "You are a helpful assistant",
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with system prompt preset", () => {
    const cli = createCLI({
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: "Be extra helpful",
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with tools array", () => {
    const cli = createCLI({
      tools: ["Read", "Write", "Bash"],
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with tools preset", () => {
    const cli = createCLI({
      tools: { type: "preset", preset: "claude_code" },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with all settings", () => {
    const cli = createCLI({
      settings: {
        allowedTools: ["Read"],
        disallowedTools: ["Bash"],
        model: "claude-opus-4-20250514",
        customInstructions: "Be helpful",
        permissionMode: "acceptEdits",
        maxTurns: 100,
        maxThinkingTokens: 5000,
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with session options", () => {
    const cli = createCLI({
      session: {
        resume: "session-123",
        continue: true,
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts config with TUI options", () => {
    const cli = createCLI({
      mode: "tui",
      tui: {
        branding: {
          name: "Hawk",
          tagline: "Security Auditor",
          welcomeMessage: "Welcome!",
        },
        theme: {
          colors: {
            primary: "#FF0000",
          },
        },
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts spawn mode", () => {
    const cli = createCLI({
      mode: "spawn",
    });
    expect(cli).toBeInstanceOf(CLI);
  });
});

describe("CLI class", () => {
  test("can be instantiated directly", () => {
    const cli = new CLI({ name: "direct" });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("getSessionId returns null before start", () => {
    const cli = new CLI({ name: "test" });
    expect(cli.getSessionId()).toBeNull();
  });

  test("getResolvedConfig returns null before start", () => {
    const cli = new CLI({ name: "test" });
    expect(cli.getResolvedConfig()).toBeNull();
  });

  test("interrupt can be called without error", () => {
    const cli = new CLI({ name: "test" });
    // Should not throw
    expect(() => cli.interrupt()).not.toThrow();
  });

  test("cleanup can be called without error", async () => {
    const cli = new CLI({ name: "test" });
    // Should not throw
    await expect(cli.cleanup()).resolves.toBeUndefined();
  });
});

describe("CLI config validation", () => {
  // Note: CLI validates lazily when start() is called, not at construction time.
  // The schema validation is tested in schema.test.ts

  test("accepts config that would fail validation later", () => {
    // CLI doesn't validate at construction - it validates at start()
    // This is intentional to allow config to be built up incrementally
    const cli = createCLI({
      agents: {
        test: {
          description: "Valid description",
          prompt: "Valid prompt",
        },
      },
    });
    expect(cli).toBeInstanceOf(CLI);
  });
});

describe("CLI mode selection", () => {
  test("defaults to tui mode", () => {
    const cli = createCLI({ name: "test" });
    // Can't directly test mode, but can verify config is accepted
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts explicit tui mode", () => {
    const cli = createCLI({
      name: "test",
      mode: "tui",
    });
    expect(cli).toBeInstanceOf(CLI);
  });

  test("accepts explicit spawn mode", () => {
    const cli = createCLI({
      name: "test",
      mode: "spawn",
    });
    expect(cli).toBeInstanceOf(CLI);
  });
});

describe("CLI with complex configurations", () => {
  test("handles full Hawk-style config", () => {
    const cli = createCLI({
      name: "hawk",
      mode: "tui",
      tui: {
        branding: {
          name: "Hawk",
          tagline: "AI Security Auditor",
          welcomeMessage: "Ready to audit your code.",
        },
        theme: {
          colors: {
            primary: "#F59E0B",
            accent: "#3B82F6",
            success: "#10B981",
            error: "#EF4444",
          },
        },
      },
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: "Focus on security best practices.",
      },
      agents: {
        "vuln-scanner": {
          description: "Scan for security vulnerabilities",
          prompt: "You are an expert at finding security vulnerabilities",
          tools: ["Read", "Grep", "Glob"],
        },
        "secrets-detector": {
          description: "Find exposed secrets",
          prompt: "You scan code for hardcoded secrets",
          model: "haiku",
        },
      },
      commands: {
        audit: {
          description: "Full security audit",
          content: "Perform comprehensive security audit",
          allowedTools: ["Read", "Grep", "Glob", "Bash"],
        },
        secrets: {
          description: "Scan for secrets",
          content: "Find any exposed secrets or credentials",
        },
      },
      mcpServers: {
        snyk: {
          command: "npx",
          args: ["snyk-mcp-server"],
        },
      },
      hooks: {
        PreToolUse: [
          {
            matcher: "Bash",
            handler: async () => ({ continue: true }),
          },
        ],
        SessionStart: [
          {
            command: "echo 'Hawk session started'",
          },
        ],
      },
      settings: {
        model: "claude-sonnet-4-20250514",
        permissionMode: "default",
        maxTurns: 100,
      },
      additionalDirectories: ["/shared/libs"],
    });

    expect(cli).toBeInstanceOf(CLI);
  });

  test("handles devops assistant config", () => {
    const cli = createCLI({
      name: "ops",
      agents: {
        "k8s-expert": {
          description: "Kubernetes specialist",
          prompt: "You are a Kubernetes expert",
          tools: ["Read", "Bash", "Grep"],
        },
        "ci-helper": {
          description: "CI/CD pipeline helper",
          prompt: "You help with CI/CD pipelines",
          model: "sonnet",
        },
      },
      commands: {
        deploy: {
          description: "Help with deployment",
          content: "Guide through deployment process",
        },
        debug: {
          description: "Debug infrastructure",
          content: "Help debug infrastructure issues",
          argumentHint: "<service>",
        },
      },
      settings: {
        customInstructions: "Always check for security implications",
      },
    });

    expect(cli).toBeInstanceOf(CLI);
  });
});
