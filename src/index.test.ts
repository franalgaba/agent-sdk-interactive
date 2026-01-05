import { describe, expect, test } from "bun:test";
import { createCLI, CLI } from "./index";

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
});
