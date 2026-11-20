import { composeStory, type Meta, type StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { ComposerFrame } from "../chat/composer/ComposerFrame";
import { ComposerInput } from "../chat/composer/ComposerInput";
import { ComposerSubmitButton } from "../chat/composer/ComposerSubmitButton";
import { ReasoningSlider } from "../chat/composer/ReasoningSlider";
import { Checkbox, Switch } from "./BinaryControls";
import { Button } from "./Button";
import { Calendar } from "./Calendar";
import { ColorPicker } from "./ColorPicker";
import { ColorSelector } from "./ColorSelector";
import { IconButton } from "./IconButton";
import { NumberInput, SelectInput, TextareaInput, TextInput } from "./Inputs";
import { Tabs } from "./Interactions";
import { NativeSelect } from "./NativeSelect";
import paletteMeta, { Danger as dangerStory } from "./Palette.stories";
import { PortalProvider } from "./portal-context";
import { SegmentedControl } from "./SegmentedControl";

const themes = ["light", "dark"] as const;
type Theme = (typeof themes)[number];
const options = [{ value: "one", label: "One" }, { value: "two", label: "Two" }];
const fieldNames = ["Text", "Number", "Textarea", "Native select", "Select"];
const errorWords = "Choose an available value.";

function SelectionProbe() {
  const [pressed, setPressed] = useState(true);
  const [tab, setTab] = useState("one");
  const [segment, setSegment] = useState("one");
  return (
    <>
      <Button variant="secondary" aria-pressed={pressed} onClick={() => setPressed(!pressed)}>Toggle choice</Button>
      <IconButton label="Selected icon" aria-pressed={pressed} onClick={() => setPressed(!pressed)} tooltip={false}><Search aria-hidden="true" /></IconButton>
      <Tabs ariaLabel="State tabs" value={tab} onValueChange={setTab} tabs={options.map((option) => ({ value: option.value, label: `Tab ${option.label}` }))}>
        {(option) => <p>{option.value === "one" ? "First panel" : "Second panel"}</p>}
      </Tabs>
      <SegmentedControl ariaLabel="State segments" options={options.map((option) => ({ ...option, label: `Segment ${option.label}` }))} value={segment} onValueChange={setSegment} />
      <Checkbox label="Checked choice" defaultChecked />
      <Switch label="Enabled choice" defaultChecked />
      <Switch label="Inactive choice" />
    </>
  );
}

function BusyComposerProbe({ theme }: { theme: Theme }) {
  const [stops, setStops] = useState(0);
  const [queued, setQueued] = useState(0);
  return (
    <>
      <div role="group" aria-label="Available stop">
        <ComposerSubmitButton running hasText={false} canSend={false} canStop onStop={() => setStops(stops + 1)} />
      </div>
      <div role="group" aria-label="Unavailable stop">
        <ComposerSubmitButton running hasText={false} canSend canStop={false} onStop={() => setStops(stops + 1)} />
      </div>
      <form aria-label={`${theme} Available queue`} onSubmit={(event) => { event.preventDefault(); setQueued(queued + 1); }}>
        <ComposerSubmitButton running hasText canSend canStop={false} onStop={() => setStops(stops + 1)} />
      </form>
      <form aria-label={`${theme} Unavailable queue`} onSubmit={(event) => event.preventDefault()}>
        <ComposerSubmitButton running hasText canSend={false} canStop onStop={() => setStops(stops + 1)} />
      </form>
      <p>Stop requests: {stops}</p>
      <p>Queued messages: {queued}</p>
    </>
  );
}

function Fields({ theme, invalid = false }: { theme: Theme; invalid?: boolean }) {
  const error = invalid ? errorWords : undefined;
  const prefix = invalid ? "Invalid " : "";
  const nativeErrorId = `${theme}-native-error`;
  return (
    <>
      <label>{prefix}Text<TextInput aria-label={`${prefix}Text`} defaultValue="Draft" error={error} /></label>
      <label>{prefix}Number<NumberInput aria-label={`${prefix}Number`} defaultValue={2} error={error} /></label>
      <label>{prefix}Textarea<TextareaInput aria-label={`${prefix}Textarea`} defaultValue="Draft notes" error={error} /></label>
      <label>{prefix}Native select
        <NativeSelect aria-label={`${prefix}Native select`} defaultValue="one" aria-invalid={invalid || undefined} aria-describedby={invalid ? nativeErrorId : undefined}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </NativeSelect>
      </label>
      {invalid && <p id={nativeErrorId} className="text-ui-danger">{errorWords}</p>}
      <SelectInput label={`${prefix}Select`} defaultValue="one" options={options} error={error} />
    </>
  );
}

function StateProbe({ theme, kind }: { theme: Theme; kind: "buttons" | "fields" | "invalid" | "availability" | "selection" | "composer" | "overrides" | "textarea" }) {
  return (
    <section data-theme={theme} aria-label={`${theme} state rules`} className="grid w-[390px] max-w-full gap-4 bg-ui-background p-4 text-sm text-ui-foreground">
      <h2>{theme} state rules</h2>
      <button type="button" data-testid="pointer-parking">Interaction start</button>
      {kind === "buttons" && <>
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary action</Button>
        <Button variant="secondary" aria-pressed="true">Selected action</Button>
        <Button variant="danger">Danger action</Button>
        <IconButton label="Unselected icon" tooltip={false}><Search aria-hidden="true" /></IconButton>
        <IconButton label="Selected icon" aria-pressed="true" tooltip={false}><Search aria-hidden="true" /></IconButton>
      </>}
      {(kind === "fields" || kind === "invalid") && <Fields theme={theme} invalid={kind === "invalid"} />}
      {kind === "availability" && <>
        <Button>Available action</Button>
        <Button disabled>Disabled action</Button>
        <Button aria-busy="true">Save progress</Button>
        <IconButton label="Search in progress" aria-busy="true" tooltip={false}><Search aria-hidden="true" data-testid="original-busy-icon" /></IconButton>
        <IconButton label="Disabled icon" disabled tooltip={false}><Search aria-hidden="true" /></IconButton>
        <TextInput aria-label="Disabled text" defaultValue="Unavailable" disabled />
        <NumberInput aria-label="Disabled number" defaultValue={1} disabled />
        <TextareaInput aria-label="Disabled textarea" defaultValue="Unavailable" disabled />
        <NativeSelect aria-label="Disabled native select" defaultValue="one" disabled><option value="one">One</option></NativeSelect>
        <SelectInput label="Disabled select" defaultValue="one" options={options} disabled />
        <Checkbox label="Disabled checkbox" disabled />
        <Switch label="Disabled switch" disabled />
      </>}
      {kind === "selection" && <SelectionProbe />}
      {kind === "composer" && <BusyComposerProbe theme={theme} />}
      {kind === "overrides" && <ConsumerOverrideProbe />}
      {kind === "textarea" && <>
        <TextareaInput aria-label="Default growing notes" defaultValue="Short note" />
        <TextareaInput aria-label="Subtle growing notes" appearance="subtle" defaultValue="Short note" />
      </>}
    </section>
  );
}

const meta = {
  title: "Foundations/State rules contract",
  component: StateProbe,
  args: { theme: "light", kind: "buttons" },
  tags: ["!dev", "!autodocs"],
  globals: { theme: "light" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof StateProbe>;
export default meta;
type Story = StoryObj<typeof meta>;

function BothThemes({ kind }: { kind: Parameters<typeof StateProbe>[0]["kind"] }) {
  return <>{themes.map((theme) => <StateProbe key={theme} theme={theme} kind={kind} />)}</>;
}

// Read the browser's paint, including OKLCH/color-mix and alpha, rather than CSS spelling.
function rgba(value: string): number[] {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas color normalization is unavailable");
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  return Array.from(context.getImageData(0, 0, 1, 1).data);
}

function color(value: string): string {
  return rgba(value).join(",");
}

function role(element: Element, name: string): string {
  const value = getComputedStyle(element).getPropertyValue(`--color-ui-${name}`).trim();
  expect(value, `Missing ${name} role`).not.toBe("");
  return color(value);
}

function paint(element: Element, property: "color" | "backgroundColor" | "borderBottomColor" = "backgroundColor"): string {
  return color(getComputedStyle(element)[property]);
}

function composite(foreground: number[], background: number[]): number[] {
  const alpha = foreground[3]! / 255;
  return foreground.slice(0, 3).map((channel, index) => Math.round(channel * alpha + background[index]! * (1 - alpha))).concat(255);
}

function paintedBackground(element: Element, scope: HTMLElement): number[] {
  const parent = element.parentElement;
  const base = element === scope || !parent ? rgba(getComputedStyle(scope).backgroundColor) : paintedBackground(parent, scope);
  return composite(rgba(getComputedStyle(element).backgroundColor), base);
}

function luminance(channels: number[]): number {
  return channels.slice(0, 3).map((channel) => {
    const linear = channel / 255;
    return linear <= 0.04045 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
}

function contrast(left: number[], right: number[]): number {
  const a = luminance(left);
  const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function distance(left: number[], right: number[]): number {
  return Math.hypot(...left.slice(0, 3).map((channel, index) => channel - right[index]!));
}

function expectAccent(value: string, element: Element) {
  // Selection may use the accent's readable ink; keyboard focus may use a nearby Green stop.
  const [red, green, blue] = value.split(",").map(Number);
  expect(green! - red!, "Accent must remain Green, not neutral or danger").toBeGreaterThan(5);
  expect(green! - blue!, "Accent must remain Green, not cyan").toBeGreaterThan(5);
  expect(value).not.toBe(role(element, "danger-ink"));
}

function shadows(style: CSSStyleDeclaration): string[] {
  return style.boxShadow === "none" ? [] : style.boxShadow.split(/,(?![^()]*\))/);
}

function shadowLengths(shadow: string): number[] {
  return (shadow.replace(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/g, "").match(/-?[\d.]+px/g) ?? []).map(Number.parseFloat);
}

function expectNoOutsideRing(element: HTMLElement) {
  const style = getComputedStyle(element);
  if (style.outlineStyle !== "none" && rgba(style.outlineColor)[3]! > 0) {
    expect(Number.parseFloat(style.outlineOffset) + Number.parseFloat(style.outlineWidth), "Focus outline must stay inside the edge").toBeLessThanOrEqual(0);
  }
  for (const shadow of shadows(style)) {
    if (shadow.includes("inset")) continue;
    const lengths = shadowLengths(shadow);
    expect(lengths.every((length) => length === 0), `No floating focus shadow: ${shadow}`).toBe(true);
  }
}

function expectInsideEdge(element: HTMLElement, expectedColor?: string) {
  const style = getComputedStyle(element);
  expectNoOutsideRing(element);
  const edges: string[] = [];
  if ([style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].every((width) => width === "2px")) edges.push(color(style.borderTopColor));
  if (style.outlineWidth === "2px" && Number.parseFloat(style.outlineOffset) <= -2 && rgba(style.outlineColor)[3]! > 0) edges.push(color(style.outlineColor));
  for (const shadow of shadows(style)) {
    const lengths = shadowLengths(shadow);
    if (shadow.includes("inset") && lengths[0] === 0 && lengths[1] === 0 && lengths[2] === 0 && lengths[3] === 2) {
      const shadowColor = shadow.match(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/)?.[0];
      if (shadowColor) edges.push(color(shadowColor));
    }
  }
  expect(edges.some((edge) => edge.split(",")[3] !== "0"), "Keyboard focus must paint a visible 2px inside edge").toBe(true);
  const scope = element.closest<HTMLElement>("[data-theme]");
  if (!scope) throw new Error("Focus probe must have a painted theme scope");
  const background = paintedBackground(element, scope);
  expect(edges.some((edge) => edge.split(",")[3] !== "0" && contrast(edge.split(",").map(Number), background) >= 3), "Actual inside focus paint must reach 3:1 against its rendered fill").toBe(true);
  if (expectedColor) expect(edges).toContain(expectedColor);
}

async function settled(element: HTMLElement) {
  // Infinite spinners are intentionally not awaited. No fixed sleeps or disabled motion.
  const transitions = element.getAnimations({ subtree: true }).filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
  await Promise.all(transitions.map((animation) => animation.finished.catch(() => undefined)));
}

async function browser(width = 390) {
  // This platform module exists only in Vitest's browser runner, not Storybook's dev runtime.
  const context = await import("@vitest/browser/context");
  await context.page.viewport(width, 844);
  return context;
}

async function keyboardFocus(element: HTMLElement) {
  // Keep the runner-only platform import out of the ordinary Storybook module graph.
  const { userEvent } = await import("@vitest/browser/context");
  element.focus();
  await userEvent.tab({ shift: true });
  await userEvent.tab();
  await expect(element).toHaveFocus();
  expect(element.matches(":focus-visible"), "Use actual keyboard-visible focus").toBe(true);
  await settled(element);
}

function scopes(canvasElement: HTMLElement): HTMLElement[] {
  return themes.map((theme) => within(canvasElement).getByRole("region", { name: `${theme} state rules` }));
}

function field(scope: HTMLElement, name: string): HTMLElement {
  const canvas = within(scope);
  return name.endsWith("Number") ? canvas.getByRole("spinbutton", { name })
    : name.endsWith("select") || name.endsWith("Select") ? canvas.getByRole("combobox", { name })
      : canvas.getByRole("textbox", { name });
}

export const ButtonFocus: Story = {
  render: () => <BothThemes kind="buttons" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const scope of scopes(canvasElement)) {
      const canvas = within(scope);
      await userEvent.hover(canvas.getByTestId("pointer-parking"));
      for (const name of ["Primary action", "Secondary action", "Danger action", "Selected action"]) {
        const button = canvas.getByRole("button", { name });
        await keyboardFocus(button);
        expectInsideEdge(button, name === "Primary action" || name === "Selected action" ? role(button, "on-accent") : undefined);
        if (name === "Danger action") expect(paint(button, "color")).toBe(role(button, "danger-ink"));
        if (name === "Selected action") {
          expect(paint(button)).toBe(role(button, "accent"));
          expect(paint(button, "color")).toBe(role(button, "on-accent"));
        }
      }
      for (const name of ["Unselected icon", "Selected icon"]) {
        const button = canvas.getByRole("button", { name });
        button.blur();
        await settled(button);
        const rest = paintedBackground(button, scope);
        const icon = button.querySelector("svg");
        expect(icon).not.toBeNull();
        const restInk = paint(icon!, "color");
        await keyboardFocus(button);
        expectNoOutsideRing(button);
        const focused = paintedBackground(button, scope);
        expect(distance(focused, rest), "Icon focus must paint a tinted plate").toBeGreaterThan(2);
        expect(contrast(focused, rest), "Icon focus plate must stay faint").toBeLessThan(1.7);
        expectTint(button, scope, 16, rgba(getComputedStyle(scope).getPropertyValue("--color-ui-surface")));
        expect(contrast(rgba(getComputedStyle(button).borderColor), focused), "Thin icon focus edge must remain distinguishable on its plate").toBeGreaterThanOrEqual(3);
        expect(paint(icon!, "color"), "Focus must not consume the icon's on/off color").toBe(restInk);
        if (name === "Selected icon") expectAccent(restInk, button);
      }
    }
  },
};

export const FieldFocus: Story = {
  render: () => <BothThemes kind="fields" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const scope of scopes(canvasElement)) {
      await userEvent.hover(within(scope).getByTestId("pointer-parking"));
      for (const name of fieldNames) {
        const input = field(scope, name);
        const rest = paintedBackground(input, scope);
        await keyboardFocus(input);
        const style = getComputedStyle(input);
        expect(style.borderBottomWidth, `${name} focus underline`).toBe("2px");
        expect([style.borderTopWidth, style.borderLeftWidth, style.borderRightWidth]).toEqual(["0px", "0px", "0px"]);
        expectNoOutsideRing(input);
        expectAccent(paint(input, "borderBottomColor"), input);
        const focused = paintedBackground(input, scope);
        expect(distance(focused, rest), `${name} must gain a focus tint`).toBeGreaterThan(2);
        expect(contrast(focused, rest), `${name} focus tint must stay faint`).toBeLessThan(1.7);
        expectTint(input, scope, 8, rgba(getComputedStyle(scope).getPropertyValue("--color-ui-surface")));
        expect(contrast(rgba(style.borderBottomColor), focused), `${name} focus underline must remain distinguishable`).toBeGreaterThanOrEqual(3);
        input.blur();
        await settled(input);
        expect(paintedBackground(input, scope)).toEqual(rest);
      }
      const select = field(scope, "Select");
      await keyboardFocus(select);
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() => expect(within(document.body).getByRole("listbox")).toBeVisible());
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(select).toHaveFocus());
      expect(within(document.body).queryByRole("listbox")).not.toBeInTheDocument();
    }
  },
};

