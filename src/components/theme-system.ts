import type { ResolvedThemeMode } from "./theme-context";

const darkThemeQuery = "(prefers-color-scheme: dark)";
const lightThemeQuery = "(prefers-color-scheme: light)";

export function resolveSystemTheme(): ResolvedThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }
  if (window.matchMedia(darkThemeQuery).matches) return "dark";
  if (window.matchMedia(lightThemeQuery).matches) return "light";
  return "dark";
}

export function subscribeSystemTheme(onChange: (theme: ResolvedThemeMode) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const darkMedia = window.matchMedia(darkThemeQuery);
  const lightMedia = window.matchMedia(lightThemeQuery);
  const update = () => onChange(resolveSystemTheme());
  update();
  darkMedia.addEventListener("change", update);
  lightMedia.addEventListener("change", update);
  return () => {
    darkMedia.removeEventListener("change", update);
    lightMedia.removeEventListener("change", update);
  };
}
