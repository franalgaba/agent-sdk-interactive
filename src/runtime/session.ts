/**
 * Agent SDK session wrapper for interactive mode
 *
 * The Agent SDK's query() is programmatic - it doesn't render TUI.
 * To get Claude Code's interactive TUI, we spawn the CLI directly.
 */

import { spawn } from "child_process";
import type { ResolvedConfig, CLIResult } from "../types";

export interface SessionOptions {
  config: ResolvedConfig;
  pluginDir?: string;
}

/**
 * Interactive session that spawns Claude Code CLI with TUI
 */
export class Session {
  private config: ResolvedConfig;
  private pluginDir?: string;
  private abortController: AbortController;
  private sessionId: string = "";

  constructor(options: SessionOptions) {
    this.config = options.config;
    this.pluginDir = options.pluginDir;
    this.abortController = new AbortController();
  }

  /**
   * Start the interactive session by spawning Claude Code CLI
   */
  async start(): Promise<CLIResult> {
    return new Promise((resolve, reject) => {
      // Get CLI command
      const { command, args } = this.getCliCommand();

      // Spawn Claude Code with inherited stdio for TUI
      const child = spawn(command, args, {
        cwd: this.config.cwd,
        stdio: "inherit", // Inherit stdin/stdout/stderr for TUI
        env: {
          ...process.env,
        },
      });

      // Handle abort
      this.abortController.signal.addEventListener("abort", () => {
        child.kill("SIGINT");
      });

      child.on("error", (err) => {
        reject(new Error(`Failed to start Claude Code: ${err.message}`));
      });

      child.on("exit", (code) => {
        resolve({
          sessionId: this.sessionId,
          totalCostUsd: 0, // Not available in CLI mode
          success: code === 0,
        });
      });
    });
  }

  /**
   * Build CLI arguments from config
   */
  private buildCliArgs(): string[] {
    const args: string[] = [];

    // Plugin directory (generated plugin with commands/agents)
    if (this.pluginDir) {
      args.push("--plugin-dir", this.pluginDir);
    }

    // Model
    if (this.config.settings.model) {
      args.push("--model", this.config.settings.model);
    }

    // Permission mode
    if (this.config.settings.permissionMode) {
      if (this.config.settings.permissionMode === "bypassPermissions") {
        args.push("--dangerously-skip-permissions");
      } else if (this.config.settings.permissionMode === "acceptEdits") {
        args.push("--allowedTools", "Edit,Write,MultiEdit");
      } else {
        args.push("--permission-mode", this.config.settings.permissionMode);
      }
    }

    // Max turns
    if (this.config.settings.maxTurns) {
      args.push("--max-turns", String(this.config.settings.maxTurns));
    }

    // Allowed/disallowed tools
    if (this.config.settings.allowedTools && this.config.settings.allowedTools.length > 0) {
      args.push("--allowedTools", this.config.settings.allowedTools.join(","));
    }
    if (this.config.settings.disallowedTools && this.config.settings.disallowedTools.length > 0) {
      args.push("--disallowedTools", this.config.settings.disallowedTools.join(","));
    }

    // System prompt
    if (this.config.systemPrompt) {
      if (typeof this.config.systemPrompt === "string") {
        args.push("--system-prompt", this.config.systemPrompt);
      } else if (this.config.systemPrompt.append) {
        args.push("--append-system-prompt", this.config.systemPrompt.append);
      }
    }

    // Custom instructions (append to system prompt)
    if (this.config.settings.customInstructions) {
      args.push("--append-system-prompt", this.config.settings.customInstructions);
    }

    // Resume session
    if (this.config.session?.resume) {
      args.push("--resume", this.config.session.resume);
    } else if (this.config.session?.continue) {
      args.push("--continue");
    }

    // Additional directories
    for (const dir of this.config.additionalDirectories) {
      args.push("--add-dir", dir);
    }

    return args;
  }

  /**
   * Get CLI command with args for spawning
   */
  private getCliCommand(): { command: string; args: string[] } {
    // Use the globally installed claude command
    return {
      command: "claude",
      args: this.buildCliArgs(),
    };
  }

  /**
   * Interrupt the current session
   */
  interrupt(): void {
    this.abortController.abort();
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * Create a new session
 */
export function createSession(options: SessionOptions): Session {
  return new Session(options);
}
