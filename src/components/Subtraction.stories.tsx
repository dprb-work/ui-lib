import { composeStory, type Meta, type StoryObj } from "@storybook/react-vite";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { Badge, Button, StatusPanel } from "../index";
import colorPaletteMeta, { FullSpectrum, SemanticColors } from "./ColorPalette.stories";
import colorPickerMeta, { Interactive } from "./ColorPicker.stories";
import controlsMeta, { Buttons } from "./Controls.stories";
import feedbackMeta, { Badges, ErrorStatus, Statuses } from "./Feedback.stories";
import interactionsMeta, { TabbedContent } from "./Interactions.stories";

const meta = {
  title: "Foundations/Subtraction contract",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Themes({ children }: { children: ReactNode }) {
  return <>{(["light", "dark"] as const).map((theme) => (
    <section key={theme} data-theme={theme} aria-label={`${theme} subtraction`} className="grid gap-4 bg-ui-background p-4 text-ui-foreground">
      {children}
    </section>
  ))}</>;
}

// Vitest's browser platform is unavailable in the ordinary Storybook runtime.
async function scopes(canvasElement: HTMLElement) {
  const { page } = await import("@vitest/browser/context");
  await page.viewport(390, 844);
  return ["light", "dark"].map((theme) => within(canvasElement).getByRole("region", { name: `${theme} subtraction` }));
}

const statuses = [
  { tone: "info", label: "Analysis running", Icon: Info },
  { tone: "success", label: "Checks passed", Icon: CircleCheck },
  { tone: "warning", label: "Review required", Icon: TriangleAlert },
  { tone: "danger", label: "Analysis failed", Icon: CircleX },
] as const;

function StatusBadges() {
  return <div>{statuses.map(({ tone, label, Icon }) => (
    <Badge key={tone} tone={tone}><Icon aria-hidden="true" size={14} /><span>{label}</span></Badge>
  ))}<Badge><span>API ready</span></Badge></div>;
}

export const BadgePreservesCallerCase: Story = {
  render: () => <Themes><StatusBadges /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      for (const label of [...statuses.map((status) => status.label), "API ready"]) {
        const text = within(scope).getByText(label);
        expect(text).toBeVisible();
        expect(getComputedStyle(text).textTransform, `Preserve caller case: ${label}`).toBe("none");
      }
    }
  },
};

export const BadgeHasNaturalLetterSpacing: Story = {
  render: () => <Themes><StatusBadges /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      for (const label of [...statuses.map((status) => status.label), "API ready"]) {
        const spacing = getComputedStyle(within(scope).getByText(label)).letterSpacing;
        expect(spacing === "normal" || Number.parseFloat(spacing) === 0, `No forced tracking: ${label} (${spacing})`).toBe(true);
      }
    }
  },
};

export const BadgeIsReadable: Story = {
  render: () => <Themes><StatusBadges /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      for (const label of [...statuses.map((status) => status.label), "API ready"]) {
        expect(Number.parseFloat(getComputedStyle(within(scope).getByText(label)).fontSize), label).toBeGreaterThanOrEqual(12);
      }
    }
  },
};

// Canvas resolves OKLCH and other supported CSS color syntax to actual paint.
function paint(value: string): string {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas color normalization is unavailable");
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  return Array.from(context.getImageData(0, 0, 1, 1).data).join(",");
}

export const BadgeKeepsStatusWordsIconsAndColors: Story = {
  render: () => <Themes><StatusBadges /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      for (const { tone, label } of statuses) {
        const text = within(scope).getByText(label);
        const badge = text.parentElement!;
        const icon = badge.querySelector("svg")!;
        expect(text).toBeVisible();
        expect(icon).toBeVisible();
        const style = getComputedStyle(badge);
        expect(paint(style.color), `${tone} ink`).toBe(paint(style.getPropertyValue(`--color-ui-${tone}-ink`)));
        expect(paint(style.backgroundColor), `${tone} fill`).toBe(paint(style.getPropertyValue(`--color-ui-${tone}-fill`)));
      }
    }
  },
};

