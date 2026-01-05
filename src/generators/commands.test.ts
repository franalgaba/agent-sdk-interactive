import { describe, expect, test } from "bun:test";
import { generateCommandMarkdown, generateCommandFiles } from "./commands";
import type { CommandDefinition } from "../types";

describe("generateCommandMarkdown", () => {
  test("generates minimal command markdown", () => {
    const command: CommandDefinition = {
      description: "Test command",
      content: "Do something",
    };

    const markdown = generateCommandMarkdown("test", command);

    expect(markdown).toContain("---");
    expect(markdown).toContain("description: Test command");
    expect(markdown).toContain("Do something");
  });

  test("includes argumentHint when provided", () => {
    const command: CommandDefinition = {
      description: "Test",
      content: "Content",
      argumentHint: "<file>",
    };

    const markdown = generateCommandMarkdown("cmd", command);

    expect(markdown).toContain("argument-hint: <file>");
  });

  test("includes allowedTools when provided", () => {
    const command: CommandDefinition = {
      description: "Test",
      content: "Content",
      allowedTools: ["Read", "Bash", "Grep"],
    };

    const markdown = generateCommandMarkdown("cmd", command);

    expect(markdown).toContain("allowed-tools: Read, Bash, Grep");
  });

  test("does not include argumentHint when not provided", () => {
    const command: CommandDefinition = {
      description: "Test",
      content: "Content",
    };

    const markdown = generateCommandMarkdown("cmd", command);

    expect(markdown).not.toContain("argument-hint:");
  });

  test("does not include allowedTools when empty", () => {
    const command: CommandDefinition = {
      description: "Test",
      content: "Content",
      allowedTools: [],
    };

    const markdown = generateCommandMarkdown("cmd", command);

    expect(markdown).not.toContain("allowed-tools:");
  });

  test("escapes special characters in description", () => {
    const command: CommandDefinition = {
      description: 'Has "quotes" and: colons',
      content: "Content",
    };

    const markdown = generateCommandMarkdown("cmd", command);

    expect(markdown).toContain('"Has \\"quotes\\" and: colons"');
  });

  test("preserves multiline content", () => {
    const command: CommandDefinition = {
      description: "Test",
      content: "Step 1\nStep 2\nStep 3",
    };

    const markdown = generateCommandMarkdown("cmd", command);

    expect(markdown).toContain("Step 1\nStep 2\nStep 3");
  });

  test("generates correct frontmatter structure", () => {
    const command: CommandDefinition = {
      description: "Test",
      content: "Content here",
      argumentHint: "<arg>",
      allowedTools: ["Read"],
    };

    const markdown = generateCommandMarkdown("test", command);
    const lines = markdown.split("\n");

    expect(lines[0]).toBe("---");
    expect(markdown).toContain("---\n\nContent here");
  });
});

describe("generateCommandFiles", () => {
  test("generates files for all commands", () => {
    const commands: Record<string, CommandDefinition> = {
      review: {
        description: "Review code",
        content: "Review this code",
      },
      deploy: {
        description: "Deploy app",
        content: "Deploy the application",
      },
    };

    const files = generateCommandFiles(commands, "/base");

    expect(files.length).toBe(2);
  });

  test("generates correct file paths", () => {
    const commands: Record<string, CommandDefinition> = {
      "run-tests": {
        description: "Run tests",
        content: "Execute test suite",
      },
    };

    const files = generateCommandFiles(commands, "/base");

    expect(files[0].path).toBe("/base/commands/run-tests.md");
  });

  test("sanitizes filenames", () => {
    const commands: Record<string, CommandDefinition> = {
      "My Command!": {
        description: "Test",
        content: "Test",
      },
    };

    const files = generateCommandFiles(commands, "/base");

    expect(files[0].path).toBe("/base/commands/my-command.md");
  });

  test("returns empty array for no commands", () => {
    const files = generateCommandFiles({}, "/base");

    expect(files).toEqual([]);
  });

  test("includes content in generated files", () => {
    const commands: Record<string, CommandDefinition> = {
      test: {
        description: "Test description",
        content: "Test content",
      },
    };

    const files = generateCommandFiles(commands, "/base");

    expect(files[0].content).toContain("Test description");
    expect(files[0].content).toContain("Test content");
  });

  test("handles special characters in command names", () => {
    const commands: Record<string, CommandDefinition> = {
      "code--review": {
        description: "Review",
        content: "Review code",
      },
    };

    const files = generateCommandFiles(commands, "/base");

    // Should collapse multiple dashes
    expect(files[0].path).toBe("/base/commands/code-review.md");
  });

  test("handles leading/trailing special characters", () => {
    const commands: Record<string, CommandDefinition> = {
      "-test-": {
        description: "Test",
        content: "Test",
      },
    };

    const files = generateCommandFiles(commands, "/base");

    expect(files[0].path).toBe("/base/commands/test.md");
  });
});