export const InvalidFocus: Story = {
  render: () => <BothThemes kind="invalid" />,
  play: async ({ canvasElement }) => {
    await browser();
    for (const scope of scopes(canvasElement)) {
      for (const name of fieldNames) {
        const input = field(scope, `Invalid ${name}`);
        await keyboardFocus(input);
        await expect(input).toHaveAttribute("aria-invalid", "true");
        await expect(input).toHaveAccessibleDescription(errorWords);
        expect(getComputedStyle(input).borderBottomWidth).toBe("2px");
        expect([role(input, "danger"), role(input, "danger-ink")]).toContain(paint(input, "borderBottomColor"));
        expect(paint(input, "color")).toBe(role(input, "danger-ink"));
        expectNoOutsideRing(input);
        const descriptions = (input.getAttribute("aria-describedby") ?? "").split(/\s+/).map((id) => document.getElementById(id));
        expect(descriptions.some((description) => description?.textContent === errorWords)).toBe(true);
        for (const description of descriptions) if (description?.textContent === errorWords) await expect(description).toBeVisible();
      }
    }
  },
};

function effectiveOpacity(element: Element, scope: HTMLElement): number {
  let opacity = Number(getComputedStyle(element).opacity);
  for (let parent = element.parentElement; parent && parent !== scope; parent = parent.parentElement) opacity *= Number(getComputedStyle(parent).opacity);
  return opacity;
}

