import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, type RefObject } from "react";

import { tooltipSurfaceClassName } from "./components/tooltipStyles";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip);

export type ChartHandle = { resize: () => void };
export type PlotRecord = { label: string; value: number };
export type DistributionView = "histogram" | "box" | "density" | "violin";
type ChartTooltipModel = {
  opacity: number;
  caretX: number;
  caretY: number;
  title: readonly string[];
  dataPoints: readonly { raw: unknown }[];
};

export type ChartPalette = {
  accent: string;
  surface: string;
  muted: string;
  foreground: string;
  grid: string;
};

const defaultPalette: ChartPalette = {
  accent: "--ui-chart-accent",
  surface: "--ui-chart-surface",
  muted: "--ui-chart-muted",
  foreground: "--ui-chart-foreground",
  grid: "--ui-border",
};

export type PlotProps = {
  records: readonly PlotRecord[];
  min: number;
  max: number;
  unit?: string;
  yLabel: string;
  compact?: boolean;
  className?: string;
  palette?: Partial<ChartPalette>;
  ariaLabel?: string;
};

export type CartesianChartProps = PlotProps & {
  type: "bar" | "line";
  xLabel: string;
};

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolvedChartTheme(overrides?: Partial<ChartPalette>) {
  const variables = { ...defaultPalette, ...overrides };
  return {
    accent: cssColor(variables.accent),
    surface: cssColor(variables.surface),
    muted: cssColor(variables.muted),
    foreground: cssColor(variables.foreground),
    grid: cssColor(variables.grid),
    fontFamily: cssColor("--font-sans") || "Inter, ui-sans-serif, system-ui, sans-serif",
  };
}

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });

function formatValue(value: number, unit?: string) {
  const formatted = numberFormatter.format(value);
  if (!unit) return formatted;
  return unit === "%" ? `${formatted}%` : `${formatted} ${unit}`;
}

function updateChartTooltip(
  element: HTMLDivElement | null,
  canvas: HTMLCanvasElement,
  tooltip: ChartTooltipModel,
  accent: string,
  format: (value: number) => string,
) {
  if (!element || tooltip.opacity === 0 || tooltip.dataPoints.length === 0) {
    if (element) element.style.opacity = "0";
    return;
  }

  const raw = tooltip.dataPoints[0].raw;
  const value = typeof raw === "number" ? raw : Number(raw);
  const titleElement = element.children[0] as HTMLElement;
  const valueRow = element.children[1] as HTMLElement;
  const marker = valueRow.children[0] as HTMLElement;
  const valueElement = valueRow.children[1] as HTMLElement;
  titleElement.textContent = tooltip.title[0] ?? "";
  marker.style.backgroundColor = accent;
  valueElement.textContent = Number.isFinite(value) ? format(value) : String(raw ?? "");

  const host = element.parentElement;
  if (!host) return;
  element.style.opacity = "1";
  const halfWidth = element.offsetWidth / 2;
  const minimumLeft = halfWidth + 6;
  const maximumLeft = host.clientWidth - halfWidth - 6;
  const desiredLeft = canvas.offsetLeft + tooltip.caretX;
  const left = maximumLeft < minimumLeft ? host.clientWidth / 2 : Math.min(maximumLeft, Math.max(minimumLeft, desiredLeft));
  const anchorY = canvas.offsetTop + tooltip.caretY;
  const placeBelow = anchorY - element.offsetHeight - 10 < 0;
  element.dataset.side = placeBelow ? "bottom" : "top";
  element.style.left = `${left}px`;
  element.style.top = `${anchorY}px`;
  element.style.transform = placeBelow ? "translate(-50%, 10px)" : "translate(-50%, calc(-100% - 10px))";
}

function ChartTooltipLayer({ tooltipRef }: { tooltipRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={tooltipRef}
      data-ui-chart-tooltip
      data-side="top"
      aria-hidden="true"
      className={`${tooltipSurfaceClassName} pointer-events-none absolute left-0 top-0 z-10 grid min-w-24 gap-0.5 opacity-0 transition-opacity duration-100 motion-reduce:transition-none`}
    >
      <span className="font-medium" />
      <span className="flex items-center gap-1.5 text-[0.6875rem]">
        <span className="size-1.5 rounded-full" />
        <span />
      </span>
    </div>
  );
}

function chartA11y(ariaLabel?: string) {
  return ariaLabel ? { role: "img", "aria-label": ariaLabel } as const : { "aria-hidden": true } as const;
}

function watchTheme(render: () => void) {
  const observer = new MutationObserver(render);
  observer.observe(document.documentElement, { attributes: true });
  return observer;
}

