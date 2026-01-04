#!/usr/bin/env bun
/**
 * TUI Mode Example - Custom TUI using pi-tui framework
 *
 * Run with: bun run examples/tui-mode.ts
 *
 * This demonstrates the custom TUI mode which uses:
 * - @mariozechner/pi-tui for rendering (differential, flicker-free)
 * - Claude Agent SDK streaming for responses
 * - Custom branding and theming
 */

import { createCLI } from "../src";

const result = await createCLI({
  name: "hawk",

  // Enable TUI mode (custom TUI with pi-tui)
  mode: "tui",

  // TUI customization
  tui: {
    branding: {
      name: "Hawk",
      tagline: "AI Security Auditor",
      welcomeMessage: "Welcome! I can help you audit code for security vulnerabilities.\nType /help for commands, /exit to quit.",
    },
    theme: {
      colors: {
        primary: "#F59E0B",   // Amber
        accent: "#3B82F6",    // Blue
        success: "#10B981",   // Green
        error: "#EF4444",     // Red
        muted: "#6B7280",     // Gray
      },
    },
  },

  // Settings
  settings: {
    model: "claude-sonnet-4-20250514",
  },
}).start();

console.log("\nSession ended:", result.success ? "success" : "error");
if (result.totalCostUsd > 0) {
  console.log(`Total cost: $${result.totalCostUsd.toFixed(4)}`);
}
