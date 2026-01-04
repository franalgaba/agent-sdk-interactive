#!/usr/bin/env bun
/**
 * Quick demo - run with: bun run examples/try-it.ts
 *
 * This generates a plugin with custom commands/agents and launches
 * Claude Code's full TUI with all features.
 */

import { createCLI } from "../src";

console.log("Generating plugin and launching Claude Code...\n");

const result = await createCLI({
  name: "demo-assistant",

  // Custom agents - available via Task tool
  agents: {
    explainer: {
      description: "Explain code concepts simply",
      prompt: "You explain code concepts in simple terms. Be concise and use examples.",
      tools: ["Read", "Glob"],
    },
    "security-checker": {
      description: "Check code for security issues",
      prompt: "You analyze code for security vulnerabilities. Be thorough but concise.",
      tools: ["Read", "Glob", "Grep"],
    },
  },

  // Custom commands - available as /hello, /audit
  commands: {
    hello: {
      description: "Say hello and describe capabilities",
      content: "Say hello and briefly describe what you can do, including the custom agents available.",
    },
    audit: {
      description: "Run a quick security audit",
      content: "Do a quick security scan of the current project. Look for common issues.",
    },
  },

  // Settings
  settings: {
    model: "claude-sonnet-4-20250514",
  },
}).start();

console.log("\nSession ended:", result.success ? "success" : "error");