export const CartesianChart = forwardRef<ChartHandle, CartesianChartProps>(function CartesianChart(props, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const chart = useRef<Chart | undefined>(undefined);
  useImperativeHandle(ref, () => ({ resize: () => chart.current?.resize() }));

  useEffect(() => {
    function renderChart() {
      if (!canvas.current) return;
      chart.current?.destroy();
      const palette = resolvedChartTheme(props.palette);
      chart.current = new Chart(canvas.current, {
        type: props.type,
        data: {
          labels: props.records.map((record) => record.label),
          datasets: [{
            data: props.records.map((record) => record.value),
            backgroundColor: props.type === "bar" ? palette.accent : "transparent",
            borderColor: palette.accent,
            borderRadius: props.type === "bar" ? 4 : undefined,
            borderSkipped: false,
            borderWidth: props.type === "bar" ? 0 : props.compact ? 2 : 2.5,
            maxBarThickness: 52,
            pointBackgroundColor: palette.surface,
            pointBorderColor: palette.accent,
            pointBorderWidth: props.compact ? 1.5 : 2,
            pointHoverRadius: 5,
            pointRadius: props.type === "line" ? props.compact ? 2.5 : 3.5 : 0,
            clip: false,
            tension: 0.24,
          }],
        },
        options: {
          animation: false,
          maintainAspectRatio: false,
          events: props.compact ? [] : undefined,
          font: { family: palette.fontFamily, size: 12, lineHeight: 1.4 },
          interaction: { intersect: false, mode: "index" },
          layout: { padding: { top: 8, right: 8, bottom: 0, left: 4 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: false,
              external: props.compact ? undefined : ({ chart: activeChart, tooltip: model }) => {
                updateChartTooltip(tooltip.current, activeChart.canvas, model, palette.accent, value => formatValue(value, props.unit));
              },
            },
          },
          scales: {
            x: {
              border: { color: palette.grid },
              grid: { display: false },
              ticks: { color: palette.muted, display: !props.compact, maxRotation: 0, padding: 8 },
              title: {
                display: !props.compact,
                text: props.xLabel,
                color: palette.foreground,
                font: { weight: 600 },
                padding: { top: 8 },
              },
            },
            y: {
              min: props.min,
              max: props.max,
              border: { display: false },
              grid: { color: palette.grid },
              ticks: { color: palette.muted, display: !props.compact, padding: 8 },
              title: {
                display: !props.compact,
                text: props.unit ? `${props.yLabel} (${props.unit})` : props.yLabel,
                color: palette.foreground,
                font: { weight: 600 },
                padding: { bottom: 8 },
              },
            },
          },
        },
      });
    }

    renderChart();
    const observer = watchTheme(renderChart);
    if (!props.compact) {
      window.addEventListener("beforeprint", renderChart);
      window.addEventListener("afterprint", renderChart);
    }
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", renderChart);
      window.removeEventListener("afterprint", renderChart);
      chart.current?.destroy();
    };
  }, [props.compact, props.max, props.min, props.palette, props.records, props.type, props.unit, props.xLabel, props.yLabel]);

  return (
    <div className={props.className} data-ui-chart {...chartA11y(props.ariaLabel)}>
      <canvas ref={canvas} />
      {!props.compact && <ChartTooltipLayer tooltipRef={tooltip} />}
    </div>
  );
});

function sortedValues(records: readonly PlotRecord[]) {
  return records.map((record) => record.value).sort((left, right) => left - right);
}

function quantile(values: readonly number[], fraction: number) {
  if (values.length === 0) return 0;
  const position = (values.length - 1) * fraction;
  const lower = Math.floor(position);
  const remainder = position - lower;
  const upper = values[lower + 1];
  return upper === undefined ? values[lower] : values[lower] + remainder * (upper - values[lower]);
}

function densityPoints(values: readonly number[], min: number, max: number, count = 48) {
  if (values.length === 0) return [];
  const span = Math.max(Number.EPSILON, max - min);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1);
  const bandwidth = Math.max(Math.sqrt(variance) * 1.06 * values.length ** -0.2, span / 100);
  return Array.from({ length: count }, (_, index) => {
    const value = min + span * index / Math.max(1, count - 1);
    const density = values.reduce((sum, sample) => {
      const distance = (value - sample) / bandwidth;
      return sum + Math.exp(-0.5 * distance ** 2);
    }, 0) / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
    return { value, density };
  });
}

function histogramRecords(values: readonly number[], min: number, max: number) {
  const binCount = Math.max(4, Math.min(20, Math.ceil(Math.log2(Math.max(1, values.length)) + 1)));
  const span = Math.max(Number.EPSILON, max - min);
  const width = span / binCount;
  const counts = Array.from({ length: binCount }, () => 0);
  for (const value of values) {
    const index = Math.min(binCount - 1, Math.max(0, Math.floor((value - min) / width)));
    counts[index] += 1;
  }
  return counts.map((value, index) => ({
    label: `${(min + width * index).toPrecision(4)}–${(min + width * (index + 1)).toPrecision(4)}`,
    value,
  }));
}

