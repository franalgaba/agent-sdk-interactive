# coding-agent-builder

Build **custom branded coding agents** using Claude Code's powerful harness and the Anthropic Agent SDK. Create your own AI coding assistant with your company's branding, specialized agents, custom commands, MCP integrations, and hooks.

## Why This SDK?

Claude Code is a powerful AI coding assistant, but you can't customize its branding or extend it with domain-specific capabilities. This SDK gives you **full access to Claude Code's infrastructure** while letting you customize everything:

| Feature | What You Can Do |
|---------|-----------------|
| **Branding** | Custom name, colors, welcome message, prompts |
| **Agents** | Specialized sub-agents (security, review, devops) |
| **Commands** | Custom slash commands (`/audit`, `/deploy`) |
| **MCP Servers** | Connect databases, APIs, custom tools |
| **Hooks** | Intercept tool calls, add logging, enforce policies |
| **Tools** | Use Claude Code's built-in tools or restrict them |
| **Permissions** | Control what your agent can access |

### Build Tools Like

- `hawk` - Security-focused code auditor
- `devops-ai` - Infrastructure and deployment assistant
- `code-mentor` - Onboarding tool for new developers
- `db-assistant` - Database query helper with MCP

## Installation

```bash
bun add @franalgaba/coding-agent-builder
```

## Quick Start

```typescript
import { createCLI } from "@franalgaba/coding-agent-builder";

await createCLI({
  name: "hawk",

  agents: {
    "security-auditor": {
      description: "Audit code for security vulnerabilities",
      prompt: "You are a security expert...",
    },
  },

  commands: {
    audit: {
      description: "Run security audit",
      content: "Perform a security audit of this codebase.",
    },
  },
}).start();
```

---

## Features

### Custom Agents

Define specialized sub-agents that Claude can delegate to:

```typescript
createCLI({
  agents: {
    "security-auditor": {
      description: "Use for security vulnerability scanning",
      prompt: `You are a security expert. When auditing:
        1. Check for OWASP Top 10 vulnerabilities
        2. Look for hardcoded secrets
        3. Review auth/authz patterns
        4. Identify injection risks`,
      model: "opus",  // Use stronger model for security
      tools: ["Read", "Grep", "Glob", "Bash"],
    },

    "perf-analyzer": {
      description: "Use for performance analysis",
      prompt: "You analyze code for performance issues...",
      model: "haiku",  // Fast model for quick analysis
      tools: ["Read", "Grep"],
    },
  },
});
```

**Agent Options:**
- `description` - When Claude should use this agent
- `prompt` - System prompt for the agent
- `model` - `"sonnet"`, `"opus"`, `"haiku"`, or `"inherit"`
- `tools` - Allowed tools (restricts what agent can do)

---

### Custom Commands

Create slash commands users can invoke:

```typescript
createCLI({
  commands: {
    audit: {
      description: "Run security audit on codebase",
      content: `Perform a comprehensive security audit:
        1. Scan for vulnerabilities
        2. Check dependencies
        3. Review auth patterns
        4. Generate report`,
      argumentHint: "<directory>",
      allowedTools: ["Read", "Grep", "Glob", "Bash"],
    },

    review: {
      description: "Review current PR changes",
      content: "Review git diff and provide feedback on code quality.",
    },

    deploy: {
      description: "Help with deployment",
      content: "Guide through deployment process for this project.",
      allowedTools: ["Read", "Bash"],
    },
  },
});
```

Users can then run `/audit src/` or `/review` in the CLI.

---

### MCP Servers

Connect to external tools via Model Context Protocol:

```typescript
createCLI({
  mcpServers: {
    // Stdio-based MCP server
    "postgres": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
      },
    },

    // HTTP-based MCP server
    "internal-api": {
      type: "http",
      url: "https://api.internal.company.com/mcp",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    },

    // SSE-based MCP server
    "realtime-data": {
      type: "sse",
      url: "https://stream.example.com/mcp",
    },
  },
});
```

**MCP Server Types:**
- `stdio` - Local process (default)
- `http` - HTTP endpoint
- `sse` - Server-Sent Events

---

### Hooks

Intercept events for logging, policy enforcement, or custom behavior:

```typescript
createCLI({
  hooks: {
    // Before any tool runs
    PreToolUse: [
      {
        matcher: "Bash",  // Only for Bash commands
        handler: async ({ toolName, toolInput }) => {
          console.log(`[AUDIT] Running: ${toolInput.command}`);

          // Block dangerous commands
          if (toolInput.command.includes("rm -rf /")) {
            return {
              decision: "block",
              message: "Dangerous command blocked"
            };
          }
          return { decision: "allow" };
        },
      },
    ],

    // After tool completes
    PostToolUse: [
      {
        handler: async ({ toolName, toolResult }) => {
          // Log all tool results
          await logToMonitoring({ toolName, result: toolResult });
        },
      },
    ],

    // Session lifecycle
    SessionStart: [
      {
        handler: async () => {
          console.log("Session started at", new Date());
        },
      },
    ],

    SessionEnd: [
      {
        handler: async ({ totalCost }) => {
          await reportUsage(totalCost);
        },
      },
    ],

    // User input
    UserPromptSubmit: [
      {
        handler: async ({ prompt }) => {
          // Filter or transform user input
          return { prompt: sanitize(prompt) };
        },
      },
    ],
  },
});
```

