import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import * as fs from "fs/promises";
import * as path from "path";
import { generatePlugin, cleanupPlugin } from "./plugin";
import type { ResolvedConfig } from "../types";

// Test directory
const TEST_DIR = "/tmp/plugin-test-" + Date.now();

function createTestConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    name: "test-plugin",
    cwd: process.cwd(),
    agents: {},
    commands: {},
    mcpServers: {},
    hooks: {},
    settingSources: ["project"],
    additionalDirectories: [],
    settings: { maxTurns: 500 },
    session: {},
    ...overrides,
  };
}

describe("generatePlugin", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await cleanupPlugin(TEST_DIR);
  });

  test("creates plugin manifest", async () => {
    const config = createTestConfig();
    await generatePlugin(config, TEST_DIR);

    const manifestPath = path.join(TEST_DIR, ".claude-plugin", "plugin.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

    expect(manifest.name).toBe("test-plugin");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.description).toContain("test-plugin");
  });

  test("creates commands directory and files", async () => {
    const config = createTestConfig({
      commands: {
        review: {
          description: "Review code",
          content: "Review this code",
        },
        deploy: {
          description: "Deploy app",
          content: "Deploy the app",
        },
      },
    });

    const files = await generatePlugin(config, TEST_DIR);

    const commandsDir = path.join(TEST_DIR, "commands");
    const dirExists = await fs.stat(commandsDir).catch(() => null);
    expect(dirExists).not.toBeNull();

    const reviewPath = path.join(commandsDir, "review.md");
    const reviewContent = await fs.readFile(reviewPath, "utf-8");
    expect(reviewContent).toContain("description: Review code");
    expect(reviewContent).toContain("Review this code");

    expect(files.some(f => f.includes("review.md"))).toBe(true);
    expect(files.some(f => f.includes("deploy.md"))).toBe(true);
  });

  test("creates agents directory and files", async () => {
    const config = createTestConfig({
      agents: {
        auditor: {
          description: "Security auditor",
          prompt: "You audit security",
          model: "opus",
          tools: ["Read", "Grep"],
        },
      },
    });

    const files = await generatePlugin(config, TEST_DIR);

    const agentsDir = path.join(TEST_DIR, "agents");
    const dirExists = await fs.stat(agentsDir).catch(() => null);
    expect(dirExists).not.toBeNull();

    const agentPath = path.join(agentsDir, "auditor.md");
    const agentContent = await fs.readFile(agentPath, "utf-8");
    expect(agentContent).toContain("description: Security auditor");
    expect(agentContent).toContain("model: opus");
    expect(agentContent).toContain("tools: Read, Grep");
    expect(agentContent).toContain("You audit security");

    expect(files.some(f => f.includes("auditor.md"))).toBe(true);
  });

  test("creates hooks directory and file when hooks defined", async () => {
    const config = createTestConfig({
      hooks: {
        PreToolUse: [
          { matcher: "Bash", command: "echo 'Pre bash'" },
        ],
        SessionStart: [
          { command: "echo 'Session started'" },
        ],
      },
    });

    const files = await generatePlugin(config, TEST_DIR);

    const hooksPath = path.join(TEST_DIR, "hooks", "hooks.json");
    const hooksContent = JSON.parse(await fs.readFile(hooksPath, "utf-8"));

    expect(hooksContent.PreToolUse).toBeDefined();
    expect(hooksContent.PreToolUse[0].matcher).toBe("Bash");
    expect(hooksContent.PreToolUse[0].command).toBe("echo 'Pre bash'");

    expect(hooksContent.SessionStart).toBeDefined();
    expect(hooksContent.SessionStart[0].command).toBe("echo 'Session started'");

    expect(files.some(f => f.includes("hooks.json"))).toBe(true);
  });

  test("creates README", async () => {
    const config = createTestConfig({
      commands: {
        review: {
          description: "Review code",
          content: "Review",
        },
      },
      agents: {
        auditor: {
          description: "Audit code",
          prompt: "Audit",
        },
      },
    });

    const files = await generatePlugin(config, TEST_DIR);

    const readmePath = path.join(TEST_DIR, "README.md");
    const readme = await fs.readFile(readmePath, "utf-8");

    expect(readme).toContain("# test-plugin");
    expect(readme).toContain("## Commands");
    expect(readme).toContain("`/review`");
    expect(readme).toContain("## Agents");
    expect(readme).toContain("**auditor**");

    expect(files.some(f => f.includes("README.md"))).toBe(true);
  });

  test("does not create commands dir when no commands", async () => {
    const config = createTestConfig({ commands: {} });
    await generatePlugin(config, TEST_DIR);

    const commandsDir = path.join(TEST_DIR, "commands");
    const dirExists = await fs.stat(commandsDir).catch(() => null);
    expect(dirExists).toBeNull();
  });

  test("does not create agents dir when no agents", async () => {
    const config = createTestConfig({ agents: {} });
    await generatePlugin(config, TEST_DIR);

    const agentsDir = path.join(TEST_DIR, "agents");
    const dirExists = await fs.stat(agentsDir).catch(() => null);
    expect(dirExists).toBeNull();
  });

  test("does not create hooks dir when no hooks", async () => {
    const config = createTestConfig({ hooks: {} });
    await generatePlugin(config, TEST_DIR);

    const hooksDir = path.join(TEST_DIR, "hooks");
    const dirExists = await fs.stat(hooksDir).catch(() => null);
    expect(dirExists).toBeNull();
  });

  test("returns list of generated files", async () => {
    const config = createTestConfig({
      commands: {
        cmd1: { description: "Cmd 1", content: "Content 1" },
      },
      agents: {
        agent1: { description: "Agent 1", prompt: "Prompt 1" },
      },
    });

    const files = await generatePlugin(config, TEST_DIR);

    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes("plugin.json"))).toBe(true);
    expect(files.some(f => f.includes("cmd1.md"))).toBe(true);
    expect(files.some(f => f.includes("agent1.md"))).toBe(true);
    expect(files.some(f => f.includes("README.md"))).toBe(true);
  });

  test("handles command with all options", async () => {
    const config = createTestConfig({
      commands: {
        full: {
          description: "Full command",
          content: "Full content",
          argumentHint: "<file>",
          allowedTools: ["Read", "Write"],
        },
      },
    });

    await generatePlugin(config, TEST_DIR);

    const commandPath = path.join(TEST_DIR, "commands", "full.md");
    const content = await fs.readFile(commandPath, "utf-8");

    expect(content).toContain("description: Full command");
    expect(content).toContain("argument_hint: <file>");
    expect(content).toContain("allowed_tools: Read, Write");
  });

  test("handles agent with inherit model", async () => {
    const config = createTestConfig({
      agents: {
        inheritor: {
          description: "Inheriting agent",
          prompt: "Inherit model",
          model: "inherit",
        },
      },
    });

    await generatePlugin(config, TEST_DIR);

    const agentPath = path.join(TEST_DIR, "agents", "inheritor.md");
    const content = await fs.readFile(agentPath, "utf-8");

    // Should not include model when it's "inherit"
    expect(content).not.toContain("model:");
  });
});

describe("cleanupPlugin", () => {
  test("removes plugin directory", async () => {
    const tempDir = "/tmp/cleanup-test-" + Date.now();
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, "test.txt"), "test");

    await cleanupPlugin(tempDir);

    const exists = await fs.stat(tempDir).catch(() => null);
    expect(exists).toBeNull();
  });

  test("handles non-existent directory gracefully", async () => {
    const nonExistent = "/tmp/does-not-exist-" + Date.now();

    // Should not throw
    await expect(cleanupPlugin(nonExistent)).resolves.toBeUndefined();
  });

  test("removes nested directories", async () => {
    const tempDir = "/tmp/nested-cleanup-" + Date.now();
    await fs.mkdir(path.join(tempDir, "deep", "nested"), { recursive: true });
    await fs.writeFile(path.join(tempDir, "deep", "nested", "file.txt"), "test");

    await cleanupPlugin(tempDir);

    const exists = await fs.stat(tempDir).catch(() => null);
    expect(exists).toBeNull();
  });
});
