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
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip);

export type ChartHandle = { resize: () => void };
export type PlotRecord = { label: string; value: number };
export type DistributionView = "histogram" | "box" | "density" | "violin";
export type ChartPalette = {
  accent: string;
  surface: string;
  muted: string;
  foreground: string;
};

const defaultPalette: ChartPalette = {
  accent: "--ui-chart-accent",
  surface: "--ui-chart-surface",
  muted: "--ui-chart-muted",
  foreground: "--ui-chart-foreground",
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

function resolvedPalette(overrides?: Partial<ChartPalette>) {
  const variables = { ...defaultPalette, ...overrides };
  return {
    accent: cssColor(variables.accent),
    surface: cssColor(variables.surface),
    muted: cssColor(variables.muted),
    foreground: cssColor(variables.foreground),
  };
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
  const chart = useRef<Chart | undefined>(undefined);
  useImperativeHandle(ref, () => ({ resize: () => chart.current?.resize() }));

  useEffect(() => {
    function renderChart() {
      if (!canvas.current) return;
      chart.current?.destroy();
      const palette = resolvedPalette(props.palette);
      chart.current = new Chart(canvas.current, {
        type: props.type,
        data: {
          labels: props.records.map((record) => record.label),
          datasets: [{
            data: props.records.map((record) => record.value),
            backgroundColor: props.type === "bar" ? palette.accent : "transparent",
            borderColor: palette.accent,
            borderWidth: props.type === "bar" ? 0 : props.compact ? 2 : 3,
            pointBackgroundColor: palette.surface,
            pointBorderColor: palette.accent,
            pointBorderWidth: props.compact ? 1.5 : 2,
            pointRadius: props.type === "line" ? props.compact ? 2.5 : 4 : 0,
            clip: false,
            tension: 0.18,
          }],
        },
        options: {
          animation: false,
          maintainAspectRatio: false,
          events: props.compact ? [] : undefined,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: !props.compact,
              callbacks: { label: (context) => `${context.parsed.y} ${props.unit ?? ""}`.trim() },
            },
          },
          scales: {
            x: {
              ticks: { color: palette.muted, display: !props.compact },
              title: { display: !props.compact, text: props.xLabel, color: palette.foreground },
            },
            y: {
              min: props.min,
              max: props.max,
              border: { display: false },
              ticks: { color: palette.muted, display: !props.compact },
              title: {
                display: !props.compact,
                text: props.unit ? `${props.yLabel} (${props.unit})` : props.yLabel,
                color: palette.foreground,
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

  return <div className={props.className} data-ui-chart {...chartA11y(props.ariaLabel)}><canvas ref={canvas} /></div>;
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
  const chart = useRef<Chart | undefined>(undefined);
  useImperativeHandle(ref, () => ({ resize: () => chart.current?.resize() }));

  useEffect(() => {
    function renderChart() {
      if (!canvas.current) return;
      chart.current?.destroy();
      const records = histogramRecords(sortedValues(props.records), props.min, props.max);
      const palette = resolvedPalette(props.palette);
      chart.current = new Chart(canvas.current, {
        type: "bar",
        data: { labels: records.map((record) => record.label), datasets: [{ data: records.map((record) => record.value), backgroundColor: palette.accent, borderWidth: 0 }] },
        options: {
          animation: false,
          maintainAspectRatio: false,
          events: props.compact ? [] : undefined,
          plugins: { legend: { display: false }, tooltip: { enabled: !props.compact, callbacks: { label: (context) => `${context.parsed.y} observations` } } },
          scales: {
            x: { ticks: { color: palette.muted, display: !props.compact, maxTicksLimit: 8 }, title: { display: !props.compact, text: props.unit ? `${props.yLabel} (${props.unit})` : props.yLabel, color: palette.foreground } },
            y: { beginAtZero: true, border: { display: false }, ticks: { color: palette.muted, display: !props.compact, precision: 0 }, title: { display: !props.compact, text: "Frequency", color: palette.foreground } },
          },
        },
      });
    }
    renderChart();
    const observer = watchTheme(renderChart);
    return () => { observer.disconnect(); chart.current?.destroy(); };
  }, [props.compact, props.max, props.min, props.palette, props.records, props.unit, props.yLabel]);

  return <div className={props.className} data-ui-chart {...chartA11y(props.ariaLabel)}><canvas ref={canvas} /></div>;
});

const DensityChart = forwardRef<ChartHandle, PlotProps>(function DensityChart(props, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | undefined>(undefined);
  useImperativeHandle(ref, () => ({ resize: () => chart.current?.resize() }));

  useEffect(() => {
    function renderChart() {
      if (!canvas.current) return;
      chart.current?.destroy();
      const records = densityPoints(sortedValues(props.records), props.min, props.max);
      const palette = resolvedPalette(props.palette);
      chart.current = new Chart(canvas.current, {
        type: "line",
        data: { labels: records.map((record) => record.value.toPrecision(4)), datasets: [{ data: records.map((record) => record.density), backgroundColor: "transparent", borderColor: palette.accent, borderWidth: props.compact ? 2 : 3, pointRadius: 0, tension: 0.32 }] },
        options: {
          animation: false,
          maintainAspectRatio: false,
          events: props.compact ? [] : undefined,
          plugins: { legend: { display: false }, tooltip: { enabled: !props.compact, callbacks: { label: (context) => `Density ${context.parsed.y}` } } },
          scales: {
            x: { ticks: { color: palette.muted, display: !props.compact, maxTicksLimit: 8 }, title: { display: !props.compact, text: props.unit ? `${props.yLabel} (${props.unit})` : props.yLabel, color: palette.foreground } },
            y: { beginAtZero: true, border: { display: false }, ticks: { color: palette.muted, display: !props.compact }, title: { display: !props.compact, text: "Density", color: palette.foreground } },
          },
        },
      });
    }
    renderChart();
    const observer = watchTheme(renderChart);
    return () => { observer.disconnect(); chart.current?.destroy(); };
  }, [props.compact, props.max, props.min, props.palette, props.records, props.unit, props.yLabel]);

  return <div className={props.className} data-ui-chart {...chartA11y(props.ariaLabel)}><canvas ref={canvas} /></div>;
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