function visible(element: HTMLElement | SVGElement): boolean {
  if (element.getBoundingClientRect().width === 0 || element.getBoundingClientRect().height === 0) return false;
  for (let current: Element | null = element; current; current = current.parentElement) {
    const style = getComputedStyle(current);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
  }
  return true;
}

export const DisabledAndBusy: Story = {
  render: () => <BothThemes kind="availability" />,
  play: async ({ canvasElement }) => {
    await browser();
    for (const scope of scopes(canvasElement)) {
      const canvas = within(scope);
      for (const name of ["Disabled action", "Disabled icon", "Disabled text", "Disabled number", "Disabled textarea", "Disabled native select", "Disabled select", "Disabled checkbox", "Disabled switch"]) {
        const control = name === "Disabled action" || name === "Disabled icon"
          ? canvas.getByRole("button", { name })
          : canvas.getByLabelText(name, { exact: true });
        await expect(control).toBeDisabled();
        expect(effectiveOpacity(control, scope), `${name} must be faded`).toBeLessThan(1);
      }
      for (const name of ["Save progress", "Search in progress"]) {
        const button = canvas.getByRole("button", { name });
        await expect(button).toHaveAttribute("aria-busy", "true");
        await expect(button).toBeEnabled();
        await expect(button).toHaveAccessibleName(name);
        expect(effectiveOpacity(button, scope), "Busy must not mean fading").toBe(1);
        await keyboardFocus(button);
        const spinning = Array.from(button.querySelectorAll<HTMLElement | SVGElement>("*")).filter((element) => visible(element) && element.getAnimations().some((animation) => animation.effect?.getComputedTiming().iterations === Infinity));
        expect(spinning.length, "aria-busy must show a visible spinner").toBeGreaterThan(0);
        for (const spinner of spinning) expect(effectiveOpacity(spinner, scope)).toBe(1);
      }
      const originalIcon = canvas.queryByTestId("original-busy-icon");
      if (originalIcon) await expect(originalIcon).not.toBeVisible();
    }
  },
};

export const PersistentSelection: Story = {
  render: () => <BothThemes kind="selection" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const scope of scopes(canvasElement)) {
      const canvas = within(scope);
      const toggle = canvas.getByRole("button", { name: "Toggle choice" });
      for (const control of [canvas.getByRole("button", { name: "Selected icon" }), canvas.getByRole("tab", { name: "Tab One" }), canvas.getByRole("button", { name: "Segment One" })]) {
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await keyboardFocus(control);
        expectSelectionInk(control);
        expectNoOutsideRing(control);
        await userEvent.hover(control);
        await settled(control);
        expectSelectionInk(control);
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await settled(control);
        expectSelectionInk(control);
      }
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await keyboardFocus(toggle);
      expect(paint(toggle)).toBe(role(toggle, "accent"));
      expect(paint(toggle, "color")).toBe(role(toggle, "on-accent"));
      expectInsideEdge(toggle, role(toggle, "on-accent"));
      await userEvent.hover(toggle);
      await settled(toggle);
      expectAccent(paint(toggle), toggle);
      expect(paint(toggle, "color")).toBe(role(toggle, "on-accent"));
      await userEvent.hover(canvas.getByTestId("pointer-parking"));
      await settled(toggle);
      expect(paint(toggle)).toBe(role(toggle, "accent"));
      await userEvent.keyboard(" ");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await settled(toggle);
      expect(paint(toggle, "color")).not.toBe(role(toggle, "accent-link"));
      await userEvent.keyboard(" ");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await settled(toggle);
      expect(paint(toggle)).toBe(role(toggle, "accent"));
      expect(paint(toggle, "color")).toBe(role(toggle, "on-accent"));

      const firstTab = canvas.getByRole("tab", { name: "Tab One" });
      await keyboardFocus(firstTab);
      await userEvent.keyboard("{ArrowRight}");
      const nextTab = canvas.getByRole("tab", { name: "Tab Two" });
      await expect(nextTab).toHaveFocus();
      await expect(nextTab).toHaveAttribute("aria-selected", "true");
      await settled(nextTab);
      expectSelectionInk(nextTab);
      await expect(canvas.getByText("Second panel")).toBeVisible();

      const nextSegment = canvas.getByRole("button", { name: "Segment Two" });
      await keyboardFocus(nextSegment);
      await userEvent.keyboard(" ");
      await expect(nextSegment).toHaveAttribute("aria-pressed", "true");
      await expect(nextSegment).toHaveFocus();
      await settled(nextSegment);
      expectAccent(paint(nextSegment, "color"), nextSegment);

      for (const control of [canvas.getByRole("checkbox", { name: "Checked choice" }), canvas.getByRole("switch", { name: "Enabled choice" })]) {
        await keyboardFocus(control);
        await expect(control).toBeChecked();
        expect(paint(control)).toBe(role(control, "accent"));
        expectNoOutsideRing(control);
        expectInsideEdge(control, role(control, "on-accent"));
        await userEvent.keyboard(" ");
        await expect(control).not.toBeChecked();
        await expect(control).toHaveFocus();
        await settled(control);
        expect(paint(control)).not.toBe(role(control, "accent"));
        expectInsideEdge(control);
        await userEvent.keyboard(" ");
        await expect(control).toBeChecked();
        await expect(control).toHaveFocus();
        await settled(control);
        expect(paint(control)).toBe(role(control, "accent"));
        expectInsideEdge(control, role(control, "on-accent"));
      }
    }
  },
};

function topLevelPoint(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  let x = rect.left + rect.width / 2;
  let y = rect.top + rect.height / 2;
  let current: Window = window;
  while (current.frameElement) {
    const frameElement = current.frameElement;
    const frame = frameElement.getBoundingClientRect();
    const style = current.parent.getComputedStyle(frameElement);
    const leftBorder = Number.parseFloat(style.borderLeftWidth);
    const topBorder = Number.parseFloat(style.borderTopWidth);
    // Vitest scales its iframe to fit the runner; CDP takes top-level viewport coordinates.
    const scaleX = frame.width / (current.innerWidth + leftBorder + Number.parseFloat(style.borderRightWidth));
    const scaleY = frame.height / (current.innerHeight + topBorder + Number.parseFloat(style.borderBottomWidth));
    x = frame.left + (x + leftBorder) * scaleX;
    y = frame.top + (y + topBorder) * scaleY;
    current = current.parent;
  }
  return { x, y };
}

