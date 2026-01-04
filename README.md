# claude-code-interactive

TypeScript SDK for building custom CLIs powered by Claude. Create branded AI assistants with custom agents, commands, and a beautiful TUI.

## Features

- **Two Modes**:
  - `spawn` - Spawn Claude Code CLI with your custom plugins (full Claude Code TUI)
  - `tui` - Custom TUI using pi-tui framework with SDK streaming
- **Custom Agents** - Define specialized agents in TypeScript
- **Custom Commands** - Create slash commands (e.g., `/review`, `/audit`)
- **Custom Branding** - Your name, colors, welcome message
- **Tool Display** - Real-time tool execution with icons and status
- **Streaming** - Live markdown rendering as Claude responds

## Installation

```bash
bun add claude-code-interactive
```

## Quick Start

### Spawn Mode (Default)

Uses Claude Code's native TUI with your custom agents and commands:

```typescript
import { createCLI } from "claude-code-interactive";

await createCLI({
  name: "my-assistant",

  // Custom agents
  agents: {
    "code-reviewer": {
      description: "Review code for best practices",
      prompt: "You are a code reviewer...",
      tools: ["Read", "Grep", "Glob"],
    },
  },

  // Custom commands
  commands: {
    review: {
      description: "Review current git changes",
      content: "Review the git diff and provide feedback...",
    },
  },

  settings: {
    model: "claude-sonnet-4-20250514",
  },
}).start();
```

### TUI Mode

Custom branded TUI with full control over appearance:

```typescript
import { createCLI } from "claude-code-interactive";

await createCLI({
  name: "hawk",
  mode: "tui",

  tui: {
    branding: {
      name: "Hawk",
      tagline: "AI Security Auditor",
      welcomeMessage: "Ready to audit your code for vulnerabilities.",
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

  settings: {
    model: "claude-sonnet-4-20250514",
  },
}).start();
```

## Configuration

### CLIConfig

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Name of your CLI application |
| `mode` | `"spawn" \| "tui"` | Execution mode (default: `"spawn"`) |
| `cwd` | `string` | Working directory (default: `process.cwd()`) |
| `agents` | `Record<string, AgentDefinition>` | Custom agents |
| `commands` | `Record<string, CommandDefinition>` | Custom slash commands |
| `mcpServers` | `Record<string, McpServerConfig>` | MCP server configurations |
| `hooks` | `Record<HookEvent, HookMatcher[]>` | Event hooks |
| `settings` | `object` | Model and behavior settings |
| `tui` | `TUIConfig` | TUI customization (for `tui` mode) |

### AgentDefinition

```typescript
interface AgentDefinition {
  description: string;  // When to use this agent
  prompt: string;       // System prompt for the agent
  model?: "sonnet" | "opus" | "haiku" | "inherit";
  tools?: string[];     // Allowed tools
}
```

### CommandDefinition

```typescript
interface CommandDefinition {
  description: string;   // Shown in /help
  content: string;       // Prompt when invoked
  argumentHint?: string; // e.g., "<file>"
  allowedTools?: string[];
}
```

### TUIConfig

```typescript
interface TUIConfig {
  branding: {
    name: string;           // App name in header
    tagline?: string;       // Subtitle
    welcomeMessage?: string;
    promptPrefix?: string;  // Default: "> "
  };
  theme?: {
    colors?: {
      primary?: string;
      success?: string;
      error?: string;
      muted?: string;
    };
  };
  display?: {
    showToolProgress?: boolean;
    showThinking?: boolean;
    showCost?: boolean;
  };
}
```

## Tool Display

The TUI shows tool executions in real-time with icons:

```
⟳ 📖 Read: src/index.ts
✓ 💻 Bash: npm test
⟳ 🔍 Grep: TODO
✓ 🌐 WebFetch: https://api.example.com
```

**Status Icons:**
- `⟳` Running
- `✓` Completed
- `✗` Error

**Tool Icons:**
- 📖 Read
- ✏️ Write
- 📝 Edit
- 💻 Bash
- 🔍 Glob / WebSearch
- 🔎 Grep
- 🌐 WebFetch
- 🤖 Task
- 📋 TodoWrite

## Examples

Run the examples:

```bash
# Basic example with agents and commands
bun run examples/basic.ts

# Custom TUI mode
bun run examples/tui-mode.ts
```

## Architecture

```
src/
├── cli.ts              # Main CLI class (spawn/tui mode selection)
├── types.ts            # TypeScript type definitions
├── index.ts            # Public exports
├── config/
│   ├── schema.ts       # Zod validation schemas
│   └── defaults.ts     # Default configuration
├── generators/
│   └── plugin.ts       # Claude Code plugin generation
├── runtime/
│   └── session.ts      # Spawn mode session management
└── tui/
    ├── index.ts        # TUI exports
    ├── app.ts          # Main TUI application (pi-tui)
    └── theme.ts        # Color theming with chalk
```

## Dependencies

- `@anthropic-ai/claude-agent-sdk` - Claude Agent SDK for streaming
- `@mariozechner/pi-tui` - TUI framework with differential rendering
- `chalk` - Terminal colors
- `zod` - Configuration validation

## Requirements

- Bun >= 1.0.0
- Claude Code CLI (for spawn mode)
- `ANTHROPIC_API_KEY` environment variable

## License

MIT
