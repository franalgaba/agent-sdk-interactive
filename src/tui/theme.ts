/**
 * TUI Theme - Color and styling configuration
 */

import chalk from "chalk";
import type { MarkdownTheme } from "@mariozechner/pi-tui";

export interface TUIThemeConfig {
  colors?: {
    primary?: string;
    accent?: string;
    success?: string;
    error?: string;
    warning?: string;
    muted?: string;
    border?: string;
  };
}

export interface Theme {
  // Core colors
  primary: (s: string) => string;
  accent: (s: string) => string;
  success: (s: string) => string;
  error: (s: string) => string;
  warning: (s: string) => string;
  muted: (s: string) => string;
  border: (s: string) => string;
  text: (s: string) => string;
  bold: (s: string) => string;
  dim: (s: string) => string;

  // Component themes
  markdown: MarkdownTheme;
  editor: {
    borderColor: (s: string) => string;
    selectList: {
      selectedPrefix: (s: string) => string;
      selectedText: (s: string) => string;
      description: (s: string) => string;
      scrollInfo: (s: string) => string;
      noMatch: (s: string) => string;
    };
  };
  loader: {
    spinner: (s: string) => string;
    message: (s: string) => string;
  };
}

const DEFAULT_COLORS = {
  primary: "#7C3AED",   // Purple
  accent: "#3B82F6",    // Blue
  success: "#10B981",   // Green
  error: "#EF4444",     // Red
  warning: "#F59E0B",   // Amber
  muted: "#6B7280",     // Gray
  border: "#374151",    // Dark gray
};

export function createTheme(config?: TUIThemeConfig): Theme {
  const colors = { ...DEFAULT_COLORS, ...config?.colors };

  const primary = chalk.hex(colors.primary);
  const accent = chalk.hex(colors.accent);
  const success = chalk.hex(colors.success);
  const error = chalk.hex(colors.error);
  const warning = chalk.hex(colors.warning);
  const muted = chalk.hex(colors.muted);
  const border = chalk.hex(colors.border);

  return {
    primary,
    accent,
    success,
    error,
    warning,
    muted,
    border,
    text: chalk.white,
    bold: chalk.bold,
    dim: chalk.dim,

    markdown: {
      heading: (s) => chalk.bold(primary(s)),
      link: (s) => accent(s),
      linkUrl: (s) => muted(s),
      code: (s) => chalk.bgGray.white(s),
      codeBlock: (s) => s,
      codeBlockBorder: (s) => border(s),
      quote: (s) => muted(s),
      quoteBorder: (s) => border(s),
      hr: (s) => border(s),
      listBullet: (s) => primary(s),
      bold: (s) => chalk.bold(s),
      italic: (s) => chalk.italic(s),
      strikethrough: (s) => chalk.strikethrough(s),
      underline: (s) => chalk.underline(s),
    },

    editor: {
      borderColor: (s) => border(s),
      selectList: {
        selectedPrefix: (s) => primary(s),
        selectedText: (s) => chalk.bold(s),
        description: (s) => muted(s),
        scrollInfo: (s) => muted(s),
        noMatch: (s) => muted(s),
      },
    },

    loader: {
      spinner: (s) => primary(s),
      message: (s) => muted(s),
    },
  };
}