export const RealPressFeedbackLight: Story = {
  render: () => <BothThemes kind="buttons" />,
  play: async ({ canvasElement, args }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const scope of scopes(canvasElement)) {
      if (scope.dataset.theme !== args.theme) continue;
      const canvas = within(scope);
      for (const name of ["Primary action", "Secondary action", "Danger action", "Selected action", "Unselected icon", "Selected icon"]) {
        const button = canvas.getByRole("button", { name });
        // Pointer paint is measured without the separate keyboard-only focus plate.
        button.blur();
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await settled(button);
        const rest = paintedBackground(button, scope);
        await userEvent.hover(button);
        await settled(button);
        const hovered = paintedBackground(button, scope);
        expect(distance(hovered, rest), `${name}: real hover changes fill`).toBeGreaterThan(2);
        const point = topLevelPoint(button);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(button.matches(":active"), "Real pointer-down must reach CSS :active").toBe(true);
          await settled(button);
          const pressed = paintedBackground(button, scope);
          expect(distance(pressed, rest), `${name}: press fill must be stronger than hover`).toBeGreaterThan(distance(hovered, rest) + 1);
          if (name === "Selected action") {
            expectAccent(paint(button), button);
            expect(paint(button, "color")).toBe(role(button, "on-accent"));
          } else if (name === "Selected icon") expectAccent(paint(button, "color"), button);
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
        }
        await settled(button);
        expect(button.matches(":active")).toBe(false);
        expect(paintedBackground(button, scope)).toEqual(hovered);
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await keyboardFocus(button);
        const keyboardRest = paintedBackground(button, scope);
        await userEvent.keyboard("[Space>]");
        try {
          expect(button.matches(":active"), "Held Space must reach CSS :active").toBe(true);
          await settled(button);
          const keyboardPressed = paintedBackground(button, scope);
          if (name.endsWith("icon")) {
            // The accepted icon focus plate and held-press plate are both 16%;
            // press strengthens pointer hover, not the independent keyboard focus cue.
            expectTint(button, scope, 16, rgba(getComputedStyle(scope).getPropertyValue("--color-ui-surface")));
            expect(distance(keyboardPressed, rest), `${name}: held Space strengthens pointer-rest fill`).toBeGreaterThan(2);
            expect(distance(keyboardPressed, rest)).toBeGreaterThan(distance(hovered, rest) + 1);
            if (name === "Selected icon") expectAccent(paint(button, "color"), button);
          } else {
            expect(distance(keyboardPressed, keyboardRest), `${name}: held Space changes fill`).toBeGreaterThan(2);
          }
        } finally {
          await userEvent.keyboard("[/Space]");
        }
        await settled(button);
        expect(button.matches(":active")).toBe(false);
        expect(paintedBackground(button, scope)).toEqual(keyboardRest);
        if (name.startsWith("Selected")) await expect(button).toHaveAttribute("aria-pressed", "true");
      }
    }
  },
};

export const RealPressFeedbackDark: Story = {
  ...RealPressFeedbackLight,
  args: { theme: "dark" },
};

export const BusyComposerConsumer: Story = {
  render: () => <BothThemes kind="composer" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const scope of scopes(canvasElement)) {
      const canvas = within(scope);
      for (const name of ["Available stop", "Unavailable stop", "Available queue", "Unavailable queue"]) {
        const group = canvas.getByRole(name.endsWith("stop") ? "group" : "form", { name: name.endsWith("stop") ? name : `${scope.dataset.theme} ${name}` });
        const button = within(group).getByRole("button", { name: name.endsWith("stop") ? "Stop response" : "Queue message" });
        button.blur();
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await settled(button);
        await expect(button).toHaveAttribute("aria-busy", "true");
        const graphics = Array.from(button.querySelectorAll("svg")).filter(visible);
        expect(graphics, `${name}: exactly one graphic at rest, not duplicate busy indicators`).toHaveLength(1);
        expect(graphics[0]!.getAnimations().some((animation) => animation.effect?.getComputedTiming().iterations === Infinity), `${name}: the resting graphic is the spinner`).toBe(true);
        if (name.startsWith("Unavailable")) {
          await expect(button).toBeDisabled();
          continue;
        }
        await expect(button).toBeEnabled();
        expect(effectiveOpacity(button, scope)).toBe(1);
        await keyboardFocus(button);
        const focusedGraphics = Array.from(button.querySelectorAll("svg")).filter(visible);
        expect(focusedGraphics, "Focus reveals one action glyph instead of a competing spinner").toHaveLength(1);
        expect(focusedGraphics[0]!.getAnimations().some((animation) => animation.effect?.getComputedTiming().iterations === Infinity)).toBe(false);
        await userEvent.keyboard(" ");
        await expect(button).toHaveFocus();
        await expect(button).toHaveAccessibleName(name.endsWith("stop") ? "Stop response" : "Queue message");
        button.blur();
        await userEvent.hover(button);
        await settled(button);
        const hoveredGraphics = Array.from(button.querySelectorAll("svg")).filter(visible);
        expect(hoveredGraphics, "Hover also reveals exactly one action glyph").toHaveLength(1);
        expect(hoveredGraphics[0]!.getAnimations().some((animation) => animation.effect?.getComputedTiming().iterations === Infinity)).toBe(false);
      }
      await expect(canvas.getByText("Stop requests: 1")).toBeVisible();
      await expect(canvas.getByText("Queued messages: 1")).toBeVisible();
    }
  },
};

function ConsumerOverrideProbe() {
  const [tab, setTab] = useState("one");
  const [segment, setSegment] = useState("one");
  const overrides = "hover:bg-ui-muted active:bg-ui-muted";
  return (
    <>
      <TextInput aria-label="Override text" defaultValue="Consumer styling" className={overrides} />
      <NativeSelect aria-label="Override native select" defaultValue="one" className={overrides}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <SelectInput label="Override select" defaultValue="one" options={options} className={overrides} />
      <Tabs ariaLabel="Override tabs" value={tab} onValueChange={setTab} triggerClassName={overrides} tabs={options.map((option) => ({ value: option.value, label: `Override tab ${option.label}` }))}>
        {(option) => <p>{option.value === "one" ? "Consumer first panel" : "Consumer second panel"}</p>}
      </Tabs>
      <SegmentedControl ariaLabel="Override segments" options={options.map((option) => ({ ...option, label: `Override segment ${option.label}` }))} value={segment} onValueChange={setSegment} buttonClassName={overrides} />
    </>
  );
}

export const ConsumerOverrides: Story = {
  render: () => <BothThemes kind="overrides" />,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const scope of scopes(canvasElement)) {
      const canvas = within(scope);
      const controls = [
        canvas.getByRole("textbox", { name: "Override text" }),
        canvas.getByRole("combobox", { name: "Override native select" }),
        canvas.getByRole("combobox", { name: "Override select" }),
        canvas.getByRole("tab", { name: "Override tab Two" }),
        canvas.getByRole("button", { name: "Override segment Two" }),
      ];
      for (const control of controls) {
        control.blur();
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await settled(control);
        await userEvent.hover(control);
        expect(control.matches(":hover"), "Consumer hover assertion must use native hover").toBe(true);
        await settled(control);
        expect(paint(control), "Ordinary caller hover:bg-ui-muted must replace the default fill").toBe(role(control, "muted"));
        const point = topLevelPoint(control);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(control.matches(":active"), "Consumer active assertion must use a genuinely held pointer").toBe(true);
          await settled(control);
          expect(paint(control), "Ordinary caller active:bg-ui-muted must replace the default press fill").toBe(role(control, "muted"));
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
          await userEvent.keyboard("{Escape}");
        }
      }
    }
  },
};

function expectTint(element: HTMLElement, scope: HTMLElement, percentage: number, base: number[]) {
  const accent = rgba(getComputedStyle(scope).getPropertyValue("--color-ui-accent"));
  const expected = base.slice(0, 3).map((channel, index) => Math.round(channel * (1 - percentage / 100) + accent[index]! * percentage / 100)).concat(255);
  // At most one 8-bit rounding step per channel; compare paint, not color-mix spelling.
  expect(distance(paintedBackground(element, scope), expected), `${percentage}% accent tint over its actual base`).toBeLessThanOrEqual(2);
}

export const SubtleTextareaGrowth: Story = {
  render: () => <BothThemes kind="textarea" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    const multiline = Array.from({ length: 12 }, (_, index) => `Note line ${index + 1}`).join("\n");
    for (const scope of scopes(canvasElement)) {
      const canvas = within(scope);
      const normal = canvas.getByRole("textbox", { name: "Default growing notes" });
      const subtle = canvas.getByRole("textbox", { name: "Subtle growing notes" });
      const normalStyle = getComputedStyle(normal);
      const subtleStyle = getComputedStyle(subtle);
      expect(Number.parseFloat(subtleStyle.paddingTop), "Subtle notes retain vertical breathing room").toBeGreaterThan(0);
      expect(subtleStyle.paddingTop).toBe(normalStyle.paddingTop);
      expect(subtleStyle.paddingBottom).toBe(normalStyle.paddingBottom);
      for (const input of [normal, subtle]) {
        const initialHeight = input.getBoundingClientRect().height;
        await userEvent.fill(input, multiline);
        await waitFor(() => expect(input.getBoundingClientRect().height, "Multiline notes must grow instead of clipping into the initial height").toBeGreaterThan(initialHeight));
        expect(input.scrollHeight).toBeLessThanOrEqual(input.clientHeight + 1);
        await expect(input).toHaveValue(multiline);
      }
    }
  },
};

