import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ThemeProvider, ThemeSwitch } from "./Theme";
import { useTheme } from "./theme-context";

type SystemPreference = "dark" | "light" | "unset";

function installMatchMedia(preference: SystemPreference) {
  const mediaQueries = new Map<string, {
    matches: boolean;
    listeners: Set<(event: MediaQueryListEvent) => void>;
  }>();
  const matchMedia = vi.fn((query: string) => {
    const entry = mediaQueries.get(query) ?? {
      matches:
        (query === "(prefers-color-scheme: dark)" && preference === "dark")
        || (query === "(prefers-color-scheme: light)" && preference === "light"),
      listeners: new Set<(event: MediaQueryListEvent) => void>(),
    };
    mediaQueries.set(query, entry);
    return {
      matches: entry.matches,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        entry.listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        entry.listeners.delete(listener);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  });
  vi.stubGlobal("matchMedia", matchMedia);
  return {
    change(next: SystemPreference) {
      for (const [query, entry] of mediaQueries) {
        const matches =
          (query === "(prefers-color-scheme: dark)" && next === "dark")
          || (query === "(prefers-color-scheme: light)" && next === "light");
        entry.matches = matches;
        for (const listener of entry.listeners) {
          listener({ matches, media: query } as MediaQueryListEvent);
        }
      }
    },
  };
}

function ThemeState() {
  const { mode, resolvedMode } = useTheme();
  return <output>{mode}:{resolvedMode}</output>;
}

function renderSystemTheme() {
  return render(
    <ThemeProvider storageKey={null}>
      <ThemeState />
    </ThemeProvider>,
  );
}

function expectDocumentTheme(theme: "light" | "dark", mode = "system") {
  expect(document.documentElement).toHaveAttribute("data-theme", theme);
  expect(document.documentElement).toHaveAttribute("data-theme-mode", mode);
  expect(document.documentElement.style.colorScheme).toBe(theme);
}

describe("ThemeProvider and ThemeSwitch", () => {
  beforeEach(() => localStorage.clear());

  test.each([
    ["dark", "dark"],
    ["light", "light"],
    ["unset", "dark"],
  ] as const)("resolves system mode for %s preference", (preference, theme) => {
    installMatchMedia(preference);
    renderSystemTheme();

    expect(screen.getByText(`system:${theme}`)).toBeVisible();
    expectDocumentTheme(theme);
  });

  test("falls back to dark when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    renderSystemTheme();

    expect(screen.getByText("system:dark")).toBeVisible();
    expectDocumentTheme("dark");
  });

  test.each([
    ["light", ["dark", "light"]],
    ["unset", ["light", "dark"]],
  ] as const)("tracks system changes from %s", async (initial, transitions) => {
    const media = installMatchMedia(initial);
    renderSystemTheme();
    expectDocumentTheme(initial === "light" ? "light" : "dark");

    for (const theme of transitions) {
      act(() => media.change(theme));
      expect(await screen.findByText(`system:${theme}`)).toBeVisible();
      expectDocumentTheme(theme);
    }
  });

  test("explicit choices and persisted choices override system preference", async () => {
    installMatchMedia("dark");
    render(
      <ThemeProvider storageKey="theme-test">
        <ThemeSwitch />
        <ThemeState />
      </ThemeProvider>,
    );

    expectDocumentTheme("dark");
    await userEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(screen.getByText("light:light")).toBeVisible();
    expectDocumentTheme("light", "light");
    expect(localStorage.getItem("theme-test")).toBe("light");

    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(screen.getByText("dark:dark")).toBeVisible();
    expectDocumentTheme("dark", "dark");
    expect(localStorage.getItem("theme-test")).toBe("dark");

    await userEvent.click(screen.getByRole("button", { name: "System" }));
    expect(screen.getByText("system:dark")).toBeVisible();
    expectDocumentTheme("dark", "system");
    expect(localStorage.getItem("theme-test")).toBe("system");
  });

  test("loads a persisted explicit choice ahead of the system preference", () => {
    localStorage.setItem("theme-test", "light");
    installMatchMedia("dark");
    render(
      <ThemeProvider storageKey="theme-test">
        <ThemeState />
      </ThemeProvider>,
    );

    expect(screen.getByText("light:light")).toBeVisible();
    expectDocumentTheme("light", "light");
  });
});

