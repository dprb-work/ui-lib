export type RgbColor = Readonly<{
  red: number;
  green: number;
  blue: number;
}>;

export type ColorFormatId = "hex" | "rgb" | "hsl" | "oklch";

export type ColorFormat = Readonly<{
  id: ColorFormatId;
  label: string;
  // Complete width utility for the value field; longer formats need more room.
  fieldWidth: string;
  format: (color: RgbColor) => string;
  parse: (text: string) => RgbColor | undefined;
  hint: string;
}>;

const channelMax = 255;
const fullTurn = 360;
const percentMax = 100;
const hexPattern = /^#([0-9a-f]{6})$/i;
const numberPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

// sRGB transfer function (IEC 61966-2-1).
const srgbLinearLimit = 0.04045;
const srgbLinearSlope = 12.92;
const srgbOffset = 0.055;
const srgbGamma = 2.4;

type Vector = readonly [number, number, number];
type Matrix = readonly [Vector, Vector, Vector];

// OKLab matrices from Björn Ottosson's reference implementation.
const linearSrgbToLms: Matrix = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
const lmsToOklab: Matrix = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];
const oklabToLms: Matrix = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.291485548],
];
const lmsToLinearSrgb: Matrix = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
];

function multiply([[a, b, c], [d, e, f], [g, h, i]]: Matrix, [x, y, z]: Vector): Vector {
  return [a * x + b * y + c * z, d * x + e * y + f * z, g * x + h * y + i * z];
}

function clampChannel(value: number): number {
  return Math.min(channelMax, Math.max(0, Math.round(value)));
}

function toLinear(channel: number): number {
  const value = channel / channelMax;
  return value <= srgbLinearLimit ? value / srgbLinearSlope : ((value + srgbOffset) / (1 + srgbOffset)) ** srgbGamma;
}

function fromLinear(value: number): number {
  const encoded = value <= srgbLinearLimit / srgbLinearSlope
    ? value * srgbLinearSlope
    : (1 + srgbOffset) * value ** (1 / srgbGamma) - srgbOffset;
  return clampChannel(encoded * channelMax);
}

function parseNumber(text: string): number | undefined {
  return numberPattern.test(text) ? Number(text) : undefined;
}

function parsePercent(text: string): number | undefined {
  return parseNumber(text.endsWith("%") ? text.slice(0, -1) : text);
}

function parseHue(text: string): number | undefined {
  const hue = parseNumber(text.toLowerCase().endsWith("deg") ? text.slice(0, -3) : text);
  return hue === undefined ? undefined : ((hue % fullTurn) + fullTurn) % fullTurn;
}

// Accept the three components bare ("76 136 197") or in CSS function form ("rgb(76, 136, 197)").
function components(text: string, functionName: string): string[] {
  const trimmed = text.trim();
  const prefix = `${functionName}(`;
  const body = trimmed.toLowerCase().startsWith(prefix) && trimmed.endsWith(")")
    ? trimmed.slice(prefix.length, -1)
    : trimmed;
  return body.split(/[\s,]+/).filter(Boolean);
}

function inRange(value: number | undefined, max: number): value is number {
  return value !== undefined && value >= 0 && value <= max;
}

