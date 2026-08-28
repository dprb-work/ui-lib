import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ThemeProvider, ThemeSwitch } from "./Theme";
import { useTheme } from "./theme-context";

function installMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  return {
    change(nextMatches: boolean) {
      Object.assign(media, { matches: nextMatches });
      for (const listener of listeners) listener({ matches: nextMatches, media: media.media } as MediaQueryListEvent);
    },
  };
}

function ThemeState() {
  const { mode, resolvedMode } = useTheme();
  return <output>{mode}:{resolvedMode}</output>;
}

describe("ThemeProvider and ThemeSwitch", () => {
  beforeEach(() => localStorage.clear());

  test("make the three-way selection the document theme contract", async () => {
    installMatchMedia(false);
    render(
      <ThemeProvider storageKey="theme-test">
        <ThemeSwitch />
        <ThemeState />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("system:light")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement).toHaveAttribute("data-theme-mode", "system");

    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(screen.getByText("dark:dark")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("theme-test")).toBe("dark");
  });

  test("tracks the system preference while system mode is selected", async () => {
    const media = installMatchMedia(false);
    render(
      <ThemeProvider storageKey={null}>
        <ThemeState />
      </ThemeProvider>,
    );

    act(() => media.change(true));
    expect(await screen.findByText("system:dark")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
