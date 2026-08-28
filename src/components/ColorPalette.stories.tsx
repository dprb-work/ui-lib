import type { Meta, StoryObj } from "@storybook/react-vite";


const meta = {
  title: "Foundations/Color Palette",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type ColorToken = {
  name: string;
  variable: `--ui-${string}`;
  use: string;
  foreground?: `--ui-${string}`;
};

const semanticTokens: ColorToken[] = [
  { name: "Background", variable: "--ui-background", use: "Application canvas", foreground: "--ui-foreground" },
  { name: "Surface", variable: "--ui-surface", use: "Cards, dialogs, and raised regions", foreground: "--ui-surface-foreground" },
  { name: "Muted", variable: "--ui-muted", use: "Subdued controls and secondary regions", foreground: "--ui-muted-foreground" },
  { name: "Border", variable: "--ui-border", use: "Dividers, outlines, and control boundaries" },
  { name: "Tooltip", variable: "--ui-tooltip", use: "Transient contextual surfaces", foreground: "--ui-tooltip-foreground" },
  { name: "Accent", variable: "--ui-accent", use: "Primary actions and selected states", foreground: "--ui-on-accent" },
  { name: "Accent hover", variable: "--ui-accent-hover", use: "Primary action hover state", foreground: "--ui-on-accent" },
  { name: "Danger", variable: "--ui-danger", use: "Destructive actions and error emphasis", foreground: "--ui-on-danger" },
  { name: "Danger hover", variable: "--ui-danger-hover", use: "Destructive action hover state", foreground: "--ui-on-danger" },
];

const chartTokens: ColorToken[] = [
  { name: "Chart accent", variable: "--ui-chart-accent", use: "Series, points, and statistical marks" },
  { name: "Chart surface", variable: "--ui-chart-surface", use: "Point fills and chart-ground contrast" },
  { name: "Chart muted", variable: "--ui-chart-muted", use: "Axes, ticks, and secondary labels" },
  { name: "Chart foreground", variable: "--ui-chart-foreground", use: "Primary chart labels and marks" },
];

function Swatch({ token }: { token: ColorToken }) {
  const color = `var(${token.variable})`;
  const foreground = token.foreground && `var(${token.foreground})`;

  return (
    <article className="overflow-hidden rounded-xl border border-ui-border bg-ui-surface shadow-sm">
      <div className="grid min-h-28 place-items-center px-4" style={{ backgroundColor: color }}>
        {foreground && <span className="rounded-md px-2 py-1 text-xs font-semibold shadow-sm" style={{ backgroundColor: foreground, color }}>Aa</span>}
      </div>
      <div className="grid gap-1 p-4">
        <strong className="text-sm text-ui-surface-foreground">{token.name}</strong>
        <code className="text-xs text-ui-accent">{token.variable}</code>
        <span className="text-xs leading-5 text-ui-muted-foreground">{token.use}</span>
      </div>
    </article>
  );
}

function TokenGroup({ title, description, tokens }: { title: string; description: string; tokens: ColorToken[] }) {
  return (
    <section className="grid gap-4">
      <div className="grid max-w-3xl gap-1">
        <h2 className="text-xl font-semibold text-ui-foreground">{title}</h2>
        <p className="text-sm leading-6 text-ui-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tokens.map((token) => <Swatch key={token.variable} token={token} />)}
      </div>
    </section>
  );
}

export const SemanticColors: Story = {
  render: () => (
    <main className="min-h-screen bg-ui-background p-6 text-ui-foreground sm:p-10">
      <div className="mx-auto grid max-w-7xl gap-10">
        <header className="grid max-w-3xl gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-accent">Design foundations</p>
          <h1 className="text-3xl font-semibold tracking-tight">Color palette</h1>
          <p className="text-sm leading-6 text-ui-muted-foreground">
            Semantic tokens keep components consistent across products and themes. Use the role that describes the job; avoid binding components to raw color values.
          </p>
        </header>

        <TokenGroup
          title="Interface colors"
          description="The shared surface, content, action, and status roles used by UI library components. Switch the Storybook theme to inspect both palettes."
          tokens={semanticTokens}
        />
        <TokenGroup
          title="Chart colors"
          description="Chart renderers consume these aliases so products can tune data visualization independently without replacing component-level semantics."
          tokens={chartTokens}
        />
      </div>
    </main>
  ),
};

const spectrumFamilies = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "mauve",
  "olive",
  "mist",
  "taupe",
] as const;

const spectrumSteps = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950] as const;

function ColorRamp({ family }: { family: typeof spectrumFamilies[number] }) {
  return (
    <section className="grid min-w-[76rem] grid-cols-[5rem_1fr] items-center gap-4">
      <h2 className="text-sm font-semibold capitalize text-ui-foreground">{family}</h2>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${spectrumSteps.length}, minmax(0, 1fr))` }}>
        {spectrumSteps.map((step) => (
          <div key={step} className="grid gap-1">
            <div
              className="h-12 rounded-md border border-black/8 dark:border-white/8"
              style={{ backgroundColor: `var(--color-${family}-${step})` }}
              title={`--color-${family}-${step}`}
            />
            <code className="text-center text-[0.625rem] text-ui-muted-foreground">{step}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

export const FullSpectrum: Story = {
  render: () => (
    <main className="min-h-screen bg-ui-background p-6 text-ui-foreground sm:p-10">
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="grid max-w-3xl gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-accent">Design foundations</p>
          <h1 className="text-3xl font-semibold tracking-tight">Muted Tailwind spectrum</h1>
          <p className="text-sm leading-6 text-ui-muted-foreground">
            Every standard Tailwind color family uses the shared muted treatment and provides every 50-step value from 50 through 950. Shared components should still consume semantic <code>--ui-*</code> roles unless a primitive color is part of their contract.
          </p>
        </header>
        <div aria-label="Muted Tailwind color ramps" className="overflow-x-auto rounded-xl border border-ui-border bg-ui-surface p-5 shadow-sm" tabIndex={0}>
          <div className="grid gap-5">
            {spectrumFamilies.map((family) => <ColorRamp key={family} family={family} />)}
          </div>
        </div>
      </div>
    </main>
  ),
};
