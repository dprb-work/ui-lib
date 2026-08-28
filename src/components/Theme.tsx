import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cn } from "../cn";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "./SegmentedControl";
import {
  ThemeContext,
  type ResolvedThemeMode,
  type ThemeMode,
  useTheme,
} from "./theme-context";

export type ThemeProviderProps = {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string | null;
};

export type ThemeSwitchProps = {
  label?: string;
  hideLabel?: boolean;
  className?: string;
  groupClassName?: string;
  buttonClassName?: string;
};

const defaultStorageKey = "dprb-work-theme";
const systemThemeQuery = "(prefers-color-scheme: dark)";

const themeOptions: readonly SegmentedControlOption<ThemeMode>[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const themeIcons: Record<ThemeMode, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

function renderThemeOption(option: SegmentedControlOption<ThemeMode>) {
  const Icon = themeIcons[option.value];
  return (
    <>
      <Icon aria-hidden="true" />
      <span>{option.label}</span>
    </>
  );
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function storedMode(storageKey: string | null, fallback: ThemeMode): ThemeMode {
  if (storageKey === null || typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return isThemeMode(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia(systemThemeQuery).matches;
}

export function ThemeProvider({
  children,
  defaultMode = "system",
  storageKey = defaultStorageKey,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => storedMode(storageKey, defaultMode));
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const resolvedMode: ResolvedThemeMode = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(systemThemeQuery);
    const updateSystemTheme = (event: MediaQueryListEvent | MediaQueryList) => setSystemDark(event.matches);
    updateSystemTheme(media);
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    const previousMode = root.dataset.themeMode;
    const previousColorScheme = root.style.colorScheme;
    root.dataset.theme = resolvedMode;
    root.dataset.themeMode = mode;
    root.style.colorScheme = resolvedMode;
    return () => {
      if (previousTheme === undefined) delete root.dataset.theme;
      else root.dataset.theme = previousTheme;
      if (previousMode === undefined) delete root.dataset.themeMode;
      else root.dataset.themeMode = previousMode;
      root.style.colorScheme = previousColorScheme;
    };
  }, [mode, resolvedMode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    if (storageKey === null || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, nextMode);
    } catch {
      // Storage can be unavailable for local files or restricted browsing contexts.
    }
  }, [storageKey]);

  const value = useMemo(() => ({ mode, resolvedMode, setMode }), [mode, resolvedMode, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}


export function ThemeSwitch({
  label = "Theme",
  hideLabel = false,
  className,
  groupClassName,
  buttonClassName,
}: ThemeSwitchProps) {
  const { mode, setMode } = useTheme();
  return (
    <div className={cn("grid gap-2", className)}>
      {!hideLabel && <span className="text-sm font-medium">{label}</span>}
      <SegmentedControl
        ariaLabel={label}
        options={themeOptions}
        value={mode}
        onValueChange={setMode}
        className={groupClassName}
        buttonClassName={buttonClassName}
      >
        {renderThemeOption}
      </SegmentedControl>
    </div>
  );
}
