/**
 * Basic example of claude-code-interactive
 *
 * This example shows the minimal setup to launch Claude Code
 * with custom agents and commands defined in TypeScript.
 *
 * Run with: bun run examples/basic.ts
 */

import { createCLI } from "../src";

const cli = createCLI({
  name: "basic-assistant",

  // Define custom agents (generates .claude/agents/*.md)
  agents: {
    "code-reviewer": {
      description: "Review code for best practices and issues",
      prompt: `You are a code reviewer. When reviewing code:
1. Look for potential bugs and edge cases
2. Check for code style and consistency
3. Suggest improvements for readability
4. Identify any security concerns

Be constructive and explain your suggestions.`,
      tools: ["Read", "Grep", "Glob"],
    },
  },

  // Define custom commands (generates .claude/commands/*.md)
  commands: {
    review: {
      description: "Review current git changes",
      content: `Review the current git diff and provide feedback on the changes.
Focus on:
- Code quality
- Potential bugs
- Best practices
Run \`git diff\` first to see the changes.`,
    },
  },

  // Settings
  settings: {
    model: "claude-sonnet-4-20250514",
    customInstructions: "Be concise and focus on actionable feedback.",
  },
});

// Start the interactive session
console.log("Starting basic assistant...\n");

try {
  const result = await cli.start();
  console.log("\nSession ended.");
  console.log(`Session ID: ${result.sessionId}`);
  console.log(`Total cost: $${result.totalCostUsd.toFixed(4)}`);
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