export const FieldPointerTint: Story = {
  render: () => <BothThemes kind="fields" />,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const scope of scopes(canvasElement)) {
      const surface = rgba(getComputedStyle(scope).getPropertyValue("--color-ui-surface"));
      for (const name of fieldNames) {
        const input = field(scope, name);
        input.blur();
        await userEvent.hover(within(scope).getByTestId("pointer-parking"));
        await settled(input);
        const rest = paintedBackground(input, scope);
        await userEvent.hover(input);
        await settled(input);
        const hovered = paintedBackground(input, scope);
        expectTint(input, scope, 6, surface);
        expect(distance(hovered, rest)).toBeGreaterThan(2);
        const point = topLevelPoint(input);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(input.matches(":active")).toBe(true);
          await settled(input);
          expectTint(input, scope, 12, surface);
          expect(distance(paintedBackground(input, scope), rest)).toBeGreaterThan(distance(hovered, rest) + 1);
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
          await userEvent.keyboard("{Escape}");
        }
      }
    }
  },
};

export const SelectionTrackFeedback: Story = {
  render: () => <BothThemes kind="selection" />,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const scope of scopes(canvasElement)) {
      const canvas = within(scope);
      const tabList = canvas.getByRole("tablist", { name: "State tabs" });
      const segments = canvas.getByRole("group", { name: "State segments" });
      for (const [control, track] of [
        [canvas.getByRole("tab", { name: "Tab Two" }), tabList],
        [canvas.getByRole("button", { name: "Segment Two" }), segments],
      ] as const) {
        control.blur();
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await settled(control);
        const trackPaint = paintedBackground(track, scope);
        const selectedSurface = rgba(getComputedStyle(scope).getPropertyValue("--color-ui-surface"));
        await userEvent.hover(control);
        await settled(control);
        const hovered = paintedBackground(control, scope);
        const hoverBase = control.getAttribute("aria-selected") === "true" || control.getAttribute("aria-pressed") === "true" ? selectedSurface : trackPaint;
        expectTint(control, scope, 8, hoverBase);
        expect(distance(hovered, trackPaint), "Unselected hover must be visible against the actual muted track").toBeGreaterThan(2);
        expect(contrast(hovered, trackPaint), "Track feedback stays faint").toBeLessThan(1.7);
        if (scope.dataset.theme === "dark") {
          expect(distance(hovered, selectedSurface), "Unselected hover must move away from the selected surface, not impersonate it").toBeGreaterThan(distance(trackPaint, selectedSurface));
        }
        const point = topLevelPoint(control);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(control.matches(":active")).toBe(true);
          await settled(track);
          // Native selection timing differs: Tabs select on pointer-down,
          // segments on release. The selected indicator becomes the painted base.
          const pressBase = control.getAttribute("aria-selected") === "true" || control.getAttribute("aria-pressed") === "true" ? selectedSurface : trackPaint;
          const pressed = composite(rgba(getComputedStyle(control).backgroundColor), pressBase);
          expect(distance(pressed, trackPaint), "Held press strengthens actual track feedback").toBeGreaterThan(distance(hovered, trackPaint) + 1);
          expectTint(control, scope, 16, pressBase);
          expectSelectionInk(within(tabList).getByRole("tab", { selected: true }));
          expectAccent(paint(within(segments).getByRole("button", { pressed: true }), "color"), segments);
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
        }
        await settled(track);
        const releasedBase = control.getAttribute("aria-selected") === "true" || control.getAttribute("aria-pressed") === "true" ? selectedSurface : trackPaint;
        expectTint(control, scope, 8, releasedBase);
        expectSelectionInk(within(tabList).getByRole("tab", { selected: true }));
        expectAccent(paint(within(segments).getByRole("button", { pressed: true }), "color"), segments);
      }
    }
  },
};

export const UncheckedSwitchFeedback: Story = {
  render: () => <BothThemes kind="selection" />,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const scope of scopes(canvasElement)) {
      const canvas = within(scope);
      const control = canvas.getByRole("switch", { name: "Inactive choice" });
      const thumb = control.firstElementChild;
      expect(thumb).not.toBeNull();
      await userEvent.hover(canvas.getByTestId("pointer-parking"));
      await expect(control).not.toBeChecked();
      await settled(control);
      const rest = paintedBackground(control, scope);
      const baselineContrast = contrast(rest, paintedBackground(thumb!, scope));
      await userEvent.hover(control);
      await settled(control);
      const hovered = paintedBackground(control, scope);
      expect(distance(hovered, rest)).toBeGreaterThan(2);
      expect(contrast(hovered, paintedBackground(thumb!, scope)), "Hover must not erase existing track/thumb separation").toBeGreaterThanOrEqual(baselineContrast);
      const point = topLevelPoint(control);
      await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
      try {
        expect(control.matches(":active")).toBe(true);
        await expect(control).not.toBeChecked();
        await settled(control);
        const pressed = paintedBackground(control, scope);
        expect(distance(pressed, rest)).toBeGreaterThan(distance(hovered, rest) + 1);
        expect(contrast(pressed, paintedBackground(thumb!, scope)), "Press must not erase existing track/thumb separation").toBeGreaterThanOrEqual(baselineContrast);
      } finally {
        await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
      }
      await expect(control).toBeChecked();
    }
  },
};

function GraphDataTabsProbe() {
  const [value, setValue] = useState("graph");
  return (
    <div data-testid="tabs-container" className="w-full">
      <button type="button">Graph/data keyboard start</button>
      <Tabs
        ariaLabel="Graph and data"
        value={value}
        onValueChange={setValue}
        tabs={[{ value: "graph", label: "Graph" }, { value: "data", label: "Data" }]}
      >
        {(tab) => <p>{tab.value === "graph" ? "Graph content" : "Data content"}</p>}
      </Tabs>
    </div>
  );
}

function TabsLayoutProbe() {
  return <>{themes.map((theme) => (
    <section key={theme} data-theme={theme} aria-label={`${theme} graph and data`} className="w-full bg-ui-background p-4 text-sm text-ui-foreground">
      <h2>{theme} graph and data</h2>
      <GraphDataTabsProbe />
    </section>
  ))}</>;
}

