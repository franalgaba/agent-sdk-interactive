# coding-agent-builder

Build **custom branded coding agents** using Claude Code's powerful harness and the Anthropic Agent SDK. Create your own AI coding assistant with your company's branding, specialized agents, and custom commands.

## Why This SDK?

Claude Code is a powerful AI coding assistant, but you can't customize its branding or extend it with domain-specific capabilities. This SDK lets you:

- **Brand it as your own** - Custom name, colors, welcome message
- **Add specialized agents** - Security auditors, code reviewers, domain experts
- **Create custom commands** - `/audit`, `/review`, `/deploy`, etc.
- **Leverage Claude Code's infrastructure** - Tool execution, streaming, permissions

Build tools like:
- `hawk` - A security-focused code auditor for your team
- `devops-ai` - Infrastructure and deployment assistant
- `code-mentor` - Onboarding tool for new developers

## Installation

```bash
bun add @franalgaba/coding-agent-builder
```

## Quick Start

### Spawn Mode (Recommended)

Uses Claude Code's native TUI with your custom configuration:

```typescript
import { createCLI } from "@franalgaba/coding-agent-builder";

await createCLI({
  name: "hawk",

  // Your specialized agents
  agents: {
    "security-auditor": {
      description: "Audit code for security vulnerabilities",
      prompt: `You are a security expert. When auditing code:
        1. Look for OWASP Top 10 vulnerabilities
        2. Check for secrets and credentials
        3. Identify injection risks
        4. Review authentication/authorization`,
      tools: ["Read", "Grep", "Glob", "Bash"],
    },
  },

  // Custom slash commands
  commands: {
    audit: {
      description: "Run security audit on codebase",
      content: "Perform a comprehensive security audit of this codebase.",
    },
  },

  settings: {
    model: "claude-sonnet-4-20250514",
    customInstructions: "Focus on security best practices.",
  },
}).start();
```

### TUI Mode

Full control with custom branded terminal UI:

```typescript
import { createCLI } from "@franalgaba/coding-agent-builder";

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
        primary: "#F59E0B",
        accent: "#3B82F6",
        success: "#10B981",
        error: "#EF4444",
      },
    },
  },

  agents: { /* ... */ },
  commands: { /* ... */ },
}).start();
```

## Configuration

### CLIConfig

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Your agent's name |
| `mode` | `"spawn" \| "tui"` | Execution mode (default: `"spawn"`) |
| `agents` | `Record<string, AgentDefinition>` | Specialized sub-agents |
| `commands` | `Record<string, CommandDefinition>` | Custom slash commands |
| `mcpServers` | `Record<string, McpServerConfig>` | MCP server integrations |
| `hooks` | `Record<HookEvent, HookMatcher[]>` | Event hooks |
| `settings` | `object` | Model and behavior settings |
| `tui` | `TUIConfig` | Branding and theming (TUI mode) |

### AgentDefinition

```typescript
interface AgentDefinition {
  description: string;  // When to invoke this agent
  prompt: string;       // Agent's system prompt
  model?: "sonnet" | "opus" | "haiku";
  tools?: string[];     // Allowed tools
}
```

### CommandDefinition

```typescript
interface CommandDefinition {
  description: string;   // Shown in /help
  content: string;       // Prompt when user runs command
  argumentHint?: string; // e.g., "<file>"
}
```

### TUIConfig (Custom Branding)

```typescript
interface TUIConfig {
  branding: {
    name: string;           // "Hawk", "DevOps AI", etc.
    tagline?: string;       // "AI Security Auditor"
    welcomeMessage?: string;
    promptPrefix?: string;  // "hawk> "
  };
  theme?: {
    colors?: {
      primary?: string;   // Main accent color
      success?: string;   // Completion indicators
      error?: string;     // Error messages
      muted?: string;     // Secondary text
    };
  };
}
```

## Tool Display

The TUI shows tool executions in real-time:

```
⟳ 📖 Read: src/auth/login.ts
✓ 🔎 Grep: password
⟳ 💻 Bash: npm audit
✓ 🌐 WebFetch: https://nvd.nist.gov/...
```

## Examples

```bash
# Basic agent with custom commands
bun run examples/basic.ts

# Branded TUI mode
bun run examples/tui-mode.ts
```

## Use Cases

### Security Auditor
```typescript
createCLI({
  name: "hawk",
  agents: {
    "vuln-scanner": { /* OWASP scanning */ },
    "secrets-detector": { /* credential scanning */ },
  },
  commands: {
    audit: { content: "Run full security audit" },
    secrets: { content: "Scan for exposed secrets" },
  },
});
```

### Code Review Bot
```typescript
createCLI({
  name: "reviewer",
  agents: {
    "style-checker": { /* lint and style */ },
    "perf-analyzer": { /* performance review */ },
  },
  commands: {
    review: { content: "Review PR changes" },
    perf: { content: "Analyze performance" },
  },
});
```

### DevOps Assistant
```typescript
createCLI({
  name: "ops",
  agents: {
    "k8s-expert": { /* Kubernetes help */ },
    "ci-helper": { /* CI/CD pipelines */ },
  },
  commands: {
    deploy: { content: "Help with deployment" },
    debug: { content: "Debug infrastructure" },
  },
});
```

## Requirements

- Bun >= 1.0.0
- `ANTHROPIC_API_KEY` environment variable

## License

MIT