**Hook Events:**
- `PreToolUse` - Before tool execution (can block)
- `PostToolUse` - After tool execution
- `SessionStart` - When session begins
- `SessionEnd` - When session ends
- `UserPromptSubmit` - When user sends message
- `Notification` - System notifications
- `Stop` - When agent stops

---

### Tools Configuration

Control which tools are available:

```typescript
createCLI({
  // Use Claude Code's full toolset
  tools: { type: "preset", preset: "claude_code" },

  settings: {
    // Allow specific tools
    allowedTools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"],

    // Or block specific tools
    disallowedTools: ["WebFetch", "WebSearch"],
  },
});
```

**Available Tools:**
- `Read`, `Write`, `Edit` - File operations
- `Bash` - Shell commands
- `Grep`, `Glob` - Search
- `WebFetch`, `WebSearch` - Web access
- `Task` - Sub-agent spawning
- `TodoWrite` - Task tracking
- `NotebookEdit` - Jupyter notebooks
- Plus any MCP-provided tools

---

### System Prompt

Customize the agent's base instructions:

```typescript
createCLI({
  // Option 1: Extend Claude Code's prompt
  systemPrompt: {
    type: "preset",
    preset: "claude_code",
    append: `
      Additional instructions for your company:
      - Follow our coding standards at docs/standards.md
      - Always run tests before suggesting changes
      - Use our internal APIs when possible
    `,
  },

  // Option 2: Completely custom prompt
  systemPrompt: `You are a specialized coding assistant for Acme Corp...`,
});
```

---

### Settings & Permissions

Fine-tune behavior:

```typescript
createCLI({
  settings: {
    // Model selection
    model: "claude-sonnet-4-20250514",

    // Permission modes
    permissionMode: "auto",  // "auto" | "manual" | "none"

    // Limits
    maxTurns: 50,
    maxThinkingTokens: 10000,

    // Custom instructions (appended to system prompt)
    customInstructions: "Always explain your reasoning step by step.",
  },

  // Directories the agent can access
  additionalDirectories: [
    "/shared/company-libs",
    "/docs",
  ],

  // Session management
  session: {
    resume: "session-id-here",  // Resume previous session
    continue: true,              // Continue last session
  },
});
```

---

### Custom TUI Mode

Full control over the terminal interface:

```typescript
createCLI({
  mode: "tui",

  tui: {
    branding: {
      name: "Hawk",
      tagline: "AI Security Auditor",
      welcomeMessage: "Ready to audit your code. Type /help for commands.",
      promptPrefix: "hawk> ",
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

    display: {
      showToolProgress: true,
      showThinking: true,
      showCost: true,
      truncateToolOutput: 500,
    },
  },
});
```

---

## Full Example

```typescript
import { createCLI } from "@franalgaba/coding-agent-builder";

await createCLI({
  name: "hawk",

  // Extend Claude Code's capabilities
  systemPrompt: {
    type: "preset",
    preset: "claude_code",
    append: "Focus on security best practices.",
  },

  // Specialized agents
  agents: {
    "vuln-scanner": {
      description: "Scan for security vulnerabilities",
      prompt: "You are an expert at finding security vulnerabilities...",
      tools: ["Read", "Grep", "Glob"],
    },
    "secrets-detector": {
      description: "Find exposed secrets and credentials",
      prompt: "You scan code for hardcoded secrets...",
      tools: ["Read", "Grep"],
    },
  },

  // Custom commands
  commands: {
    audit: {
      description: "Full security audit",
      content: "Perform comprehensive security audit.",
    },
    secrets: {
      description: "Scan for secrets",
      content: "Find any exposed secrets or credentials.",
    },
  },

  // MCP integrations
  mcpServers: {
    "snyk": {
      command: "npx",
      args: ["snyk-mcp-server"],
    },
  },

  // Hooks for audit logging
  hooks: {
    PreToolUse: [{
      handler: async ({ toolName, toolInput }) => {
        console.log(`[AUDIT] ${toolName}:`, toolInput);
        return { decision: "allow" };
      },
    }],
  },

  // Settings
  settings: {
    model: "claude-sonnet-4-20250514",
    permissionMode: "auto",
  },
}).start();
```

---

## Two Modes

| Mode | Description | Use When |
|------|-------------|----------|
| `spawn` (default) | Uses Claude Code's native TUI | You want full Claude Code experience with customizations |
| `tui` | Custom TUI with pi-tui framework | You want complete control over the interface |

```typescript
// Spawn mode (default) - Claude Code TUI with your config
createCLI({ mode: "spawn", ... });

// TUI mode - Custom interface
createCLI({ mode: "tui", tui: { branding: {...} }, ... });
```

---

## API Reference

### `createCLI(config: CLIConfig): CLI`

Creates a new CLI instance.

### `CLI.start(): Promise<CLIResult>`

Starts the interactive session.

### `CLI.interrupt(): void`

Interrupts the current operation.

### `CLI.getSessionId(): string | null`

Returns the current session ID.

---

## Requirements

- Bun >= 1.0.0
- `ANTHROPIC_API_KEY` environment variable

## License

MIT