const HistogramChart = forwardRef<ChartHandle, PlotProps>(function HistogramChart(props, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const chart = useRef<Chart | undefined>(undefined);
  useImperativeHandle(ref, () => ({ resize: () => chart.current?.resize() }));

  useEffect(() => {
    function renderChart() {
      if (!canvas.current) return;
      chart.current?.destroy();
      const records = histogramRecords(sortedValues(props.records), props.min, props.max);
      const palette = resolvedChartTheme(props.palette);
      chart.current = new Chart(canvas.current, {
        type: "bar",
        data: {
          labels: records.map((record) => record.label),
          datasets: [{
            data: records.map((record) => record.value),
            backgroundColor: palette.accent,
            borderRadius: 3,
            borderSkipped: false,
            borderWidth: 0,
            maxBarThickness: 52,
          }],
        },
        options: {
          animation: false,
          maintainAspectRatio: false,
          events: props.compact ? [] : undefined,
          font: { family: palette.fontFamily, size: 12, lineHeight: 1.4 },
          interaction: { intersect: false, mode: "index" },
          layout: { padding: { top: 8, right: 8, bottom: 0, left: 4 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: false,
              external: props.compact ? undefined : ({ chart: activeChart, tooltip: model }) => {
                updateChartTooltip(tooltip.current, activeChart.canvas, model, palette.accent, value => `${formatValue(value)} observation${value === 1 ? "" : "s"}`);
              },
            },
          },
          scales: {
            x: {
              border: { color: palette.grid },
              grid: { display: false },
              ticks: { color: palette.muted, display: !props.compact, maxRotation: 0, maxTicksLimit: 8, padding: 8 },
              title: {
                display: !props.compact,
                text: props.unit ? `${props.yLabel} (${props.unit})` : props.yLabel,
                color: palette.foreground,
                font: { weight: 600 },
                padding: { top: 8 },
              },
            },
            y: {
              beginAtZero: true,
              border: { display: false },
              grid: { color: palette.grid },
              ticks: { color: palette.muted, display: !props.compact, padding: 8, precision: 0 },
              title: {
                display: !props.compact,
                text: "Frequency",
                color: palette.foreground,
                font: { weight: 600 },
                padding: { bottom: 8 },
              },
            },
          },
        },
      });
    }
    renderChart();
    const observer = watchTheme(renderChart);
    return () => { observer.disconnect(); chart.current?.destroy(); };
  }, [props.compact, props.max, props.min, props.palette, props.records, props.unit, props.yLabel]);

  return (
    <div className={props.className} data-ui-chart {...chartA11y(props.ariaLabel)}>
      <canvas ref={canvas} />
      {!props.compact && <ChartTooltipLayer tooltipRef={tooltip} />}
    </div>
  );
});

const DensityChart = forwardRef<ChartHandle, PlotProps>(function DensityChart(props, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const chart = useRef<Chart | undefined>(undefined);
  useImperativeHandle(ref, () => ({ resize: () => chart.current?.resize() }));

  useEffect(() => {
    function renderChart() {
      if (!canvas.current) return;
      chart.current?.destroy();
      const records = densityPoints(sortedValues(props.records), props.min, props.max);
      const palette = resolvedChartTheme(props.palette);
      chart.current = new Chart(canvas.current, {
        type: "line",
        data: {
          labels: records.map((record) => record.value.toPrecision(4)),
          datasets: [{
            data: records.map((record) => record.density),
            backgroundColor: "transparent",
            borderColor: palette.accent,
            borderWidth: props.compact ? 2 : 2.5,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0.32,
          }],
        },
        options: {
          animation: false,
          maintainAspectRatio: false,
          events: props.compact ? [] : undefined,
          font: { family: palette.fontFamily, size: 12, lineHeight: 1.4 },
          interaction: { intersect: false, mode: "index" },
          layout: { padding: { top: 8, right: 8, bottom: 0, left: 4 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: false,
              external: props.compact ? undefined : ({ chart: activeChart, tooltip: model }) => {
                updateChartTooltip(tooltip.current, activeChart.canvas, model, palette.accent, value => `Density ${formatValue(value)}`);
              },
            },
          },
          scales: {
            x: {
              border: { color: palette.grid },
              grid: { display: false },
              ticks: { color: palette.muted, display: !props.compact, maxRotation: 0, maxTicksLimit: 8, padding: 8 },
              title: {
                display: !props.compact,
                text: props.unit ? `${props.yLabel} (${props.unit})` : props.yLabel,
                color: palette.foreground,
                font: { weight: 600 },
                padding: { top: 8 },
              },
            },
            y: {
              beginAtZero: true,
              border: { display: false },
              grid: { color: palette.grid },
              ticks: { color: palette.muted, display: !props.compact, padding: 8 },
              title: {
                display: !props.compact,
                text: "Density",
                color: palette.foreground,
                font: { weight: 600 },
                padding: { bottom: 8 },
              },
            },
          },
        },
      });
    }
    renderChart();
    const observer = watchTheme(renderChart);
    return () => { observer.disconnect(); chart.current?.destroy(); };
  }, [props.compact, props.max, props.min, props.palette, props.records, props.unit, props.yLabel]);

  return (
    <div className={props.className} data-ui-chart {...chartA11y(props.ariaLabel)}>
      <canvas ref={canvas} />
      {!props.compact && <ChartTooltipLayer tooltipRef={tooltip} />}
    </div>
  );
});

