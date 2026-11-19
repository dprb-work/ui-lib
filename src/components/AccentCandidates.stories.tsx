import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { useGlobals } from "storybook/preview-api";

import { accentCandidate, accentOptions, type AccentCandidate } from "../../.storybook/accent-candidates";
import { CartesianChart } from "../charts";
import { Button } from "./Button";
import { Checkbox } from "./BinaryControls";
import { Tabs } from "./Interactions";

const records = [
  { label: "Draft", value: 20 },
  { label: "Review", value: 55 },
  { label: "Revise", value: 42 },
  { label: "Ready", value: 85 },
];

function luminance(color: string) {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Expected an opaque sRGB sample color: ${color}`);
  const linear = channels.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first: string, second: string) {
  const a = luminance(first);
  const b = luminance(second);
  return ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
}

function AccentSample({ candidate, theme, onCandidateChange, onThemeChange }: {
  candidate: AccentCandidate;
  theme: "light" | "dark";
  onCandidateChange: (candidate: AccentCandidate) => void;
  onThemeChange: (theme: "light" | "dark") => void;
}) {
  const accentText = useRef<HTMLParagraphElement>(null);
  const surface = useRef<HTMLElement>(null);
  const [figures, setFigures] = useState<{ onAccent: string; onSurface: string } | null>(null);
  const [tab, setTab] = useState("overview");
  const [checked, setChecked] = useState(true);
  useEffect(() => {
    function measure() {
      if (!accentText.current || !surface.current) return;
      const text = getComputedStyle(accentText.current);
      const background = getComputedStyle(surface.current).backgroundColor;
      setFigures({ onAccent: contrast(text.color, text.backgroundColor), onSurface: contrast(text.backgroundColor, background) });
    }
    let frame = requestAnimationFrame(measure);
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-accent-candidate"] });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [candidate, theme]);

  return <main className="min-h-screen bg-ui-background p-4 text-ui-foreground sm:p-8">
    <div className="mx-auto grid max-w-4xl gap-6">
      <header className="grid gap-3">
        <h1 className="text-2xl font-semibold">Accent candidates</h1>
        <p className="max-w-3xl text-sm text-ui-muted-foreground">Proposal only. Choose a candidate to try it across this sample and the rest of the catalog. Current default restores the unchanged cyan/teal tokens. No production default or reader preference is changed.</p>
        <div role="group" aria-label="Accent candidate" className="flex flex-wrap gap-2">{accentOptions.map(option => <Button key={option.id} aria-pressed={candidate === option.id} variant={candidate === option.id ? "primary" : "secondary"} onClick={() => onCandidateChange(option.id)}>{option.label}</Button>)}</div>
        <div role="group" aria-label="Candidate theme" className="flex gap-2">{(["light", "dark"] as const).map(mode => <Button key={mode} aria-pressed={theme === mode} variant={theme === mode ? "primary" : "secondary"} onClick={() => onThemeChange(mode)}>{mode === "light" ? "Light" : "Dark"}</Button>)}</div>
      </header>
      <section ref={surface} className="grid min-w-0 gap-5 rounded-xl border border-ui-border bg-ui-surface p-5 text-ui-surface-foreground" aria-label="Live accent components">
        <h2 className="text-lg font-semibold">{accentOptions.find(option => option.id === candidate)?.label} · {theme}</h2>
        <div className="flex flex-wrap items-center gap-5"><Button className="h-11 px-5">Primary action</Button><a className="accent-preview-link" href="#candidate-rationale">Read candidate rationale</a></div>
        <p className="text-sm text-ui-muted-foreground">Hover the primary action, then Tab to it to inspect the real hover and focus-ring states.</p>
        <Tabs ariaLabel="Accent sample views" tabs={[{ value: "overview", label: "Overview" }, { value: "details", label: "Details" }]} value={tab} onValueChange={setTab} triggerClassName="data-[state=active]:border-ui-accent data-[state=active]:text-ui-accent">
          {option => <p className="text-sm">{option.value === "overview" ? "The selected tab uses the same accent." : "This is the same component for every candidate."}</p>}
        </Tabs>
        <label className="flex items-center gap-3 text-sm"><Checkbox label="Notify on completion" checked={checked} onCheckedChange={value => setChecked(value === true)} /><span>Notify on completion</span></label>
        <p ref={accentText} className="rounded-md bg-ui-accent p-3 font-semibold text-ui-on-accent">Text on accent</p>
        <div className="h-48 min-w-0"><CartesianChart type="line" records={records} min={0} max={100} unit="%" xLabel="Stage" yLabel="Completion" ariaLabel="Candidate accent chart series" className="h-full" /></div>
        <p className="accent-preview-contrast text-sm" aria-live="polite">{figures ? `Text on accent ${figures.onAccent}:1 · Accent on surface ${figures.onSurface}:1` : "Measuring rendered contrast…"}</p>
        <p className="text-xs text-ui-muted-foreground">WCAG relative luminance from the solid accent text and this surface. Recomputed for each candidate and theme; custom consumer surfaces still need their own review.</p>
      </section>
      <section id="candidate-rationale" className="grid gap-2 text-sm">
        <h2 className="text-lg font-semibold">Four directions, one token contract</h2>
        <p><strong>Indigo:</strong> recommended first; distinct from success green and warning amber, familiar for actions and focus.</p>
        <p><strong>Warm amber:</strong> visibly warmer, but it competes with caution/status semantics.</p>
        <p><strong>Violet:</strong> distinct and readable; stronger visual character than ink or indigo.</p>
        <p><strong>Ink:</strong> lowest hue emphasis; heavier underlined links and existing bold controls carry interaction.</p>
        <p>All candidates set only the existing --ui-accent, --ui-accent-hover, --ui-on-accent, and --ui-chart-accent tokens. This stylesheet is imported only by Storybook; choose a replacement with the owner before changing ui-lib defaults.</p>
      </section>
    </div>
  </main>;
}

const meta = {
  title: "Foundations/Accent candidates",
  parameters: { layout: "fullscreen" },
  render: function Render() {
    const [globals, updateGlobals] = useGlobals();
    return <AccentSample candidate={accentCandidate(globals.accent)} theme={globals.theme === "dark" ? "dark" : "light"} onCandidateChange={accent => updateGlobals({ accent })} onThemeChange={theme => updateGlobals({ theme })} />;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Candidates: Story = {};