function RecoverableStatus() {
  const [attempts, setAttempts] = useState(0);
  return <>
    <StatusPanel aria-label="Analysis recovery" role="alert" tone="danger" title="Analysis could not finish" description={<p>Fetch the missing base revision before retrying.</p>} icon={<CircleX aria-hidden="true" size={18} />} actions={<Button onClick={() => setAttempts(attempts + 1)}>Retry analysis</Button>} />
    <p role="status">Retry requests: {attempts}</p>
    <StatusPanel title="Analysis contains no changed responsibilities" description="Choose a snapshot with reviewable changes." />
  </>;
}

export const StatusPanelKeepsPublicContentAndRecovery: Story = {
  render: () => <Themes><RecoverableStatus /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      const canvas = within(scope);
      const alert = canvas.getByRole("alert", { name: "Analysis recovery" });
      expect(within(alert).getByRole("heading", { name: "Analysis could not finish" })).toBeVisible();
      expect(within(alert).getByText("Fetch the missing base revision before retrying.")).toBeVisible();
      expect(alert.querySelector("svg")).toBeVisible();
      const retry = within(alert).getByRole("button", { name: "Retry analysis" });
      retry.focus();
      await userEvent.keyboard("{Enter}");
      expect(canvas.getByRole("status")).toHaveTextContent("Retry requests: 1");
      expect(retry).toHaveFocus();
      expect(canvas.getByRole("heading", { name: "Analysis contains no changed responsibilities" })).toBeVisible();
    }
  },
};

function expectNoElevation(element: HTMLElement) {
  const shadow = getComputedStyle(element).boxShadow;
  if (shadow === "none") return;
  for (const layer of shadow.split(/,(?![^()]*\))/)) {
    if (layer.includes("inset")) continue;
    const color = layer.match(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/)?.[0];
    if (color && paint(color).split(",")[3] === "0") continue;
    const lengths = (layer.replace(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/g, "").match(/-?[\d.]+px/g) ?? []).map(Number.parseFloat);
    expect(lengths.every((length) => length === 0), `No visible elevation shadow: ${layer}`).toBe(true);
  }
}

export const StaticStatusPanelsHaveNoElevation: Story = {
  render: () => <Themes><RecoverableStatus /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      for (const name of ["Analysis could not finish", "Analysis contains no changed responsibilities"]) {
        const panel = within(scope).getByRole("heading", { name }).closest("section")!;
        expectNoElevation(panel);
      }
    }
  },
};

const ShippedStatuses = composeStory(Statuses, feedbackMeta);
const ShippedErrorStatus = composeStory(ErrorStatus, feedbackMeta);
const ShippedBadges = composeStory(Badges, feedbackMeta);
const ShippedButtons = composeStory(Buttons, controlsMeta);
const ShippedPicker = composeStory(Interactive, colorPickerMeta);
const ShippedTabs = composeStory(TabbedContent, interactionsMeta);
const ShippedSemanticColors = composeStory(SemanticColors, colorPaletteMeta);
const ShippedSpectrum = composeStory(FullSpectrum, colorPaletteMeta);

function expectAnalysisInHeadingOrDescription(scope: HTMLElement) {
  const heading = within(scope).getByRole("heading");
  const panel = heading.closest("section")!;
  const description = Array.from(panel.children).filter((child) =>
    Boolean(heading.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING) && !child.querySelector("button"),
  );
  // Title/body must carry the operation; an isolated preheading cannot satisfy this.
  const content = [heading.textContent, ...description.map((element) => element.textContent)].join(" ");
  expect(content, "Keep analysis context in the title or description").toMatch(/\banalysis\b/i);
  expect(panel.firstElementChild, "No redundant label before the heading").toBe(heading);
}