function scaledX(value: number, min: number, max: number) {
  const span = Math.max(Number.EPSILON, max - min);
  return 5 + ((value - min) / span) * 90;
}

function formatRange(value: number, unit?: string) {
  return `${value.toPrecision(4)}${unit ? ` ${unit}` : ""}`;
}

const BoxPlot = forwardRef<ChartHandle, PlotProps>(function BoxPlot(props, ref) {
  useImperativeHandle(ref, () => ({ resize: () => undefined }));
  const stats = useMemo(() => {
    const values = sortedValues(props.records);
    const fallback = values[0] ?? props.min;
    return {
      min: scaledX(values[0] ?? fallback, props.min, props.max),
      q1: scaledX(quantile(values, 0.25), props.min, props.max),
      median: scaledX(quantile(values, 0.5), props.min, props.max),
      medianValue: quantile(values, 0.5),
      q3: scaledX(quantile(values, 0.75), props.min, props.max),
      max: scaledX(values.at(-1) ?? fallback, props.min, props.max),
    };
  }, [props.max, props.min, props.records]);
  return (
    <div className={props.className} data-ui-chart {...chartA11y(props.ariaLabel)}>
      <svg data-ui-distribution-svg viewBox="0 0 100 40" preserveAspectRatio="none">
        <line className="box-whisker" x1={stats.min} y1="20" x2={stats.max} y2="20" />
        <line className="box-whisker" x1={stats.min} y1="14" x2={stats.min} y2="26" />
        <line className="box-whisker" x1={stats.max} y1="14" x2={stats.max} y2="26" />
        <rect className="box-body" x={stats.q1} y="9" width={Math.max(0, stats.q3 - stats.q1)} height="22" />
        <line className="box-median" x1={stats.median} y1="9" x2={stats.median} y2="31" />
      </svg>
      {!props.compact && <p className="distribution-range" data-ui-distribution-range><span>{formatRange(props.min, props.unit)}</span><span>Median {formatRange(stats.medianValue, props.unit)}</span><span>{formatRange(props.max, props.unit)}</span></p>}
    </div>
  );
});

const ViolinPlot = forwardRef<ChartHandle, PlotProps>(function ViolinPlot(props, ref) {
  useImperativeHandle(ref, () => ({ resize: () => undefined }));
  const points = useMemo(() => {
    const density = densityPoints(sortedValues(props.records), props.min, props.max);
    const peak = Math.max(...density.map((point) => point.density)) || 1;
    const upper = density.map((point) => `${scaledX(point.value, props.min, props.max)},${20 - point.density / peak * 14}`);
    const lower = [...density].reverse().map((point) => `${scaledX(point.value, props.min, props.max)},${20 + point.density / peak * 14}`);
    return [...upper, ...lower].join(" ");
  }, [props.max, props.min, props.records]);
  return (
    <div className={props.className} data-ui-chart {...chartA11y(props.ariaLabel)}>
      <svg data-ui-distribution-svg viewBox="0 0 100 40" preserveAspectRatio="none">
        <line className="violin-axis" x1="5" y1="20" x2="95" y2="20" />
        <polygon className="violin-body" points={points} />
      </svg>
      {!props.compact && <p className="distribution-range" data-ui-distribution-range><span>{formatRange(props.min, props.unit)}</span><span>{formatRange(props.max, props.unit)}</span></p>}
    </div>
  );
});

export type DistributionChartProps = PlotProps & { view: DistributionView };

export const DistributionChart = forwardRef<ChartHandle, DistributionChartProps>(function DistributionChart({ view, ...props }, ref) {
  const Component = view === "histogram" ? HistogramChart : view === "box" ? BoxPlot : view === "density" ? DensityChart : ViolinPlot;
  return <Component ref={ref} {...props} />;
});
