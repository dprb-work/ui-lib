import type { ChartSeries } from "../../charts";

const DAY_MS = 24 * 60 * 60 * 1000;
const usageDayCount = 45;
const usageLastDay = Date.UTC(2026, 10, 23);
const dayLabelFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Daily model usage per account over 45 days, so every time-range preset including "All" applies. */
export const modelUsageTimestamps = Array.from(
  { length: usageDayCount },
  (_, index) => usageLastDay - (usageDayCount - 1 - index) * DAY_MS,
);

export const modelUsageLabels = modelUsageTimestamps.map((timestamp) => dayLabelFormat.format(timestamp));

// Deterministic weekday load with weekend dips keeps screenshots stable.
function dailyTokens(base: number, swing: number) {
  return modelUsageTimestamps.map((timestamp, index) => {
    const weekday = new Date(timestamp).getUTCDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.45 : 1;
    return Math.round((base + swing * Math.sin(index / 3)) * weekendFactor * 10) / 10;
  });
}

export const modelUsageSeries: ChartSeries[] = [
  { id: "personal", label: "Personal Max", values: dailyTokens(18, 6) },
  { id: "agents", label: "Agent pool", values: dailyTokens(32, 9) },
  { id: "reviewer", label: "CI reviewer", values: dailyTokens(7, 3) },
];
