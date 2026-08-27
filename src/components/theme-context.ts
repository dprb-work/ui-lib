import { createContext, useContext } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;

export type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider.");
  return value;
}