function expectTabsPresentation(scope: HTMLElement) {
  const canvas = within(scope);
  const container = canvas.getByTestId("tabs-container");
  const list = canvas.getByRole("tablist", { name: "Graph and data" });
  const tabs = within(list).getAllByRole("tab");
  const selected = within(list).getByRole("tab", { selected: true });
  const inactive = within(list).getByRole("tab", { selected: false });
  const listStyle = getComputedStyle(list);
  const listRect = list.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  expect(Math.abs(listRect.left - containerRect.left), "Tab group starts at its container edge").toBeLessThanOrEqual(1);
  expect(Math.abs(listRect.width - containerRect.width), "Tab group spans the full container").toBeLessThanOrEqual(1);
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    expect(Number.parseFloat(listStyle[`border${side}Width`]), "Keep every side of the tabgroup box").toBeGreaterThan(0);
    expect(rgba(listStyle[`border${side}Color`])[3], "Keep a painted tabgroup border").toBeGreaterThan(0);
  }
  for (const corner of ["TopLeft", "TopRight", "BottomLeft", "BottomRight"] as const) {
    expect(Number.parseFloat(listStyle[`border${corner}Radius`]), "Keep the rounded tabgroup box").toBeGreaterThan(0);
  }
  expect(paint(list), "The group retains its muted track").toBe(role(list, "muted"));
  expect(tabs).toHaveLength(2);
  const widths = tabs.map((tab) => tab.getBoundingClientRect().width);
  expect(Math.abs(widths[0]! - widths[1]!), "Graph and Data share the available width equally").toBeLessThanOrEqual(1);
  expect(Math.abs(widths.reduce((sum, width) => sum + width, 0) - list.clientWidth), "Tab triggers fill the group's interior").toBeLessThanOrEqual(1);
  const selectedStyle = getComputedStyle(selected);
  expect(Number(selectedStyle.fontWeight), "Selected tab remains bold").toBeGreaterThanOrEqual(600);
  expect(Number(selectedStyle.fontWeight), "Selection remains typographically distinct").toBeGreaterThan(Number(getComputedStyle(inactive).fontWeight));
  expectSelectionInk(selected);

  // Account for the existing moving selected plate as well as a direct trigger fill.
  // Geometry, not a CSS class or a private indicator attribute, identifies painted layers.
  const selectedRect = selected.getBoundingClientRect();
  const centerX = selectedRect.left + selectedRect.width / 2;
  const centerY = selectedRect.top + selectedRect.height / 2;
  let selectedPaint = paintedBackground(list, scope);
  for (const child of Array.from(list.children)) {
    if (child.getAttribute("role") === "tab") continue;
    const rect = child.getBoundingClientRect();
    const fill = rgba(getComputedStyle(child).backgroundColor);
    if (fill[3] === 0 || rect.width === 0 || rect.height === 0) continue;
    if (centerX >= rect.left && centerX <= rect.right && centerY >= rect.top && centerY <= rect.bottom) {
      expect(rect.height, "Selection is a filled plate, not an underline").toBeGreaterThanOrEqual(selectedRect.height - 2);
      selectedPaint = composite(fill, selectedPaint);
    }
    expect(rect.width >= selectedRect.width / 2 && rect.height <= 3, "Do not retain a separate selected underline").toBe(false);
  }
  selectedPaint = composite(rgba(selectedStyle.backgroundColor), selectedPaint);
  expect(selectedPaint.join(","), "Keep the selected surface fill").toBe(role(selected, "surface"));
  expect(selectedPaint).not.toEqual(paintedBackground(list, scope));
  for (const tab of tabs) {
    const style = getComputedStyle(tab);
    expect(style.textDecorationLine, "Only the underline is removed").not.toContain("underline");
    if (rgba(style.borderBottomColor)[3]! > 0) {
      expect(Number.parseFloat(style.borderBottomWidth), "No bottom-only selected stroke").toBeLessThanOrEqual(Number.parseFloat(style.borderTopWidth));
    }
    for (const pseudo of ["::before", "::after"]) {
      const pseudoStyle = getComputedStyle(tab, pseudo);
      if (pseudoStyle.content === "none" || pseudoStyle.content === "normal" || rgba(pseudoStyle.backgroundColor)[3] === 0) continue;
      expect(Number.parseFloat(pseudoStyle.height), "No generated underline beneath the selected fill").toBeGreaterThan(3);
    }
  }
}

async function checkGraphDataTabs(canvasElement: HTMLElement, width: number) {
  const { userEvent } = await browser(width);
  for (const theme of themes) {
    const scope = within(canvasElement).getByRole("region", { name: `${theme} graph and data` });
    const canvas = within(scope);
    const list = canvas.getByRole("tablist", { name: "Graph and data" });
    const graph = within(list).getByRole("tab", { name: "Graph" });
    const data = within(list).getByRole("tab", { name: "Data" });
    await userEvent.hover(canvas.getByRole("heading", { name: `${theme} graph and data` }));
    await settled(list);
    expectTabsPresentation(scope);
    await keyboardFocus(graph);
    expectInsideEdge(graph);
    await userEvent.keyboard("{ArrowRight}");
    await expect(data).toHaveFocus();
    await expect(data).toHaveAttribute("aria-selected", "true");
    await expect(graph).toHaveAttribute("aria-selected", "false");
    await expect(canvas.getByRole("tabpanel", { name: "Data" })).toHaveTextContent("Data content");
    await settled(list);
    expectTabsPresentation(scope);
    expectInsideEdge(data);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(graph).toHaveFocus();
    await expect(graph).toHaveAttribute("aria-selected", "true");
    await expect(data).toHaveAttribute("aria-selected", "false");
    await expect(canvas.getByRole("tabpanel", { name: "Graph" })).toHaveTextContent("Graph content");
    await settled(list);
    expectTabsPresentation(scope);
  }
}

export const GraphDataTabs390: Story = {
  render: () => <TabsLayoutProbe />,
  play: async ({ canvasElement }) => checkGraphDataTabs(canvasElement, 390),
};

export const GraphDataTabs1440: Story = {
  ...GraphDataTabs390,
  play: async ({ canvasElement }) => checkGraphDataTabs(canvasElement, 1440),
};

function expectSelectionInk(control: HTMLElement) {
  // Owner correction: Graph/Data tabs retain neutral labels, fill and bold.
  // Other persistent choices continue to use accent ink.
  if (control.getAttribute("role") === "tab") {
    expect(paint(control, "color")).toBe(role(control, "foreground"));
  } else {
    expectAccent(paint(control, "color"), control);
  }
}

function CalendarStateProbe({ theme }: { theme: Theme }) {
  const [value, setValue] = useState<Date | null>(new Date(2026, 0, 16));
  const [month, setMonth] = useState(new Date(2026, 0, 1));
  return <Calendar
    ariaLabel={`${theme} state calendar`}
    locale="en-US"
    weekStartsOn={0}
    value={value}
    onValueChange={setValue}
    month={month}
    onMonthChange={setMonth}
    disabled={(date) => date.getDay() === 0}
  />;
}

function ColorStateProbe({ theme }: { theme: Theme }) {
  const [colors, setColors] = useState(["#2563eb", "#c2410c"]);
  const [value, setValue] = useState("#c2410c");
  return <>
    <ColorSelector label={`${theme} data paint`} colors={colors} onValueChange={(index, color) => setColors((current) => current.map((entry, slot) => slot === index ? color : entry))} />
    <ColorSelector label={`${theme} disabled paint`} colors={["#2563eb"]} disabled onValueChange={() => undefined} />
    <ColorPicker label={`${theme} channel editor`} value={value} onValueChange={setValue} />
  </>;
}

function ShippedControlsProbe({ kind }: { kind: "calendar" | "colors" }) {
  return <>{themes.map((theme) => (
    <section key={theme} data-theme={theme} aria-label={`${theme} shipped controls`} className="grid w-[390px] max-w-full gap-4 bg-ui-background p-4 text-sm text-ui-foreground">
      <h2>{theme} shipped controls</h2>
      <button type="button" data-testid="shipped-parking">Interaction start</button>
      {kind === "calendar" ? <CalendarStateProbe theme={theme} /> : <ColorStateProbe theme={theme} />}
    </section>
  ))}</>;
}

export const CalendarFocusAndKeyboard: Story = {
  render: () => <ShippedControlsProbe kind="calendar" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} shipped controls` });
      const canvas = within(scope);
      const calendar = within(canvas.getByRole("region", { name: `${theme} state calendar` }));
      await userEvent.hover(canvas.getByTestId("shipped-parking"));
      for (const name of ["Previous month", "Next month"]) {
        const control = calendar.getByRole("button", { name });
        control.blur();
        await settled(control);
        const rest = paintedBackground(control, scope);
        const icon = control.querySelector("svg");
        expect(icon).not.toBeNull();
        const ink = paint(icon!, "color");
        await keyboardFocus(control);
        expectNoOutsideRing(control);
        expectTint(control, scope, 16, rgba(getComputedStyle(scope).getPropertyValue("--color-ui-surface")));
        expect(distance(paintedBackground(control, scope), rest)).toBeGreaterThan(2);
        expect(paint(icon!, "color")).toBe(ink);
      }
      const selected = calendar.getByRole("gridcell", { name: "Friday, January 16, 2026" });
      await keyboardFocus(selected);
      await expect(selected).toHaveAttribute("aria-selected", "true");
      expect(paint(selected)).toBe(role(selected, "accent"));
      expect(paint(selected, "color")).toBe(role(selected, "on-accent"));
      expectInsideEdge(selected, role(selected, "on-accent"));
      await userEvent.keyboard("{ArrowRight}");
      const saturday = calendar.getByRole("gridcell", { name: "Saturday, January 17, 2026" });
      await waitFor(() => expect(saturday).toHaveFocus());
      await settled(saturday);
      await expect(saturday).toHaveAttribute("aria-selected", "false");
      expectInsideEdge(saturday);
      const unavailable = calendar.getByRole("gridcell", { name: "Sunday, January 18, 2026" });
      await expect(unavailable).toBeDisabled();
      expect(effectiveOpacity(unavailable, scope)).toBeLessThan(1);
      await userEvent.keyboard("{ArrowRight}");
      const monday = calendar.getByRole("gridcell", { name: "Monday, January 19, 2026" });
      await waitFor(() => expect(monday).toHaveFocus());
      await expect(unavailable).not.toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(monday).toHaveAttribute("aria-selected", "true");
      await expect(monday).toHaveFocus();
      await settled(monday);
      expect(paint(monday)).toBe(role(monday, "accent"));
      expect(paint(monday, "color")).toBe(role(monday, "on-accent"));
      expectInsideEdge(monday, role(monday, "on-accent"));
      await userEvent.keyboard("{PageDown}");
      await waitFor(() => expect(calendar.getByRole("gridcell", { name: "Monday, February 2, 2026" })).toHaveFocus());
      await expect(calendar.getByRole("heading", { name: "February 2026" })).toBeVisible();
    }
  },
};

export const CalendarPointerFeedback: Story = {
  render: () => <ShippedControlsProbe kind="calendar" />,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} shipped controls` });
      const canvas = within(scope);
      const calendar = within(canvas.getByRole("region", { name: `${theme} state calendar` }));
      const controls = [
        calendar.getByRole("gridcell", { name: "Friday, January 16, 2026" }),
        calendar.getByRole("gridcell", { name: "Saturday, January 17, 2026" }),
        calendar.getByRole("button", { name: "Previous month" }),
      ];
      for (const control of controls) {
        control.blur();
        await userEvent.hover(canvas.getByTestId("shipped-parking"));
        await settled(control);
        const rest = paintedBackground(control, scope);
        await userEvent.hover(control);
        await settled(control);
        const hovered = paintedBackground(control, scope);
        expect(distance(hovered, rest), "Calendar hover changes fill without meaning selected").toBeGreaterThan(2);
        const point = topLevelPoint(control);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(control.matches(":active")).toBe(true);
          await settled(control);
          expect(distance(paintedBackground(control, scope), rest), "Calendar held press is stronger than hover").toBeGreaterThan(distance(hovered, rest) + 1);
          if (control.getAttribute("aria-selected") === "true") expect(paint(control, "color")).toBe(role(control, "on-accent"));
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
        }
      }
      await expect(calendar.getByRole("heading", { name: "December 2025" })).toBeVisible();
    }
  },
};

