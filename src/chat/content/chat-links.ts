export function safeHref(value: string | undefined): string | undefined {
  if (!value) return undefined;
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 32 || code === 127) return undefined;
  }
  if (/^#[A-Za-z][\w:.-]*$/.test(value)) return value;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" ||
      url.protocol === "http:" ||
      url.protocol === "mailto:") &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
