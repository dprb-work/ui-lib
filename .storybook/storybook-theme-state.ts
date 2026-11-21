import { DecoratorHelpers } from "@storybook/addon-themes";

import type { ResolvedThemeMode } from "../src/components/theme-context";
import { resolveSystemTheme } from "../src/components/theme-system";

const storybookThemeStorageKey = "dprb-work-storybook-theme";
export const storybookThemes: readonly ResolvedThemeMode[] = ["light", "dark"];

export function isResolvedTheme(value: unknown): value is ResolvedThemeMode {
  return value === "light" || value === "dark";
}

export function readStoredStorybookTheme(): ResolvedThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(storybookThemeStorageKey);
    return isResolvedTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredStorybookTheme(theme: ResolvedThemeMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storybookThemeStorageKey, theme);
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
}

export function initializeStorybookThemeState(defaultTheme?: ResolvedThemeMode) {
  DecoratorHelpers.initializeThemeState(
    [...storybookThemes],
    defaultTheme ?? readStoredStorybookTheme() ?? resolveSystemTheme(),
  );
}
