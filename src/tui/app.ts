/**
 * TUI Application - Main TUI using pi-tui framework
 */

import {
  TUI,
  ProcessTerminal,
  Text,
  Markdown,
  Editor,
  Loader,
  Container,
  Box,
  type Component,
} from "@mariozechner/pi-tui";
import {
  query,
  type SDKMessage,
  type SDKUserMessage,
  type HookCallbackMatcher,
  type HookEvent,
} from "@anthropic-ai/claude-agent-sdk";
import type { ResolvedConfig, CLIResult, HookMatcher } from "../types";
import { createTheme, type Theme, type TUIThemeConfig } from "./theme";

/**
 * Convert our hook format to SDK's HookCallbackMatcher format
 */
function convertHooksToSdkFormat(
  hooks: Partial<Record<string, HookMatcher[]>>
): Partial<Record<HookEvent, HookCallbackMatcher[]>> {
  const result: Partial<Record<HookEvent, HookCallbackMatcher[]>> = {};

  for (const [event, matchers] of Object.entries(hooks)) {
    if (!matchers) continue;

    const sdkMatchers: HookCallbackMatcher[] = [];

    // Group by matcher pattern
    const byMatcher = new Map<string | undefined, HookMatcher[]>();
    for (const m of matchers) {
      if (!m.handler) continue; // Skip shell command hooks in TUI mode
      const key = m.matcher;
      if (!byMatcher.has(key)) byMatcher.set(key, []);
      byMatcher.get(key)!.push(m);
    }

    for (const [matcher, items] of byMatcher) {
      const handlers = items.map(i => i.handler!);
      sdkMatchers.push({
        matcher,
        hooks: handlers,
      });
    }

    if (sdkMatchers.length > 0) {
      result[event as HookEvent] = sdkMatchers;
    }
  }

  return result;
}

export interface TUIAppConfig {
  branding: {
    name: string;
    tagline?: string;
    welcomeMessage?: string;
  };
  theme?: TUIThemeConfig;
}

/**
 * Message queue for streaming input to SDK
 */
class MessageQueue {
  private queue: SDKUserMessage[] = [];
  private resolvers: Array<(value: IteratorResult<SDKUserMessage>) => void> = [];
  private done = false;
  private sessionId = "";

  setSessionId(id: string): void {
    this.sessionId = id;
  }

  push(content: string): void {
    if (this.done) return;

    const message: SDKUserMessage = {
      type: "user",
      session_id: this.sessionId,
      message: { role: "user", content },
      parent_tool_use_id: null,
    };

    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve({ value: message, done: false });
    } else {
      this.queue.push(message);
    }
  }

  close(): void {
    this.done = true;
    for (const resolve of this.resolvers) {
      resolve({ value: undefined as unknown as SDKUserMessage, done: true });
    }
    this.resolvers = [];
  }

  isClosed(): boolean {
    return this.done;
  }

  [Symbol.asyncIterator](): AsyncIterator<SDKUserMessage> {
    return {
      next: (): Promise<IteratorResult<SDKUserMessage>> => {
        if (this.queue.length > 0) {
          return Promise.resolve({ value: this.queue.shift()!, done: false });
        }
        if (this.done) {
          return Promise.resolve({ value: undefined as unknown as SDKUserMessage, done: true });
        }
        return new Promise((resolve) => {
          this.resolvers.push(resolve);
        });
      },
    };
  }
}

/**
 * Streaming text component that updates as tokens arrive
 */
class StreamingText implements Component {
  private text = "";
  private markdown: Markdown;

  constructor(private theme: Theme) {
    this.markdown = new Markdown("", 1, 0, theme.markdown);
  }

  appendText(chunk: string): void {
    this.text += chunk;
    this.markdown.setText(this.text);
  }

  clear(): void {
    this.text = "";
    this.markdown.setText("");
  }

  getText(): string {
    return this.text;
  }

  render(width: number): string[] {
    return this.markdown.render(width);
  }

  invalidate(): void {
    this.markdown.invalidate?.();
  }
}

/**
 * Tool icons mapping
 */
