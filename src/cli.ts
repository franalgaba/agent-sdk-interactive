/**
 * CLI class - orchestrates plugin generation and interactive session
 *
 * Supports two modes:
 * - 'spawn' (default): Spawns Claude Code CLI with plugin for full TUI
 * - 'tui': Custom TUI using pi-tui framework with SDK streaming
 */

import * as os from "os";
import * as path from "path";
import type { CLIConfig, CLIResult, ResolvedConfig } from "./types";
import { validateConfig } from "./config/schema";
import { resolveConfig } from "./config/defaults";
import { Session, createSession } from "./runtime/session";
import { generatePlugin, cleanupPlugin } from "./generators/plugin";
import { runTUIApp, type TUIAppConfig } from "./tui";

/**
 * CLI instance for managing interactive Claude Code sessions
 */
export class CLI {
  private userConfig: CLIConfig;
  private resolvedConfig: ResolvedConfig | null = null;
  private pluginDir: string | null = null;
  private session: Session | null = null;

  constructor(config: CLIConfig) {
    this.userConfig = config;
  }

  /**
   * Start the interactive CLI session
   *
   * Mode 'spawn' (default):
   * 1. Generates plugin with custom commands/agents
   * 2. Spawns Claude Code CLI with --plugin-dir
   *
   * Mode 'tui':
   * 1. Starts custom TUI using pi-tui framework
   * 2. Uses SDK streaming for responses
   */
  async start(): Promise<CLIResult> {
    try {
      // Validate and resolve config
      this.resolvedConfig = this.validateAndResolve();

      // Determine mode
      const mode = this.userConfig.mode ?? "spawn";

      if (mode === "tui" && this.userConfig.tui) {
        return await this.startTUIMode();
      }

      return await this.startSpawnMode();
    } finally {
      // Always cleanup plugin on exit
      await this.cleanup();
    }
  }

  /**
   * Start in spawn mode (Claude Code CLI with plugin)
   */
  private async startSpawnMode(): Promise<CLIResult> {
    // Generate plugin if we have commands or agents
    const hasCustomContent =
      Object.keys(this.resolvedConfig!.commands).length > 0 ||
      Object.keys(this.resolvedConfig!.agents).length > 0 ||
      Object.keys(this.resolvedConfig!.hooks).length > 0;

    if (hasCustomContent) {
      this.pluginDir = await this.generatePluginDir();
    }

    // Create and start session
    this.session = createSession({
      config: this.resolvedConfig!,
      pluginDir: this.pluginDir ?? undefined,
    });

    return await this.session.start();
  }

  /**
   * Start in TUI mode (custom pi-tui with SDK streaming)
   */
  private async startTUIMode(): Promise<CLIResult> {
    const tuiConfig = this.userConfig.tui!;

    const appConfig: TUIAppConfig = {
      branding: {
        name: tuiConfig.branding.name,
        tagline: tuiConfig.branding.tagline,
        welcomeMessage: tuiConfig.branding.welcomeMessage,
      },
      theme: tuiConfig.theme ? {
        colors: tuiConfig.theme.colors,
      } : undefined,
    };

    return await runTUIApp(this.resolvedConfig!, appConfig);
  }

  /**
   * Generate a plugin in a temp directory
   */
  private async generatePluginDir(): Promise<string> {
    // Create temp directory for plugin
    const tmpDir = os.tmpdir();
    const pluginDir = path.join(tmpDir, `claude-plugin-${this.resolvedConfig!.name}-${Date.now()}`);

    await generatePlugin(this.resolvedConfig!, pluginDir);
    return pluginDir;
  }

  /**
   * Clean up generated plugin
   */
  async cleanup(): Promise<void> {
    if (this.pluginDir) {
      await cleanupPlugin(this.pluginDir);
      this.pluginDir = null;
    }
  }

  /**
   * Interrupt the current session
   */
  interrupt(): void {
    if (this.session) {
      this.session.interrupt();
    }
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.session?.getSessionId() ?? null;
  }

  /**
   * Get the resolved configuration
   */
  getResolvedConfig(): ResolvedConfig | null {
    return this.resolvedConfig;
  }

  /**
   * Validate and resolve the configuration
   */
  private validateAndResolve(): ResolvedConfig {
    // Validate with Zod (use type assertion since Zod can't infer HookCallback)
    const validated = validateConfig(this.userConfig) as CLIConfig;

    // Resolve with defaults
    return resolveConfig(validated);
  }
}

/**
 * Create a new CLI instance
 *
 * @example
 * ```typescript
 * import { createCLI } from 'claude-code-interactive';
 *
 * await createCLI({
 *   name: 'my-assistant',
 *   agents: {
 *     'code-reviewer': {
 *       description: 'Review code for issues',
 *       prompt: 'You are a code reviewer...',
 *     },
 *   },
 * }).start();
 * ```
 */
export function createCLI(config: CLIConfig): CLI {
  return new CLI(config);
}
