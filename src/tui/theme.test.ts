import { describe, expect, test } from "bun:test";
import { createTheme, type TUIThemeConfig, type Theme } from "./theme";

describe("createTheme", () => {
  test("creates theme with default colors", () => {
    const theme = createTheme();

    expect(theme.primary).toBeDefined();
    expect(theme.accent).toBeDefined();
    expect(theme.success).toBeDefined();
    expect(theme.error).toBeDefined();
    expect(theme.warning).toBeDefined();
    expect(theme.muted).toBeDefined();
    expect(theme.border).toBeDefined();
  });

  test("returns theme with all required properties", () => {
    const theme = createTheme();

    // Core color functions
    expect(typeof theme.primary).toBe("function");
    expect(typeof theme.accent).toBe("function");
    expect(typeof theme.success).toBe("function");
    expect(typeof theme.error).toBe("function");
    expect(typeof theme.warning).toBe("function");
    expect(typeof theme.muted).toBe("function");
    expect(typeof theme.border).toBe("function");
    expect(typeof theme.text).toBe("function");
    expect(typeof theme.bold).toBe("function");
    expect(typeof theme.dim).toBe("function");
  });

  test("returns theme with markdown theme", () => {
    const theme = createTheme();

    expect(theme.markdown).toBeDefined();
    expect(typeof theme.markdown.heading).toBe("function");
    expect(typeof theme.markdown.link).toBe("function");
    expect(typeof theme.markdown.code).toBe("function");
    expect(typeof theme.markdown.codeBlock).toBe("function");
    expect(typeof theme.markdown.quote).toBe("function");
    expect(typeof theme.markdown.listBullet).toBe("function");
    expect(typeof theme.markdown.bold).toBe("function");
    expect(typeof theme.markdown.italic).toBe("function");
  });

  test("returns theme with editor theme", () => {
    const theme = createTheme();

    expect(theme.editor).toBeDefined();
    expect(typeof theme.editor.borderColor).toBe("function");
    expect(theme.editor.selectList).toBeDefined();
    expect(typeof theme.editor.selectList.selectedPrefix).toBe("function");
    expect(typeof theme.editor.selectList.selectedText).toBe("function");
    expect(typeof theme.editor.selectList.description).toBe("function");
  });

  test("returns theme with loader theme", () => {
    const theme = createTheme();

    expect(theme.loader).toBeDefined();
    expect(typeof theme.loader.spinner).toBe("function");
    expect(typeof theme.loader.message).toBe("function");
  });

  test("applies custom primary color", () => {
    const config: TUIThemeConfig = {
      colors: {
        primary: "#FF0000",
      },
    };

    const theme = createTheme(config);

    // Color function should work
    const styled = theme.primary("test");
    expect(styled).toBeDefined();
    expect(typeof styled).toBe("string");
  });

  test("applies custom accent color", () => {
    const config: TUIThemeConfig = {
      colors: {
        accent: "#00FF00",
      },
    };

    const theme = createTheme(config);
    const styled = theme.accent("test");
    expect(styled).toBeDefined();
  });

  test("applies custom success color", () => {
    const config: TUIThemeConfig = {
      colors: {
        success: "#00FF00",
      },
    };

    const theme = createTheme(config);
    const styled = theme.success("test");
    expect(styled).toBeDefined();
  });

  test("applies custom error color", () => {
    const config: TUIThemeConfig = {
      colors: {
        error: "#FF0000",
      },
    };

    const theme = createTheme(config);
    const styled = theme.error("test");
    expect(styled).toBeDefined();
  });

  test("applies custom warning color", () => {
    const config: TUIThemeConfig = {
      colors: {
        warning: "#FFFF00",
      },
    };

    const theme = createTheme(config);
    const styled = theme.warning("test");
    expect(styled).toBeDefined();
  });

  test("applies custom muted color", () => {
    const config: TUIThemeConfig = {
      colors: {
        muted: "#808080",
      },
    };

    const theme = createTheme(config);
    const styled = theme.muted("test");
    expect(styled).toBeDefined();
  });

  test("applies custom border color", () => {
    const config: TUIThemeConfig = {
      colors: {
        border: "#333333",
      },
    };

    const theme = createTheme(config);
    const styled = theme.border("test");
    expect(styled).toBeDefined();
  });

  test("merges partial custom colors with defaults", () => {
    const config: TUIThemeConfig = {
      colors: {
        primary: "#FF0000",
        // Other colors should use defaults
      },
    };

    const theme = createTheme(config);

    // All color functions should work
    expect(theme.primary("test")).toBeDefined();
    expect(theme.accent("test")).toBeDefined();
    expect(theme.success("test")).toBeDefined();
    expect(theme.error("test")).toBeDefined();
    expect(theme.warning("test")).toBeDefined();
    expect(theme.muted("test")).toBeDefined();
    expect(theme.border("test")).toBeDefined();
  });

  test("applies all custom colors", () => {
    const config: TUIThemeConfig = {
      colors: {
        primary: "#FF0000",
        accent: "#00FF00",
        success: "#0000FF",
        error: "#FFFF00",
        warning: "#FF00FF",
        muted: "#00FFFF",
        border: "#FFFFFF",
      },
    };

    const theme = createTheme(config);

    // All should be defined and functional
    expect(theme.primary("test")).toBeDefined();
    expect(theme.accent("test")).toBeDefined();
    expect(theme.success("test")).toBeDefined();
    expect(theme.error("test")).toBeDefined();
    expect(theme.warning("test")).toBeDefined();
    expect(theme.muted("test")).toBeDefined();
    expect(theme.border("test")).toBeDefined();
  });

  test("handles empty config", () => {
    const config: TUIThemeConfig = {};
    const theme = createTheme(config);

    expect(theme.primary).toBeDefined();
    expect(theme.accent).toBeDefined();
  });

  test("handles undefined config", () => {
    const theme = createTheme(undefined);

    expect(theme.primary).toBeDefined();
    expect(theme.accent).toBeDefined();
  });

  test("color functions return styled strings", () => {
    const theme = createTheme();

    // Should return strings (with ANSI codes)
    const primaryStyled = theme.primary("hello");
    const boldStyled = theme.bold("world");
    const dimStyled = theme.dim("test");

    expect(typeof primaryStyled).toBe("string");
    expect(typeof boldStyled).toBe("string");
    expect(typeof dimStyled).toBe("string");

    // Should contain the original text
    expect(primaryStyled).toContain("hello");
    expect(boldStyled).toContain("world");
    expect(dimStyled).toContain("test");
  });

  test("markdown theme functions work correctly", () => {
    const theme = createTheme();

    const heading = theme.markdown.heading("# Title");
    const link = theme.markdown.link("Click here");
    const code = theme.markdown.code("const x = 1");
    const bullet = theme.markdown.listBullet("•");

    expect(heading).toContain("# Title");
    expect(link).toContain("Click here");
    expect(code).toContain("const x = 1");
    expect(bullet).toContain("•");
  });

  test("editor theme functions work correctly", () => {
    const theme = createTheme();

    const border = theme.editor.borderColor("─");
    const prefix = theme.editor.selectList.selectedPrefix(">");
    const text = theme.editor.selectList.selectedText("Option");

    expect(border).toContain("─");
    expect(prefix).toContain(">");
    expect(text).toContain("Option");
  });

  test("loader theme functions work correctly", () => {
    const theme = createTheme();

    const spinner = theme.loader.spinner("⠋");
    const message = theme.loader.message("Loading...");

    expect(spinner).toContain("⠋");
    expect(message).toContain("Loading...");
  });
});