const TOOL_ICONS: Record<string, string> = {
  Read: "📖",
  Write: "✏️",
  Edit: "📝",
  MultiEdit: "📝",
  Bash: "💻",
  Glob: "🔍",
  Grep: "🔎",
  Task: "🤖",
  WebFetch: "🌐",
  WebSearch: "🔍",
  TodoWrite: "📋",
  AskUserQuestion: "❓",
  NotebookEdit: "📓",
};

/**
 * Format tool input for display
 */
function formatToolInput(toolName: string, input: unknown): string {
  if (!input || typeof input !== "object") return "";

  const obj = input as Record<string, unknown>;

  switch (toolName) {
    case "Read":
      return obj.file_path ? String(obj.file_path) : "";
    case "Write":
    case "Edit":
    case "MultiEdit":
      return obj.file_path ? String(obj.file_path) : "";
    case "Bash":
      if (obj.command) {
        const cmd = String(obj.command);
        return cmd.length > 60 ? cmd.slice(0, 57) + "..." : cmd;
      }
      return "";
    case "Glob":
      return obj.pattern ? String(obj.pattern) : "";
    case "Grep":
      return obj.pattern ? String(obj.pattern) : "";
    case "WebFetch":
      return obj.url ? String(obj.url) : "";
    case "WebSearch":
      return obj.query ? String(obj.query) : "";
    case "Task":
      return obj.description ? String(obj.description) : "";
    default:
      return "";
  }
}

/**
 * Tool execution component - shows tool with icon, name, and input
 */
class ToolExecution implements Component {
  private lines: string[] = [];
  private input: unknown;

  constructor(
    private theme: Theme,
    private toolName: string,
    input?: unknown,
    private status: "running" | "done" | "error" = "running"
  ) {
    this.input = input;
    this.updateLines();
  }

  setStatus(status: "running" | "done" | "error"): void {
    this.status = status;
    this.updateLines();
  }

  setInput(input: unknown): void {
    this.input = input;
    this.updateLines();
  }

  private updateLines(): void {
    const icon = TOOL_ICONS[this.toolName] ?? "⚙️";
    const statusIcon = this.getStatusIcon();
    const color = this.getColor();
    const inputStr = formatToolInput(this.toolName, this.input);

    let line = `${statusIcon} ${icon} ${this.toolName}`;
    if (inputStr) {
      line += `: ${this.theme.muted(inputStr)}`;
    }

    this.lines = [color(line)];
  }

  private getStatusIcon(): string {
    switch (this.status) {
      case "running": return "⟳";
      case "done": return "✓";
      case "error": return "✗";
    }
  }

  private getColor(): (s: string) => string {
    switch (this.status) {
      case "running": return (s: string) => s; // No color while running
      case "done": return this.theme.success;
      case "error": return this.theme.error;
    }
  }

  render(_width: number): string[] {
    return this.lines;
  }

  invalidate(): void {
    this.updateLines();
  }
}

/**
 * TUI Application
 */
export class TUIApp {
  private tui: TUI;
  private terminal: ProcessTerminal;
  private theme: Theme;
  private config: ResolvedConfig;
  private appConfig: TUIAppConfig;
  private messageQueue: MessageQueue;
  private abortController: AbortController;

  private header: Text;
  private messagesContainer: Container;
  private loader: Loader | null = null;
  private editor: Editor;
  private currentStreaming: StreamingText | null = null;
  private activeTools: Map<string, ToolExecution> = new Map();
  private pendingToolUse: { id: string; name: string; inputJson: string } | null = null;

  private sessionId = "";
  private totalCost = 0;

  constructor(config: ResolvedConfig, appConfig: TUIAppConfig) {
    this.config = config;
    this.appConfig = appConfig;
    this.theme = createTheme(appConfig.theme);
    this.messageQueue = new MessageQueue();
    this.abortController = new AbortController();

    this.terminal = new ProcessTerminal();
    this.tui = new TUI(this.terminal);

    // Build UI
    this.header = this.createHeader();
    this.messagesContainer = new Container();
    this.editor = this.createEditor();

    this.tui.addChild(this.header);
    this.tui.addChild(this.messagesContainer);
    this.tui.addChild(this.editor);
  }