export const ShippedEmptyAnalysisRetainsContext: Story = {
  render: () => <Themes><ShippedStatuses /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      expectAnalysisInHeadingOrDescription(scope);
      expect(within(scope).getByRole("button")).toBeEnabled();
    }
  },
};

export const ShippedFailedAnalysisRetainsContext: Story = {
  render: () => <Themes><ShippedErrorStatus /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      expectAnalysisInHeadingOrDescription(scope);
      expect(within(scope).getAllByRole("button")).toHaveLength(2);
      for (const action of within(scope).getAllByRole("button")) expect(action).toBeEnabled();
    }
  },
};

function expectUnframedAncestors(content: HTMLElement, scope: HTMLElement) {
  let parent = content.parentElement;
  while (parent && parent !== scope) {
    const style = getComputedStyle(parent);
    expectNoElevation(parent);
    for (const edge of ["Top", "Right", "Bottom", "Left"] as const) {
      const visible = Number.parseFloat(style[`border${edge}Width`]) > 0 && style[`border${edge}Style`] !== "none" && paint(style[`border${edge}Color`]).split(",")[3] !== "0";
      expect(visible, "No enclosing decorative frame").toBe(false);
    }
    parent = parent.parentElement;
  }
  expect(parent, "The checked content belongs to its example scope").toBe(scope);
}

export const ShippedButtonGroupIsUnframed: Story = {
  render: () => <Themes><ShippedButtons /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) expectUnframedAncestors(within(scope).getByRole("button", { name: "Save changes" }), scope);
  },
};

export const ShippedPickerCompositionIsUnframed: Story = {
  render: () => <Themes><ShippedPicker /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) expectUnframedAncestors(within(scope).getByRole("button", { name: "Reset externally" }), scope);
  },
};

export const ShippedBadgeGroupIsUnframed: Story = {
  render: () => <Themes><ShippedBadges /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      const badge = within(scope).getByText("Running");
      expectUnframedAncestors(badge, scope);
    }
  },
};

export const ShippedTabsKeepTheirOwnFrameOnly: Story = {
  render: () => <Themes><ShippedTabs /></Themes>,
  play: async ({ canvasElement }) => {
    for (const scope of await scopes(canvasElement)) {
      const tablist = within(scope).getByRole("tablist");
      // Start outside the actual tab object: its owner-approved group frame stays.
      expectUnframedAncestors(tablist, scope);
      const selected = within(tablist).getByRole("tab", { selected: true });
      expect(Number.parseFloat(getComputedStyle(tablist).borderTopWidth)).toBeGreaterThan(0);
      expect(Number.parseFloat(getComputedStyle(selected).fontWeight)).toBeGreaterThanOrEqual(600);
    }
  },
};

async function expectPaletteHeader({ canvasElement }: { canvasElement: HTMLElement }) {
  // Vitest's browser platform is unavailable in the ordinary Storybook runtime.
  const { page } = await import("@vitest/browser/context");
  await page.viewport(390, 844);
  const header = canvasElement.querySelector("header")!;
  const heading = within(header).getByRole("heading", { level: 1 });
  expect(heading).toBeVisible();
  expect(header.firstElementChild, "A decorative kicker must not precede the content heading").toBe(heading);
  // Do not inspect descendant borders: palette swatches and ramps are real objects.
}

// Render one shipped page per story so each document has one main landmark.
export const ShippedSemanticHeaderLight: Story = {
  globals: { theme: "light" },
  render: () => <ShippedSemanticColors />,
  play: expectPaletteHeader,
};

export const ShippedSemanticHeaderDark: Story = {
  ...ShippedSemanticHeaderLight,
  globals: { theme: "dark" },
};

export const ShippedSpectrumHeaderLight: Story = {
  globals: { theme: "light" },
  render: () => <ShippedSpectrum />,
  play: expectPaletteHeader,
};

export const ShippedSpectrumHeaderDark: Story = {
  ...ShippedSpectrumHeaderLight,
  globals: { theme: "dark" },
};