export const SwatchPaintAndFocus: Story = {
  render: () => <ShippedControlsProbe kind="colors" />,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} shipped controls` });
      const canvas = within(scope);
      const disabled = canvas.getByRole("button", { name: `${theme} disabled paint 1` });
      await expect(disabled).toBeDisabled();
      expect(effectiveOpacity(disabled, scope)).toBeLessThan(1);
      for (const [index, value] of ["#2563eb", "#c2410c"].entries()) {
        const control = canvas.getByRole("button", { name: `${theme} data paint ${index + 1}` });
        await userEvent.hover(canvas.getByTestId("shipped-parking"));
        const resting = control.getBoundingClientRect();
        const radius = getComputedStyle(control).borderRadius;
        expect(paint(control)).toBe(color(value));
        await keyboardFocus(control);
        expectInsideEdge(control);
        expect(paint(control), "Focus must not recolor chosen data paint to accent").toBe(color(value));
        expect(control.getBoundingClientRect().width).toBe(resting.width);
        expect(control.getBoundingClientRect().height).toBe(resting.height);
        expect(getComputedStyle(control).borderRadius).toBe(radius);
        await userEvent.hover(control);
        await settled(control);
        expect(paint(control), "Hover retains color identity").toBe(color(value));
        const point = topLevelPoint(control);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(control.matches(":active")).toBe(true);
          await settled(control);
          expect(paint(control), "Held press retains color identity").toBe(color(value));
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
        }
        const dialog = await within(document.body).findByRole("dialog", { name: `${theme} data paint ${index + 1} picker` });
        await expect(dialog).toBeVisible();
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(control).toHaveFocus());
        await expect(dialog).not.toBeInTheDocument();
        expect(paint(control)).toBe(color(value));
      }
    }
  },
};

function nativeFocusPaint(control: HTMLElement): string {
  const style = getComputedStyle(control);
  return [style.outlineStyle, style.outlineWidth, style.outlineColor, style.outlineOffset, style.boxShadow, style.borderColor, style.borderWidth].join("|");
}

function expectAttachedNativeFocus(control: HTMLElement, restingPaint: string) {
  const style = getComputedStyle(control);
  const resting = restingPaint.split("|");
  expect(control.matches(":focus-visible")).toBe(true);
  expect(nativeFocusPaint(control), "Native editor focus must add a visible cue").not.toBe(restingPaint);
  const outlined = style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0 && rgba(style.outlineColor)[3]! > 0
    && [style.outlineStyle, style.outlineWidth, style.outlineColor, style.outlineOffset].some((value, index) => value !== resting[index]);
  if (outlined) expect(Number.parseFloat(style.outlineOffset), "Native outline must have no floating gap").toBeLessThanOrEqual(0);
  let shadowed = false;
  for (const shadow of shadows(style)) {
    const ink = shadow.match(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/)?.[0];
    if (!ink || rgba(ink)[3] === 0) continue;
    const lengths = shadowLengths(shadow);
    if (!lengths.some((length) => length !== 0)) continue;
    if (!shadow.includes("inset")) {
      expect(lengths.slice(0, 3), "Native focus shadow stays attached, without an offset or blur gap").toEqual([0, 0, 0]);
      expect(lengths[3], "Native contiguous focus edge does not float outside an offset band").toBeLessThanOrEqual(2);
    }
    shadowed = style.boxShadow !== resting[4];
  }
  const bordered = Number.parseFloat(style.borderWidth) > 0 && rgba(style.borderColor)[3]! > 0
    && (style.borderColor !== resting[5] || style.borderWidth !== resting[6]);
  expect(outlined || shadowed || bordered, "Native focus must paint, not merely retain a transparent forced-colors fallback").toBe(true);
}

export const NativeColorEditorFocus: Story = {
  render: () => <ShippedControlsProbe kind="colors" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} shipped controls` });
      const canvas = within(scope);
      const well = canvas.getByLabelText(`${theme} channel editor color well`);
      const preview = canvas.getByRole("img", { name: `${theme} channel editor preview` });
      const channels = [
        [well, "#c2410c"],
        [canvas.getByRole("slider", { name: `${theme} channel editor Red channel` }), "194"],
        [canvas.getByRole("slider", { name: `${theme} channel editor Green channel` }), "65"],
        [canvas.getByRole("slider", { name: `${theme} channel editor Blue channel` }), "12"],
      ] as const;
      for (const [control, value] of channels) {
        control.blur();
        const restingPaint = nativeFocusPaint(control);
        await keyboardFocus(control);
        expectAttachedNativeFocus(control, restingPaint);
        await expect(control).toHaveValue(value);
        await expect(well).toHaveValue("#c2410c");
        expect(paint(preview)).toBe(color("#c2410c"));
      }
      const blue = canvas.getByRole("slider", { name: `${theme} channel editor Blue channel` });
      await expect(blue).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(blue).toHaveValue("13");
      await expect(well).toHaveValue("#c2410d");
      await expect(canvas.getByRole("textbox", { name: `${theme} channel editor hex value` })).toHaveValue("#c2410d");
    }
  },
};

function PublicComposerProbe({ theme }: { theme: Theme }) {
  const [value, setValue] = useState("Draft message");
  const [sent, setSent] = useState("");
  const id = `${theme}-public-composer`;
  return (
    <section data-theme={theme} aria-label={`${theme} public composer`} className="grid w-[390px] max-w-full gap-4 bg-ui-background p-4 text-sm text-ui-foreground">
      <button type="button" data-testid="composer-parking">Interaction start</button>
      <label htmlFor={id}>Composer message</label>
      <ComposerFrame
        running={false}
        onSubmit={() => setSent(value)}
        context={<p>New chat</p>}
        controls={<span>Model ready</span>}
        actions={<ComposerSubmitButton running={false} hasText={value.length > 0} canSend={value.trim().length > 0} canStop={false} onStop={() => setSent("Stopped")} />}
      >
        <ComposerInput id={id} value={value} onValueChange={setValue} onSubmit={setSent} commands={[]} skills={[]} />
      </ComposerFrame>
      <p role="status">Sent: {sent || "nothing yet"}</p>
    </section>
  );
}