  private createHeader(): Text {
    const { name, tagline, welcomeMessage } = this.appConfig.branding;
    let headerText = this.theme.bold(this.theme.primary(name));
    if (tagline) {
      headerText += `\n${this.theme.muted(tagline)}`;
    }
    if (welcomeMessage) {
      headerText += `\n\n${welcomeMessage}`;
    }
    return new Text(headerText, 1, 1);
  }

  private createEditor(): Editor {
    const editor = new Editor(this.theme.editor);
    editor.onSubmit = (text) => this.handleSubmit(text);
    return editor;
  }

  private handleSubmit(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Handle special commands
    if (trimmed === "/exit" || trimmed === "/quit" || trimmed === "/q") {
      this.stop();
      return;
    }

    if (trimmed === "/help" || trimmed === "/?") {
      this.addMessage(this.theme.muted(
        "Commands:\n  /help - Show this help\n  /exit - Exit the session"
      ));
      this.tui.requestRender();
      return;
    }

    // Show user message
    this.addMessage(this.theme.dim(`You: ${trimmed}`));

    // Start streaming response
    this.startLoading();

    // Push to message queue
    this.messageQueue.push(trimmed);
  }

  private addMessage(text: string): void {
    const msg = new Text(text, 1, 0);
    this.messagesContainer.addChild(msg);
  }

  private addMarkdown(text: string): void {
    const md = new Markdown(text, 1, 0, this.theme.markdown);
    this.messagesContainer.addChild(md);
  }

  private startLoading(): void {
    if (this.loader) return;
    this.loader = new Loader(
      this.tui,
      this.theme.loader.spinner,
      this.theme.loader.message,
      "Thinking..."
    );
    this.messagesContainer.addChild(this.loader);
    this.loader.start();
  }

  private stopLoading(): void {
    if (this.loader) {
      this.loader.stop();
      this.messagesContainer.removeChild(this.loader);
      this.loader = null;
    }
  }

  private startStreaming(): void {
    this.stopLoading();
    this.currentStreaming = new StreamingText(this.theme);
    this.messagesContainer.addChild(this.currentStreaming);
  }

  private appendStreamingText(text: string): void {
    if (!this.currentStreaming) {
      this.startStreaming();
    }
    this.currentStreaming!.appendText(text);
    this.tui.requestRender();
  }

  private finishStreaming(): void {
    this.currentStreaming = null;
  }

  private showToolStart(toolUseId: string, toolName: string, input?: unknown): void {
    const tool = new ToolExecution(this.theme, toolName, input, "running");
    this.activeTools.set(toolUseId, tool);
    this.messagesContainer.addChild(tool);
    this.tui.requestRender();
  }

  private showToolComplete(toolUseId: string, isError: boolean): void {
    const tool = this.activeTools.get(toolUseId);
    if (tool) {
      tool.setStatus(isError ? "error" : "done");
      this.activeTools.delete(toolUseId);
      this.tui.requestRender();
    }
  }

  private markAllToolsDone(): void {
    if (this.activeTools.size === 0) return;
    for (const tool of this.activeTools.values()) {
      tool.setStatus("done");
    }
    this.activeTools.clear();
    this.tui.requestRender();
  }