export function toHexColor({ red, green, blue }: RgbColor): string {
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(text: string): RgbColor | undefined {
  const hex = hexPattern.exec(text.trim())?.[1];
  if (!hex) return undefined;
  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function parseRgb(text: string): RgbColor | undefined {
  const parts = components(text, "rgb");
  if (parts.length !== 3) return undefined;
  const [red, green, blue] = parts.map(parseNumber);
  if (!inRange(red, channelMax) || !inRange(green, channelMax) || !inRange(blue, channelMax)) return undefined;
  return { red: Math.round(red), green: Math.round(green), blue: Math.round(blue) };
}

function formatHsl({ red, green, blue }: RgbColor): string {
  const r = red / channelMax;
  const g = green / channelMax;
  const b = blue / channelMax;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;
  if (delta > 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    // Hue sector of the largest channel, in sixths of a turn.
    let sector = (r - g) / delta + 4;
    if (max === r) sector = (g - b) / delta;
    else if (max === g) sector = (b - r) / delta + 2;
    hue = ((sector * fullTurn) / 6 + fullTurn) % fullTurn;
  }
  return `${Math.round(hue) % fullTurn} ${Math.round(saturation * percentMax)}% ${Math.round(lightness * percentMax)}%`;
}

function parseHsl(text: string): RgbColor | undefined {
  const parts = components(text, "hsl");
  if (parts.length !== 3) return undefined;
  const [hueText, saturationText, lightnessText] = parts as [string, string, string];
  const hue = parseHue(hueText);
  const saturation = parsePercent(saturationText);
  const lightness = parsePercent(lightnessText);
  if (hue === undefined || !inRange(saturation, percentMax) || !inRange(lightness, percentMax)) return undefined;
  const l = lightness / percentMax;
  const chroma = (1 - Math.abs(2 * l - 1)) * (saturation / percentMax);
  // CSS Color 4 hsl-to-rgb: each channel samples a trapezoid wave offset by a third of a turn.
  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12;
    return clampChannel((l - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * channelMax);
  };
  return { red: channel(0), green: channel(8), blue: channel(4) };
}

function formatOklch({ red, green, blue }: RgbColor): string {
  const [l, m, s] = multiply(linearSrgbToLms, [toLinear(red), toLinear(green), toLinear(blue)]);
  const [lightness, a, b] = multiply(lmsToOklab, [Math.cbrt(l), Math.cbrt(m), Math.cbrt(s)]);
  const chroma = Math.hypot(a, b).toFixed(3);
  const hue = ((Math.atan2(b, a) * fullTurn) / (2 * Math.PI) + fullTurn) % fullTurn;
  // An achromatic color has no meaningful hue; show 0 rather than rounding noise.
  const shownHue = Number(chroma) === 0 ? "0" : (Number(hue.toFixed(1)) % fullTurn).toFixed(1);
  return `${lightness.toFixed(3)} ${chroma} ${shownHue}`;
}

function parseOklch(text: string): RgbColor | undefined {
  const parts = components(text, "oklch");
  if (parts.length !== 3) return undefined;
  const [lightnessText, chromaText, hueText] = parts as [string, string, string];
  const lightness = lightnessText.endsWith("%")
    ? (parsePercent(lightnessText) ?? Number.NaN) / percentMax
    : parseNumber(lightnessText);
  const chroma = parseNumber(chromaText);
  const hue = parseHue(hueText);
  if (!inRange(lightness, 1) || chroma === undefined || chroma < 0 || hue === undefined) return undefined;
  const radians = (hue * 2 * Math.PI) / fullTurn;
  const [l, m, s] = multiply(oklabToLms, [lightness, chroma * Math.cos(radians), chroma * Math.sin(radians)]);
  // Out-of-gamut colors clip per channel to the nearest sRGB value.
  const [r, g, b] = multiply(lmsToLinearSrgb, [l ** 3, m ** 3, s ** 3]);
  return { red: fromLinear(r), green: fromLinear(g), blue: fromLinear(b) };
}

export const hexColorFormat: ColorFormat = { id: "hex", label: "Hex", fieldWidth: "w-24", format: toHexColor, parse: parseHex, hint: "Enter a six-digit hex value, for example #4f46e5." };

export const colorFormats: readonly ColorFormat[] = [
  hexColorFormat,
  { id: "rgb", label: "RGB", fieldWidth: "w-28", format: ({ red, green, blue }) => `${red} ${green} ${blue}`, parse: parseRgb, hint: "Enter red, green and blue from 0 to 255, for example 76 136 197." },
  { id: "hsl", label: "HSL", fieldWidth: "w-28", format: formatHsl, parse: parseHsl, hint: "Enter hue, saturation and lightness, for example 210 51% 54%." },
  { id: "oklch", label: "OKLCH", fieldWidth: "w-36", format: formatOklch, parse: parseOklch, hint: "Enter lightness, chroma and hue, for example 0.613 0.112 250.5." },
];
