import { type ReactNode, useEffect, useLayoutEffect, useState } from "react";

import type { ResolvedThemeMode } from "../src/components/theme-context";
import { resolveSystemTheme, subscribeSystemTheme } from "../src/components/theme-system";
import {
  initializeStorybookThemeState,
  readStoredStorybookTheme,
  writeStoredStorybookTheme,
} from "./storybook-theme-state";

export function StorybookThemeSync({
  themeOverride,
  storyTheme,
  userTheme,
  children,
}: {
  themeOverride: ResolvedThemeMode | null;
  storyTheme: ResolvedThemeMode | null;
  userTheme: ResolvedThemeMode | null;
  children: ReactNode;
}) {
  const [systemTheme, setSystemTheme] = useState<ResolvedThemeMode>(resolveSystemTheme);
  const storedTheme = userTheme ?? readStoredStorybookTheme();
  const defaultTheme = storedTheme ?? systemTheme;
  const activeTheme = themeOverride ?? storyTheme ?? defaultTheme;

  useEffect(() => subscribeSystemTheme(setSystemTheme), []);

  useEffect(() => {
    if (userTheme !== null) {
      writeStoredStorybookTheme(userTheme);
    }
  }, [userTheme]);

  useEffect(() => {
    initializeStorybookThemeState(defaultTheme);
  }, [defaultTheme]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", activeTheme === "dark");
    root.style.colorScheme = activeTheme;
  }, [activeTheme]);

  return children;
}