  /**
   * Start the TUI application
   */
  async start(): Promise<CLIResult> {
    this.tui.start();
    this.tui.setFocus(this.editor);

    try {
      // Convert hooks to SDK format
      const sdkHooks = convertHooksToSdkFormat(this.config.hooks);

      // Start SDK streaming
      const result = query({
        prompt: this.messageQueue as AsyncIterable<SDKUserMessage>,
        options: {
          includePartialMessages: true,
          cwd: this.config.cwd,
          model: this.config.settings.model,
          maxTurns: this.config.settings.maxTurns,
          maxThinkingTokens: this.config.settings.maxThinkingTokens,
          permissionMode: this.config.settings.permissionMode,
          systemPrompt: this.config.systemPrompt,
          tools: this.config.tools,
          agents: this.config.agents,
          mcpServers: this.config.mcpServers,
          hooks: sdkHooks,
          allowedTools: this.config.settings.allowedTools,
          disallowedTools: this.config.settings.disallowedTools,
          additionalDirectories: this.config.additionalDirectories,
          continue: this.config.session.continue,
          resume: this.config.session.resume,
          abortController: this.abortController,
        },
      });

      // Process messages
      for await (const message of result) {
        this.handleMessage(message);
      }

      return {
        sessionId: this.sessionId,
        totalCostUsd: this.totalCost,
        success: true,
      };
    } catch (error) {
      this.addMessage(this.theme.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      ));
      this.tui.requestRender();

      return {
        sessionId: this.sessionId,
        totalCostUsd: this.totalCost,
        success: false,
      };
    } finally {
      this.tui.stop();
    }
  }

  private handleMessage(message: SDKMessage): void {
    if (message.type === "system" && message.subtype === "init") {
      this.sessionId = message.session_id ?? "";
      this.messageQueue.setSessionId(this.sessionId);
      return;
    }

    if (message.type === "stream_event") {
      this.handleStreamEvent(message);
      return;
    }

    if (message.type === "assistant") {
      // Full message received - handled by streaming
      this.finishStreaming();
      return;
    }

    if (message.type === "tool_progress") {
      // Tool progress - may indicate completion
      const progress = message as { tool_use_id?: string; progress?: string; is_error?: boolean };
      if (progress.tool_use_id && progress.progress === "done") {
        this.showToolComplete(progress.tool_use_id, progress.is_error ?? false);
      }
      return;
    }


    if (message.type === "result") {
      this.stopLoading();
      this.totalCost = message.total_cost_usd ?? 0;

      // Show cost
      this.addMessage(this.theme.muted(
        `─────────────────────────────────────────\n` +
        `Cost: $${this.totalCost.toFixed(4)} | Duration: ${((message.duration_ms ?? 0) / 1000).toFixed(1)}s`
      ));
      this.tui.requestRender();
      return;
    }
  }

  private handleStreamEvent(message: SDKMessage): void {
    const event = (message as {
      event: {
        type: string;
        index?: number;
        content_block?: { type: string; id?: string; name?: string };
        delta?: { type: string; text?: string; partial_json?: string }
      }
    }).event;

    if (event.type === "content_block_start") {
      const block = event.content_block;
      if (block?.type === "text") {
        // Mark any running tools as done before showing text
        this.markAllToolsDone();
        this.startStreaming();
      } else if (block?.type === "tool_use" && block.id && block.name) {
        // Mark previous tools as done before starting new one
        this.markAllToolsDone();
        // Show tool immediately as running
        this.showToolStart(block.id, block.name);
        // Start accumulating tool input
        this.pendingToolUse = { id: block.id, name: block.name, inputJson: "" };
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta?.type === "text_delta" && event.delta.text) {
        this.appendStreamingText(event.delta.text);
      } else if (event.delta?.type === "input_json_delta" && event.delta.partial_json) {
        // Accumulate tool input JSON
        if (this.pendingToolUse) {
          this.pendingToolUse.inputJson += event.delta.partial_json;
        }
      }
    } else if (event.type === "content_block_stop") {
      // If we have a pending tool use, update with parsed input
      if (this.pendingToolUse) {
        const tool = this.activeTools.get(this.pendingToolUse.id);
        if (tool) {
          let input: unknown;
          try {
            input = JSON.parse(this.pendingToolUse.inputJson);
          } catch {
            input = undefined;
          }
          tool.setInput(input);
          this.tui.requestRender();
        }
        this.pendingToolUse = null;
      }
    } else if (event.type === "message_start") {
      this.stopLoading();
    }
  }

  /**
   * Stop the TUI application
   */
  stop(): void {
    this.messageQueue.close();
    this.abortController.abort();
    this.tui.stop();
  }
}

/**
 * Create and start a TUI application
 */
export async function runTUIApp(
  config: ResolvedConfig,
  appConfig: TUIAppConfig
): Promise<CLIResult> {
  const app = new TUIApp(config, appConfig);
  return app.start();
}