export const PublicComposerField: Story = {
  render: () => <>{themes.map((theme) => <PublicComposerProbe key={theme} theme={theme} />)}</>,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} public composer` });
      const canvas = within(scope);
      const input = canvas.getByRole("textbox", { name: "Composer message" });
      const surface = rgba(getComputedStyle(scope).getPropertyValue("--color-ui-surface"));
      await userEvent.hover(canvas.getByTestId("composer-parking"));
      await keyboardFocus(input);
      expect(getComputedStyle(input).borderBottomWidth).toBe("2px");
      expectNoOutsideRing(input);
      expectTint(input, scope, 8, surface);
      expect(contrast(rgba(getComputedStyle(input).borderBottomColor), paintedBackground(input, scope))).toBeGreaterThanOrEqual(3);
      await expect(input).toHaveValue("Draft message");
      input.blur();
      await settled(input);
      const rest = paintedBackground(input, scope);
      await userEvent.hover(input);
      await settled(input);
      const hovered = paintedBackground(input, scope);
      expectTint(input, scope, 6, surface);
      expect(distance(hovered, rest)).toBeGreaterThan(2);
      const point = topLevelPoint(input);
      await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
      try {
        expect(input.matches(":active")).toBe(true);
        await settled(input);
        expectTint(input, scope, 12, surface);
        expect(distance(paintedBackground(input, scope), rest)).toBeGreaterThan(distance(hovered, rest) + 1);
      } finally {
        await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
      }
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("status")).toHaveTextContent("Sent: Draft message");
    }
  },
};

function ReasoningFocusProbe({ theme }: { theme: Theme }) {
  const [value, setValue] = useState("medium");
  return (
    <section data-theme={theme} aria-label={`${theme} reasoning focus`} className="grid w-[390px] max-w-full gap-4 bg-ui-background p-4 text-sm text-ui-foreground">
      <button type="button" data-testid="reasoning-parking">Interaction start</button>
      <ReasoningSlider value={value} values={["low", "medium", "high"]} onChange={setValue} />
      <p role="status">Committed: {value}</p>
    </section>
  );
}

export const ReasoningThumbFocus: Story = {
  render: () => <>{themes.map((theme) => <ReasoningFocusProbe key={theme} theme={theme} />)}</>,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    await session.send("DOM.getDocument", { depth: -1, pierce: true });
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} reasoning focus` });
      const canvas = within(scope);
      const control = canvas.getByRole("slider", { name: "Reasoning level" });
      await userEvent.hover(canvas.getByTestId("reasoning-parking"));
      control.scrollIntoView({ block: "center" });
      await keyboardFocus(control);
      await expect(control).toHaveValue("1");
      await expect(control).toHaveAttribute("aria-valuetext", "Medium");
      // Chromium hides range thumbs in a user-agent shadow tree. Read the real
      // painted thumb through CDP, not a source selector or unreliable pseudo CSSOM.
      const point = topLevelPoint(control);
      const location: unknown = await session.send("DOM.getNodeForLocation", { x: Math.round(point.x), y: Math.round(point.y), includeUserAgentShadowDOM: true });
      if (!location || typeof location !== "object" || !("nodeId" in location) || typeof location.nodeId !== "number") throw new Error("Native thumb hit-testing returned no DOM node");
      const described: unknown = await session.send("DOM.describeNode", { nodeId: location.nodeId });
      if (!described || typeof described !== "object" || !("node" in described) || !described.node || typeof described.node !== "object" || !("attributes" in described.node) || !Array.isArray(described.node.attributes)) throw new Error("Native thumb hit-testing returned no element attributes");
      expect(described.node.attributes, "Hit the actual Chromium thumb, not the range host or track").toContain("thumb");
      const response: unknown = await session.send("CSS.getComputedStyleForNode", { nodeId: location.nodeId });
      if (!response || typeof response !== "object" || !("computedStyle" in response) || !Array.isArray(response.computedStyle)) throw new Error("Native thumb computed paint is unavailable");
      const style = new Map<string, string>();
      for (const entry of response.computedStyle) {
        if (entry && typeof entry === "object" && "name" in entry && typeof entry.name === "string" && "value" in entry && typeof entry.value === "string") style.set(entry.name, entry.value);
      }
      const fill = color(style.get("background-color") ?? "transparent");
      const boxShadow = style.get("box-shadow") ?? "none";
      const paintedShadows = (boxShadow === "none" ? [] : boxShadow.split(/,(?![^()]*\))/)).flatMap((shadow) => {
        const ink = shadow.match(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/)?.[0];
        return ink && rgba(ink)[3]! > 0 ? [{ shadow, ink: color(ink), lengths: shadowLengths(shadow) }] : [];
      });
      for (const [index, shadow] of paintedShadows.entries()) {
        if (shadow.shadow.includes("inset")) continue;
        const hasOuterBand = paintedShadows.slice(index + 1).some((outer) => !outer.shadow.includes("inset") && (outer.lengths[3] ?? 0) > (shadow.lengths[3] ?? 0));
        expect(shadow.ink === fill && (shadow.lengths[3] ?? 0) > 0 && hasOuterBand, "A surface-colored inner band must not float the focus ring away from the thumb").toBe(false);
      }
      const border = rgba(style.get("border-top-color") ?? "transparent");
      const visibleBorder = Number.parseFloat(style.get("border-top-width") ?? "0") > 0 && border[3]! > 0 && contrast(border, fill.split(",").map(Number)) >= 3;
      const visibleShadow = paintedShadows.some((shadow) => contrast(shadow.ink.split(",").map(Number), fill.split(",").map(Number)) >= 3);
      expect(visibleBorder || visibleShadow, "Native thumb focus keeps a visible attached cue").toBe(true);
      await userEvent.keyboard("{ArrowRight}");
      await expect(control).toHaveValue("2");
      await expect(control).toHaveAttribute("aria-valuetext", "High");
      await expect(canvas.getByRole("status")).toHaveTextContent("Committed: high");
      await expect(control).toHaveFocus();
    }
  },
};

const ShippedPaletteDanger = composeStory(dangerStory, paletteMeta);

function FilledDangerProbe({ theme, children }: { theme: Theme; children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <div ref={setContainer} data-theme={theme} data-testid={`${theme}-shipped-danger`} className="bg-ui-background p-4 text-sm text-ui-foreground">
      {container && <PortalProvider container={container}>{children}</PortalProvider>}
    </div>
  );
}

export const FilledDangerLight: Story = {
  render: ({ theme }) => <FilledDangerProbe theme={theme}><ShippedPaletteDanger /></FilledDangerProbe>,
  play: async ({ canvasElement, args }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    const scope = within(canvasElement).getByTestId(`${args.theme}-shipped-danger`);
    const canvas = within(scope);
    await userEvent.click(canvas.getByRole("button", { name: "Delete sample" }));
    const dialog = await canvas.findByRole("dialog", { name: "Delete this sample?" });
    const confirm = within(dialog).getByRole("button", { name: "Confirm deletion" });
    const description = within(dialog).getByText("This permanently removes the sample in this example.");
    await userEvent.hover(description);
    expect(paint(confirm)).toBe(role(confirm, "danger"));
    expect(paint(confirm, "color")).toBe(role(confirm, "on-danger"));
    expect(contrast(rgba(getComputedStyle(confirm).color), paintedBackground(confirm, scope))).toBeGreaterThanOrEqual(4.5);
    await keyboardFocus(confirm);
    expectInsideEdge(confirm, role(confirm, "on-danger"));
    expect(paint(confirm, "color")).toBe(role(confirm, "on-danger"));
    confirm.blur();
    await settled(confirm);
    const rest = paintedBackground(confirm, scope);
    await userEvent.hover(confirm);
    await settled(confirm);
    const hovered = paintedBackground(confirm, scope);
    expect(paint(confirm, "color")).toBe(role(confirm, "on-danger"));
    expect(contrast(rgba(getComputedStyle(confirm).color), hovered)).toBeGreaterThanOrEqual(4.5);
    expect(distance(hovered, rest)).toBeGreaterThan(2);
    const point = topLevelPoint(confirm);
    await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
    try {
      expect(confirm.matches(":active")).toBe(true);
      await settled(confirm);
      const pressed = paintedBackground(confirm, scope);
      expect(paint(confirm, "color")).toBe(role(confirm, "on-danger"));
      expect(contrast(rgba(getComputedStyle(confirm).color), pressed)).toBeGreaterThanOrEqual(4.5);
      expect(distance(pressed, rest)).toBeGreaterThan(distance(hovered, rest) + 1);
    } finally {
      await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
    }
    await expect(canvas.getByRole("status")).toHaveTextContent("Sample deleted.");
  },
};

export const FilledDangerDark: Story = {
  ...FilledDangerLight,
  args: { theme: "dark" },
};
