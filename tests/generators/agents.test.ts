import { describe, expect, test } from "bun:test";
import { generateAgentMarkdown, generateAgentFiles } from "../../src/generators/agents";
import type { AgentDefinition } from "../../src/types";

describe("generateAgentMarkdown", () => {
  test("generates minimal agent markdown", () => {
    const agent: AgentDefinition = {
      description: "A test agent",
      prompt: "You are a test agent",
    };

    const markdown = generateAgentMarkdown("test-agent", agent);

    expect(markdown).toContain("---");
    expect(markdown).toContain("name: test-agent");
    expect(markdown).toContain("description: A test agent");
    expect(markdown).toContain("You are a test agent");
  });

  test("includes model when provided", () => {
    const agent: AgentDefinition = {
      description: "Test",
      prompt: "Prompt",
      model: "opus",
    };

    const markdown = generateAgentMarkdown("agent", agent);

    expect(markdown).toContain("model: opus");
  });

  test("includes tools when provided", () => {
    const agent: AgentDefinition = {
      description: "Test",
      prompt: "Prompt",
      tools: ["Read", "Write", "Bash"],
    };

    const markdown = generateAgentMarkdown("agent", agent);

    expect(markdown).toContain("tools: Read, Write, Bash");
  });

  test("does not include model when not provided", () => {
    const agent: AgentDefinition = {
      description: "Test",
      prompt: "Prompt",
    };

    const markdown = generateAgentMarkdown("agent", agent);

    expect(markdown).not.toContain("model:");
  });

  test("does not include tools when empty array", () => {
    const agent: AgentDefinition = {
      description: "Test",
      prompt: "Prompt",
      tools: [],
    };

    const markdown = generateAgentMarkdown("agent", agent);

    expect(markdown).not.toContain("tools:");
  });

  test("escapes special characters in description", () => {
    const agent: AgentDefinition = {
      description: 'Contains "quotes" and: colons',
      prompt: "Prompt",
    };

    const markdown = generateAgentMarkdown("agent", agent);

    // Should be quoted and escaped
    expect(markdown).toContain('"Contains \\"quotes\\" and: colons"');
  });

  test("preserves multiline prompt", () => {
    const agent: AgentDefinition = {
      description: "Test",
      prompt: "Line 1\nLine 2\nLine 3",
    };

    const markdown = generateAgentMarkdown("agent", agent);

    expect(markdown).toContain("Line 1\nLine 2\nLine 3");
  });

  test("generates correct frontmatter structure", () => {
    const agent: AgentDefinition = {
      description: "Test",
      prompt: "Prompt content",
      model: "haiku",
      tools: ["Read"],
    };

    const markdown = generateAgentMarkdown("test", agent);
    const lines = markdown.split("\n");

    expect(lines[0]).toBe("---");
    expect(lines[lines.length - 1]).toBe("Prompt content");
    expect(markdown.indexOf("---")).toBe(0);
    expect(markdown.lastIndexOf("---")).toBeGreaterThan(0);
  });
});

describe("generateAgentFiles", () => {
  test("generates files for all agents", () => {
    const agents: Record<string, AgentDefinition> = {
      reviewer: {
        description: "Code reviewer",
        prompt: "Review code",
      },
      auditor: {
        description: "Security auditor",
        prompt: "Audit security",
      },
    };

    const files = generateAgentFiles(agents, "/base");

    expect(files.length).toBe(2);
  });

  test("generates correct file paths", () => {
    const agents: Record<string, AgentDefinition> = {
      "code-reviewer": {
        description: "Reviewer",
        prompt: "Review",
      },
    };

    const files = generateAgentFiles(agents, "/base");

    expect(files[0].path).toBe("/base/agents/code-reviewer.md");
  });

  test("sanitizes filenames", () => {
    const agents: Record<string, AgentDefinition> = {
      "My Agent Name!": {
        description: "Test",
        prompt: "Test",
      },
    };

    const files = generateAgentFiles(agents, "/base");

    expect(files[0].path).toBe("/base/agents/my-agent-name.md");
  });

  test("returns empty array for no agents", () => {
    const files = generateAgentFiles({}, "/base");

    expect(files).toEqual([]);
  });

  test("includes content in generated files", () => {
    const agents: Record<string, AgentDefinition> = {
      test: {
        description: "Test description",
        prompt: "Test prompt",
      },
    };

    const files = generateAgentFiles(agents, "/base");

    expect(files[0].content).toContain("Test description");
    expect(files[0].content).toContain("Test prompt");
  });
});
