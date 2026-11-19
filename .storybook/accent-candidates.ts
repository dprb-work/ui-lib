export const accentOptions = [
  { id: "default", label: "Current default (unchanged)" },
  { id: "indigo", label: "Indigo" },
  { id: "amber", label: "Warm amber" },
  { id: "violet", label: "Violet" },
  { id: "ink", label: "Ink" },
] as const;

export type AccentCandidate = typeof accentOptions[number]["id"];

export function accentCandidate(value: unknown): AccentCandidate {
  return accentOptions.find(option => option.id === value)?.id ?? "default";
}
