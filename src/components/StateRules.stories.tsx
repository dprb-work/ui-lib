import { composeStory, type Meta, type StoryObj } from "@storybook/react-vite";
import { Search, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import type { CDPSession, UserEvent } from "@vitest/browser/context";
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
import statesMeta, { SharedControls as sharedControlsStory } from "./States.stories";
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
      <Button>Primary control</Button>
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

function StateProbe({ theme, kind }: { theme: Theme; kind: "buttons" | "fields" | "invalid" | "invalid-no-message" | "availability" | "selection" | "composer" | "overrides" | "textarea" }) {
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
      {kind === "invalid-no-message" && <>
        <TextInput aria-label="Invalid Text" aria-invalid="true" defaultValue="Draft" />
        <NumberInput aria-label="Invalid Number" aria-invalid="true" defaultValue={2} />
        <TextareaInput aria-label="Invalid Textarea" aria-invalid="true" defaultValue="Draft notes" />
        <NativeSelect aria-label="Invalid Native select" aria-invalid="true" defaultValue="one"><option value="one">One</option></NativeSelect>
        <SelectInput label="Invalid Select" invalid defaultValue="one" options={options} />
      </>}
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

function selectedIndicatorBase(track: HTMLElement, trigger: HTMLElement, scope: HTMLElement) {
  const triggerRect = trigger.getBoundingClientRect();
  const centerX = triggerRect.left + triggerRect.width / 2;
  const centerY = triggerRect.top + triggerRect.height / 2;
  let background = paintedBackground(track, scope);
  let found = false;
  for (const child of Array.from(track.children)) {
    if (child === trigger || ["tab", "button"].includes(child.getAttribute("role") ?? "")) continue;
    const rect = child.getBoundingClientRect();
    const fill = rgba(getComputedStyle(child).backgroundColor);
    if (fill[3] === 0 || rect.height < triggerRect.height - 2 || centerX < rect.left || centerX > rect.right || centerY < rect.top || centerY > rect.bottom) continue;
    background = composite(fill, background);
    found = true;
  }
  expect(found, "Selected trigger is backed by a painted indicator").toBe(true);
  return background;
}

function expectTranslucentTrigger(trigger: HTMLElement, state: string) {
  const alpha = rgba(getComputedStyle(trigger).backgroundColor)[3]! / 255;
  expect(alpha, `${state} trigger fill remains translucent`).toBeLessThanOrEqual(0.25);
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

function expectInsideEdge(element: HTMLElement, expectedColor?: string, paintedFill?: number[]) {
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
  const background = paintedFill ?? paintedBackground(element, scope);
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
        expectInsideEdge(button, name === "Primary action" ? role(button, "on-accent") : undefined);
        if (name === "Danger action") expect(paint(button, "color")).toBe(role(button, "danger-ink"));
        if (name === "Selected action") {
          expectAccent(color(getComputedStyle(button).borderColor), button);
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
        expectNoOutsideRing(input);
        const descriptions = (input.getAttribute("aria-describedby") ?? "").split(/\s+/).map((id) => document.getElementById(id));
        expect(descriptions.some((description) => description?.textContent === errorWords)).toBe(true);
        for (const description of descriptions) if (description?.textContent === errorWords) await expect(description).toBeVisible();
      }
    }
  },
};

async function checkFieldGeometry(canvasElement: HTMLElement, width: number) {
  await browser(width);
  const scopeList = themes.map((theme) => within(canvasElement).getByRole("region", { name: `${theme} geometry fields` }));
  for (const scope of scopeList) {
    await within(scope).getByTestId("pointer-parking").focus();
    for (const name of fieldNames) {
      const input = field(scope, name);
      const rest = getComputedStyle(input);
      const restRadii = [rest.borderTopLeftRadius, rest.borderTopRightRadius, rest.borderBottomLeftRadius, rest.borderBottomRightRadius];
      expect(restRadii[0]).toBe(restRadii[1]);
      expect(Number.parseFloat(restRadii[0]!)).toBeGreaterThanOrEqual(4);
      expect([restRadii[2], restRadii[3]]).toEqual(["0px", "0px"]);
      expect(rest.fontSize, `${name} font size`).toBe("14px");
      expect(Number.parseFloat(rest.paddingBottom), `${name} line spacing`).toBeLessThanOrEqual(2);
      if (name !== "Textarea") {
        expect(input.getBoundingClientRect().height, `${name} border-box height`).toBe(28);
        const contentHeight = input.getBoundingClientRect().height
          - Number.parseFloat(rest.paddingTop) - Number.parseFloat(rest.paddingBottom)
          - Number.parseFloat(rest.borderTopWidth) - Number.parseFloat(rest.borderBottomWidth);
        expect(contentHeight, `${name} content box matches its line height`).toBe(Number.parseFloat(rest.lineHeight));
      }
      await keyboardFocus(input);
      const focused = getComputedStyle(input);
      expect([focused.borderTopLeftRadius, focused.borderTopRightRadius, focused.borderBottomLeftRadius, focused.borderBottomRightRadius]).toEqual(restRadii);
      expectNoOutsideRing(input);
      input.blur();
    }
    for (const [name, control] of [
      ["Native compact", within(scope).getByRole("combobox", { name: "Compact native select" })],
      ["Select compact", within(scope).getByRole("combobox", { name: "Compact select" })],
    ] as const) {
      expect(control.getBoundingClientRect().height, `${name} is no taller than standard`).toBeLessThanOrEqual(28);
    }
    for (const name of ["Default growing notes", "Subtle growing notes"]) {
      const textarea = within(scope).getByRole("textbox", { name });
      expect(getComputedStyle(textarea).resize).toBe("none");
      expect(Number.parseFloat(getComputedStyle(textarea).paddingBottom)).toBeLessThanOrEqual(2);
    }
  }
}

function GeometryFields({ theme }: { theme: Theme }) {
  return <section data-theme={theme} aria-label={`${theme} geometry fields`} className="grid w-full gap-2 bg-ui-background p-4 text-sm text-ui-foreground">
    <button type="button" data-testid="pointer-parking">Geometry start</button>
    <TextInput aria-label="Text" defaultValue="Draft" />
    <NumberInput aria-label="Number" defaultValue={2} />
    <TextareaInput aria-label="Textarea" defaultValue="Draft notes" />
    <NativeSelect aria-label="Native select" defaultValue="one"><option value="one">One</option></NativeSelect>
    <NativeSelect aria-label="Compact native select" density="compact" defaultValue="one"><option value="one">One</option></NativeSelect>
    <SelectInput label="Select" defaultValue="one" options={options} />
    <SelectInput label="Compact select" density="compact" defaultValue="one" options={options} />
    <TextareaInput aria-label="Default growing notes" defaultValue="Short note" />
    <TextareaInput aria-label="Subtle growing notes" appearance="subtle" defaultValue="Short note" />
  </section>;
}

export const FieldGeometry390: Story = {
  render: () => <>{themes.map((theme) => <GeometryFields key={theme} theme={theme} />)}</>,
  play: async ({ canvasElement }) => checkFieldGeometry(canvasElement, 390),
};

export const FieldGeometry1440: Story = {
  ...FieldGeometry390,
  play: async ({ canvasElement }) => checkFieldGeometry(canvasElement, 1440),
};

export const InvalidWithoutMessage: Story = {
  render: () => <BothThemes kind="invalid-no-message" />,
  play: async ({ canvasElement }) => {
    await browser();
    for (const scope of scopes(canvasElement)) {
      for (const name of fieldNames) {
        const input = field(scope, `Invalid ${name}`);
        await expect(input).toHaveAttribute("aria-invalid", "true");
        expect([role(input, "danger"), role(input, "danger-ink")]).toContain(paint(input, "borderBottomColor"));
        expect(within(scope).queryByText(errorWords)).not.toBeInTheDocument();
        await expect(input).not.toHaveAccessibleDescription();
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

// One story per theme: both themes in one play reach Vitest's 15s test limit.
export const PersistentSelectionLight: Story = {
  render: () => <BothThemes kind="selection" />,
  play: async ({ canvasElement, args }) => {
    const { userEvent } = await browser();
    for (const scope of scopes(canvasElement)) {
      if (scope.dataset.theme !== args.theme) continue;
      const canvas = within(scope);
      const toggle = canvas.getByRole("button", { name: "Toggle choice" });
      for (const control of [canvas.getByRole("button", { name: "Selected icon" }), canvas.getByRole("tab", { name: "Tab One" }), canvas.getByRole("button", { name: "Segment One" })]) {
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await keyboardFocus(control);
        expectPersistentSelectionInk(control);
        expectNoOutsideRing(control);
        await userEvent.hover(control);
        await settled(control);
        expectPersistentSelectionInk(control);
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await settled(control);
        expectPersistentSelectionInk(control);
      }
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await keyboardFocus(toggle);
      const toggleSize = toggle.getBoundingClientRect();
      expectAccent(color(getComputedStyle(toggle).borderColor), toggle);
      expectInsideEdge(toggle);
      await userEvent.hover(canvas.getByTestId("pointer-parking"));
      toggle.blur();
      await settled(toggle);
      const toggleOn = paintedBackground(toggle, scope);
      const primary = canvas.getByRole("button", { name: "Primary control" });
      expect(distance(toggleOn, paintedBackground(primary, scope))).toBeGreaterThan(20);
      expect(distance(toggleOn, role(toggle, "accent").split(",").map(Number))).toBeGreaterThan(20);
      expect(contrast(paint(toggle, "color").split(",").map(Number), toggleOn)).toBeGreaterThanOrEqual(4.5);
      await keyboardFocus(toggle);
      await userEvent.keyboard(" ");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await userEvent.hover(canvas.getByTestId("pointer-parking"));
      toggle.blur();
      await settled(toggle);
      const toggleOff = paintedBackground(toggle, scope);
      expect(distance(toggleOn, toggleOff)).toBeGreaterThan(20);
      expect(toggle.getBoundingClientRect().width).toBe(toggleSize.width);
      expect(toggle.getBoundingClientRect().height).toBe(toggleSize.height);
      await keyboardFocus(toggle);
      await userEvent.keyboard(" ");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await userEvent.hover(canvas.getByTestId("pointer-parking"));
      toggle.blur();
      await settled(toggle);
      expect(toggle.getBoundingClientRect().width).toBe(toggleSize.width);
      expect(toggle.getBoundingClientRect().height).toBe(toggleSize.height);

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
      expectSelectionInk(nextSegment);
      const segmentTrack = canvas.getByRole("group", { name: "State segments" });
      const segmentIndicator = Array.from(segmentTrack.children).find((child) => child.getAttribute("role") !== "button") as HTMLElement | undefined;
      expect(segmentIndicator).toBeDefined();
      expect(paint(segmentIndicator!)).toBe(role(nextSegment, "accent"));
      const selectedSegmentRect = nextSegment.getBoundingClientRect();
      const indicatorRect = segmentIndicator!.getBoundingClientRect();
      expect(Math.abs(indicatorRect.left - selectedSegmentRect.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(indicatorRect.width - selectedSegmentRect.width)).toBeLessThanOrEqual(0.5);

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

export const PersistentSelectionDark: Story = {
  ...PersistentSelectionLight,
  args: { theme: "dark" },
};

type ViewportRect = { left: number; top: number; width: number; height: number };

function topLevelRect(rect: ViewportRect): ViewportRect {
  let { left, top, width, height } = rect;
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
    left = frame.left + (left + leftBorder) * scaleX;
    top = frame.top + (top + topBorder) * scaleY;
    width *= scaleX;
    height *= scaleY;
    current = current.parent;
  }
  return { left, top, width, height };
}

function topLevelPoint(element: HTMLElement): { x: number; y: number } {
  const rect = topLevelRect(element.getBoundingClientRect());
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
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
            expect(contrast(paint(button, "color").split(",").map(Number), pressed), `${name} text remains readable on its pressed fill`).toBeGreaterThanOrEqual(4.5);
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
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
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

function expectTintOverBase(element: HTMLElement, percentage: number, base: number[]) {
  const scope = element.closest<HTMLElement>("[data-theme]");
  if (!scope) throw new Error("Selected fill must belong to a painted theme scope");
  const accent = rgba(getComputedStyle(scope).getPropertyValue("--color-ui-accent"));
  const expected = base.slice(0, 3).map((channel, index) => Math.round(channel * (1 - percentage / 100) + accent[index]! * percentage / 100)).concat(255);
  const actual = composite(rgba(getComputedStyle(element).backgroundColor), base);
  expect(distance(actual, expected), `${percentage}% accent tint over selected fill`).toBeLessThanOrEqual(2);
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
        const surfacePaint = role(control, "surface").split(",").map(Number);
        await userEvent.hover(control);
        await settled(control);
        expectTranslucentTrigger(control, "Unselected hover");
        const hovered = paintedBackground(control, scope);
        const selectedBeforeHover = control.getAttribute("aria-selected") === "true" || control.getAttribute("aria-pressed") === "true";
        const hoverBase = selectedBeforeHover ? selectedIndicatorBase(track, control, scope) : trackPaint;
        expectTint(control, scope, 8, hoverBase);
        expect(distance(hovered, trackPaint), "Unselected hover must be visible against the actual muted track").toBeGreaterThan(2);
        expect(contrast(hovered, trackPaint), "Track feedback stays faint").toBeLessThan(1.7);
        if (scope.dataset.theme === "dark") {
          expect(distance(hovered, surfacePaint), "Unselected hover remains distinguishable from the surface").toBeGreaterThan(distance(trackPaint, surfacePaint));
        }
        const point = topLevelPoint(control);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(control.matches(":active")).toBe(true);
          await settled(track);
          expectTranslucentTrigger(control, "Unselected press");
          // Native selection timing differs: Tabs select on pointer-down,
          // segments on release. The selected indicator becomes the painted base.
          const selectedWhilePressed = control.getAttribute("aria-selected") === "true" || control.getAttribute("aria-pressed") === "true";
          const pressBase = selectedWhilePressed ? selectedIndicatorBase(track, control, scope) : trackPaint;
          const pressed = composite(rgba(getComputedStyle(control).backgroundColor), pressBase);
          expect(distance(pressed, trackPaint), "Held press strengthens actual track feedback").toBeGreaterThan(distance(hovered, trackPaint) + 1);
          if (!selectedWhilePressed) expectTintOverBase(control, 16, pressBase);
          expectSelectionInk(within(tabList).getByRole("tab", { selected: true }));
          expectSelectionInk(within(segments).getByRole("button", { pressed: true }));
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
        }
        await settled(track);
        const selectedAfterRelease = control.getAttribute("aria-selected") === "true" || control.getAttribute("aria-pressed") === "true";
        const releasedBase = selectedAfterRelease ? selectedIndicatorBase(track, control, scope) : trackPaint;
        if (!selectedAfterRelease) expectTintOverBase(control, 8, releasedBase);
        expectSelectionInk(within(tabList).getByRole("tab", { selected: true }));
        expectSelectionInk(within(segments).getByRole("button", { pressed: true }));
        expect(selectedAfterRelease, "A real pointer click selects the trigger").toBe(true);
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await settled(track);
        const selectedBase = selectedIndicatorBase(track, control, scope);
        const restPaint = composite(rgba(getComputedStyle(control).backgroundColor), selectedBase);
        await userEvent.hover(control);
        await settled(track);
        expectTranslucentTrigger(control, "Selected hover");
        const hoveredPaint = composite(rgba(getComputedStyle(control).backgroundColor), selectedBase);
        expect(distance(hoveredPaint, restPaint), "Selected hover visibly changes paint over the actual indicator").toBeGreaterThan(2);
        expect(contrast(paint(control, "color").split(",").map(Number), hoveredPaint), "Selected hover text stays readable").toBeGreaterThanOrEqual(4.5);
        const selectedPoint = topLevelPoint(control);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...selectedPoint, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(control.matches(":active")).toBe(true);
          await settled(track);
          expectTranslucentTrigger(control, "Selected press");
          const pressedPaint = composite(rgba(getComputedStyle(control).backgroundColor), selectedBase);
          expect(distance(pressedPaint, restPaint), "Selected press strengthens selected hover").toBeGreaterThan(distance(hoveredPaint, restPaint) + 1);
          expect(contrast(paint(control, "color").split(",").map(Number), pressedPaint), "Selected press text stays readable").toBeGreaterThanOrEqual(4.5);
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...selectedPoint, button: "left", buttons: 0, clickCount: 1 });
        }
        await settled(track);
        if (track === segments) {
          await userEvent.hover(canvas.getByTestId("pointer-parking"));
          await settled(track);
          await keyboardFocus(control);
          expectInsideEdge(control, undefined, selectedIndicatorBase(track, control, scope));
        }
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
      // Read the knob from the screen, not from an element box: the off knob sits concentric with the
      // track's start end, so the pixel at that end's center is knob paint whatever element draws it.
      const knobPaint = async () => {
        const pixels = await paintedPixels(session, control, 0);
        const track = topLevelRect(control.getBoundingClientRect());
        const x = Math.floor((track.left + track.height / 2 - pixels.left) * pixels.scale);
        const y = Math.floor((track.top + track.height / 2 - pixels.top) * pixels.scale);
        const offset = (y * pixels.width + x) * 4;
        return Array.from(pixels.data.slice(offset, offset + 3)).concat(255);
      };
      await userEvent.hover(canvas.getByTestId("pointer-parking"));
      await expect(control).not.toBeChecked();
      // A screenshot only holds what the frame shows; the dark probe starts below the fold.
      control.scrollIntoView({ block: "nearest" });
      expect(control.matches(":hover"), "The pointer is parked away from the switch").toBe(false);
      await settled(control);
      const rest = paintedBackground(control, scope);
      const restKnob = await knobPaint();
      expect(distance(restKnob, rest), "The unchecked switch paints a visible knob on its track").toBeGreaterThan(15);
      const baselineContrast = contrast(rest, restKnob);
      await userEvent.hover(control);
      await settled(control);
      const hovered = paintedBackground(control, scope);
      expect(distance(hovered, rest)).toBeGreaterThan(2);
      expect(contrast(hovered, await knobPaint()), "Hover must not erase existing track/thumb separation").toBeGreaterThanOrEqual(baselineContrast);
      const point = topLevelPoint(control);
      await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
      try {
        expect(control.matches(":active")).toBe(true);
        await expect(control).not.toBeChecked();
        await settled(control);
        const pressed = paintedBackground(control, scope);
        expect(distance(pressed, rest)).toBeGreaterThan(distance(hovered, rest) + 1);
        expect(contrast(pressed, await knobPaint()), "Press must not erase existing track/thumb separation").toBeGreaterThanOrEqual(baselineContrast);
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

function expectTabsPresentation(scope: HTMLElement): number[] {
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
  expect(paint(inactive, "color")).toBe(role(inactive, "muted-foreground"));

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
  expect(selectedPaint.join(","), "Selected tab indicator uses accent fill").toBe(role(selected, "accent"));
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
  return selectedPaint;
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
    const initialFill = expectTabsPresentation(scope);
    await keyboardFocus(graph);
    expectInsideEdge(graph, undefined, initialFill);
    await userEvent.keyboard("{ArrowRight}");
    await expect(data).toHaveFocus();
    await expect(data).toHaveAttribute("aria-selected", "true");
    await expect(graph).toHaveAttribute("aria-selected", "false");
    await expect(canvas.getByRole("tabpanel", { name: "Data" })).toHaveTextContent("Data content");
    await settled(list);
    const dataFill = expectTabsPresentation(scope);
    expectInsideEdge(data, undefined, dataFill);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(graph).toHaveFocus();
    await expect(graph).toHaveAttribute("aria-selected", "true");
    await expect(data).toHaveAttribute("aria-selected", "false");
    await expect(canvas.getByRole("tabpanel", { name: "Graph" })).toHaveTextContent("Graph content");
    await settled(list);
    expectInsideEdge(graph, undefined, expectTabsPresentation(scope));
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
  expect(paint(control, "color")).toBe(role(control, "on-accent"));
  expect(contrast(paint(control, "color").split(",").map(Number), role(control, "accent").split(",").map(Number))).toBeGreaterThanOrEqual(4.5);
}

function expectPersistentSelectionInk(control: HTMLElement) {
  if (control.getAttribute("role") === "tab" || control.parentElement?.getAttribute("role") === "group") {
    expectSelectionInk(control);
    return;
  }
  const icon = control.querySelector("svg");
  expect(icon).not.toBeNull();
  expectAccent(paint(icon!, "color"), control);
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
      expect(canvas.queryByRole("img", { name: `${theme} channel editor preview` }), "The color well is the picker's only swatch, with no separate preview").toBeNull();
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
const pickerOptions = [{ value: "one", label: "One" }, { value: "two", label: "Two" }, { value: "three", label: "Three" }];
const corners = ["TopLeft", "TopRight", "BottomLeft", "BottomRight"] as const;
const colorFormats = [["hex", "Hex"], ["rgb", "RGB"], ["hsl", "HSL"], ["oklch", "OKLCH"]] as const;
type ColorFormat = (typeof colorFormats)[number][0];
const colorReferences: ReadonlyArray<Record<ColorFormat, string>> = [
  { hex: "#4c88c5", rgb: "76 136 197", hsl: "210 51% 54%", oklch: "0.613 0.112 250.5" },
  { hex: "#c2410c", rgb: "194 65 12", hsl: "17 88% 40%", oklch: "0.553 0.174 38.4" },
  { hex: "#123456", rgb: "18 52 86", hsl: "210 65% 20%", oklch: "0.319 0.072 251.2" },
  { hex: "#808080", rgb: "128 128 128", hsl: "0 0% 50%", oklch: "0.600 0.000 0" },
];
// Every onValueChange call, keyed by "<theme> <picker label>"; each play clears it before acting.
const colorChanges = new Map<string, string[]>();
const switchZooms = [1, 1.25, 1.5, 1.75, 2];
const switchOffsets = [0, 0.3, 0.5, 0.7];
// A host page large enough that Vitest does not scale the 1440px frame; scaling would resample the paint under test.
const unscaledHost = { width: 1700, height: 1000 };
// A solid red fill's red channel exceeds green and blue by about 100 in both themes; a tint or neutral stays far below 60.
const solidRedMargin = 60;

type RoundTwoKind = "inset" | "options" | "danger" | "color" | "switch";
const roundTwoRegions: Record<RoundTwoKind, string> = {
  inset: "field inset",
  options: "option lists",
  danger: "danger actions",
  color: "color picker",
  switch: "painted switches",
};

function InsetFields() {
  return <>
    <TextInput aria-label="Inset text" defaultValue="Draft" />
    <TextInput aria-label="Inset subtle text" appearance="subtle" defaultValue="Draft" />
    <NumberInput aria-label="Inset number" defaultValue={2} />
    <TextareaInput aria-label="Inset textarea" defaultValue="Draft notes" />
    <NativeSelect aria-label="Inset native select" defaultValue="one">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </NativeSelect>
    <NativeSelect aria-label="Inset compact native select" density="compact" defaultValue="one">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </NativeSelect>
    <SelectInput label="Inset select" defaultValue="one" options={options} />
    <SelectInput label="Inset compact select" density="compact" defaultValue="one" options={options} />
    <TextInput aria-label="Inset search" type="search" defaultValue="Draft" />
  </>;
}

function OptionLists({ theme }: { theme: Theme }) {
  return <form aria-label={`${theme} option form`} className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
    <NativeSelect aria-label="Native choice" name="native-choice" defaultValue="one">
      {pickerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </NativeSelect>
    <SelectInput label="Custom choice" defaultValue="one" options={pickerOptions} />
  </form>;
}

function DangerActions() {
  return <div className="flex items-center gap-4">
    <Button variant="danger">Delete draft</Button>
    <IconButton variant="danger" size="large" label="Delete file" tooltip={false}><Trash2 aria-hidden="true" /></IconButton>
    {/* The press fill is an inline derived theme color with no runtime variable; this swatch paints it in the section's theme. */}
    <span aria-hidden="true" data-testid="danger-press-reference" className="size-4 bg-ui-danger-press-fill" />
  </div>;
}

function recordColor(key: string, value: string) {
  colorChanges.set(key, [...(colorChanges.get(key) ?? []), value]);
}

function ColorPickers({ theme }: { theme: Theme }) {
  const [value, setValue] = useState("#4c88c5");
  const [slots, setSlots] = useState(["#4c88c5", "#c2410c"]);
  return <>
    <div className="w-80 max-w-full">
      <ColorPicker label="Accent color" value={value} onValueChange={(next) => { recordColor(`${theme} Accent color`, next); setValue(next); }} />
    </div>
    <div className="flex flex-wrap gap-2">
      {colorReferences.map(({ hex }) => <Button key={hex} variant="secondary" onClick={() => setValue(hex)}>Use {hex}</Button>)}
    </div>
    <div className="w-80 max-w-full">
      <ColorPicker label="Locked color" value="#808080" disabled onValueChange={(next) => recordColor(`${theme} Locked color`, next)} />
    </div>
    <ColorSelector
      label="Series color"
      colors={slots}
      onValueChange={(index, next) => {
        recordColor(`${theme} Series color ${index + 1}`, next);
        setSlots((current) => current.map((entry, slot) => slot === index ? next : entry));
      }}
    />
  </>;
}

function PaintedSwitches() {
  // Chromium implements Windows display scaling as layout zoom; CSS zoom reproduces that snapping path.
  return <div className="flex flex-wrap items-start gap-3">
    {switchZooms.flatMap((zoom) => switchOffsets.map((offset) => (
      <div key={`${zoom}-${offset}`} style={{ zoom }}>
        <div className="flex gap-2" style={{ marginTop: `${offset}px` }}>
          <Switch label={`Zoom ${zoom} offset ${offset} on`} defaultChecked tooltip={false} />
          <Switch label={`Zoom ${zoom} offset ${offset} off`} tooltip={false} />
        </div>
      </div>
    )))}
  </div>;
}

function RoundTwoSection({ theme, kind }: { theme: Theme; kind: RoundTwoKind }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <section ref={setContainer} data-theme={theme} aria-label={`${theme} ${roundTwoRegions[kind]}`} className="grid w-full gap-4 bg-ui-background p-4 text-sm text-ui-foreground">
      <button type="button" data-testid="pointer-parking" className="justify-self-start">Interaction start</button>
      {container && <PortalProvider container={container}>
        {kind === "inset" && <InsetFields />}
        {kind === "options" && <OptionLists theme={theme} />}
        {kind === "danger" && <DangerActions />}
        {kind === "color" && <ColorPickers theme={theme} />}
        {kind === "switch" && <PaintedSwitches />}
      </PortalProvider>}
    </section>
  );
}

function RoundTwoThemes({ kind }: { kind: RoundTwoKind }) {
  return <>{themes.map((theme) => <RoundTwoSection key={theme} theme={theme} kind={kind} />)}</>;
}

function roundTwoScopes(canvasElement: HTMLElement, kind: RoundTwoKind): HTMLElement[] {
  return themes.map((theme) => within(canvasElement).getByRole("region", { name: `${theme} ${roundTwoRegions[kind]}` }));
}

function textRect(container: Element, text: string): DOMRect | undefined {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent?.trim() !== text) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0) return rect;
  }
  return undefined;
}

function verticalCenter(rect: DOMRect): number {
  return rect.top + rect.height / 2;
}

function length(value: string): number {
  return Number.parseFloat(value) || 0;
}

function greenLean(paint: number[]): number {
  return paint[1]! - (paint[0]! + paint[2]!) / 2;
}

function expectCalmHighlight(fill: number[], surface: number[], label: string) {
  // The accent is Green; a neutral highlight keeps the surface's green lean instead of tinting toward it.
  expect(Math.abs(greenLean(fill) - greenLean(surface)), `${label} is neutral, not accent-tinted`).toBeLessThanOrEqual(1.5);
  expect(distance(fill, surface), `${label} is visible on the popup surface`).toBeGreaterThanOrEqual(15);
}

const insetFields = [
  ["textbox", "Inset text", 8],
  ["textbox", "Inset subtle text", 8],
  ["spinbutton", "Inset number", 8],
  ["textbox", "Inset textarea", 8],
  ["combobox", "Inset native select", 8],
  ["combobox", "Inset compact native select", 4],
] as const;

async function checkFieldInset(canvasElement: HTMLElement, width: number) {
  await browser(width);
  for (const scope of roundTwoScopes(canvasElement, "inset")) {
    const canvas = within(scope);
    for (const [kind, name, inset] of insetFields) {
      const style = getComputedStyle(await canvas.findByRole(kind, { name }));
      expect(length(style.borderLeftWidth) + length(style.paddingLeft), `${name} text starts ${inset}px from its left edge`).toBe(inset);
    }
    for (const [name, inset] of [["Inset select", 8], ["Inset compact select", 4]] as const) {
      const trigger = canvas.getByRole("combobox", { name });
      const text = textRect(trigger, "One");
      expect(text, `${name} shows its selected value`).toBeDefined();
      expect(Math.abs(text!.left - trigger.getBoundingClientRect().left - inset), `${name} selected value starts ${inset}px from its left edge`).toBeLessThanOrEqual(0.5);
    }
    const search = canvas.getByRole("searchbox", { name: "Inset search" });
    const searchRect = search.getBoundingClientRect();
    // Find the magnifier by geometry: the graphic painted inside the field box.
    const icon = Array.from(scope.querySelectorAll("svg")).map((graphic) => graphic.getBoundingClientRect()).find((rect) => rect.width > 0
      && rect.left >= searchRect.left && rect.right <= searchRect.right && rect.top >= searchRect.top && rect.bottom <= searchRect.bottom);
    expect(icon, "Search field shows its magnifier inside the field").toBeDefined();
    expect(Math.abs(icon!.left - searchRect.left - 8), "Search magnifier starts 8px from the field's left edge").toBeLessThanOrEqual(0.5);
    const searchStyle = getComputedStyle(search);
    const textStart = searchRect.left + length(searchStyle.borderLeftWidth) + length(searchStyle.paddingLeft);
    expect(textStart - icon!.right, "Search text starts at least 6px after the magnifier").toBeGreaterThanOrEqual(6);
    for (const control of [
      canvas.getByRole("textbox", { name: "Inset text" }),
      canvas.getByRole("textbox", { name: "Inset subtle text" }),
      canvas.getByRole("spinbutton", { name: "Inset number" }),
      canvas.getByRole("combobox", { name: "Inset native select" }),
      canvas.getByRole("combobox", { name: "Inset select" }),
      search,
    ]) {
      expect(control.getBoundingClientRect().height, `${control.getAttribute("aria-label")} keeps its 28px field height`).toBe(28);
    }
  }
}

export const FieldTextInset390: Story = {
  render: () => <RoundTwoThemes kind="inset" />,
  play: async ({ canvasElement }) => checkFieldInset(canvasElement, 390),
};

export const FieldTextInset1440: Story = {
  ...FieldTextInset390,
  play: async ({ canvasElement }) => checkFieldInset(canvasElement, 1440),
};

async function openCustomList(userEvent: UserEvent, trigger: HTMLElement, scope: HTMLElement): Promise<HTMLElement> {
  await userEvent.click(trigger);
  return within(scope).findByRole("listbox");
}

async function closeCustomList(userEvent: UserEvent, scope: HTMLElement) {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(within(scope).queryByRole("listbox")).not.toBeInTheDocument());
}

async function openNativePicker(userEvent: UserEvent, select: HTMLSelectElement) {
  await userEvent.click(select);
  await waitFor(() => {
    for (const option of Array.from(select.options)) {
      expect(option.getBoundingClientRect().height, "Opening the native select shows its options in the page").toBeGreaterThan(0);
    }
  });
}

async function closeNativePicker(userEvent: UserEvent, select: HTMLSelectElement) {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(select.matches(":open"), "Escape closes the native picker").toBe(false));
}

function nativePickerBox(select: HTMLSelectElement) {
  // The picker is a user-agent part with no DOM box: its border box is the options' margin boxes plus its own padding and border.
  const picker = getComputedStyle(select, "::picker(select)");
  const boxes = Array.from(select.options).map((option) => {
    const rect = option.getBoundingClientRect();
    const style = getComputedStyle(option);
    return { left: rect.left - length(style.marginLeft), right: rect.right + length(style.marginRight), top: rect.top - length(style.marginTop), bottom: rect.bottom + length(style.marginBottom) };
  });
  return {
    left: Math.min(...boxes.map((box) => box.left)) - length(picker.paddingLeft) - length(picker.borderLeftWidth),
    right: Math.max(...boxes.map((box) => box.right)) + length(picker.paddingRight) + length(picker.borderRightWidth),
    top: Math.min(...boxes.map((box) => box.top)) - length(picker.paddingTop) - length(picker.borderTopWidth),
    bottom: Math.max(...boxes.map((box) => box.bottom)) + length(picker.paddingBottom) + length(picker.borderBottomWidth),
  };
}

function expectOptionsInset(optionElements: HTMLElement[], box: { left: number; right: number; top: number; bottom: number }, list: string) {
  for (const [index, option] of optionElements.entries()) {
    const rect = option.getBoundingClientRect();
    expect(rect.left - box.left, `${list} option sits at least 4px inside the list's left edge`).toBeGreaterThanOrEqual(4);
    expect(box.right - rect.right, `${list} option sits at least 4px inside the list's right edge`).toBeGreaterThanOrEqual(4);
    if (index === 0) expect(rect.top - box.top, `${list} first option sits at least 4px below the list's top edge`).toBeGreaterThanOrEqual(4);
    if (index === optionElements.length - 1) expect(box.bottom - rect.bottom, `${list} last option sits at least 4px above the list's bottom edge`).toBeGreaterThanOrEqual(4);
    const style = getComputedStyle(option);
    for (const corner of corners) {
      expect(length(style[`border${corner}Radius`]), `${list} option ${corner} corner is rounded at least 6px`).toBeGreaterThanOrEqual(6);
    }
  }
}

async function nativeHoverFill(userEvent: UserEvent, select: HTMLSelectElement, value: string) {
  const option = Array.from(select.options).find((entry) => entry.value === value)!;
  await userEvent.hover(option);
  await settled(option);
  const surface = rgba(getComputedStyle(select, "::picker(select)").backgroundColor);
  return { option, surface, fill: composite(rgba(getComputedStyle(option).backgroundColor), surface) };
}

async function checkNativePicker(canvasElement: HTMLElement, width: number) {
  const { userEvent } = await browser(width);
  expect(CSS.supports("appearance", "base-select"), "The test browser supports the customizable select picker").toBe(true);
  for (const scope of roundTwoScopes(canvasElement, "options")) {
    const canvas = within(scope);
    const select = await canvas.findByRole("combobox", { name: "Native choice" }) as HTMLSelectElement;
    expect(select.tagName, "Native choice stays a native select").toBe("SELECT");
    const customList = await openCustomList(userEvent, canvas.getByRole("combobox", { name: "Custom choice" }), scope);
    const customStyle = getComputedStyle(within(customList).getAllByRole("option")[0]!);
    const customRadii = corners.map((corner) => customStyle[`border${corner}Radius`]);
    await closeCustomList(userEvent, scope);

    await userEvent.hover(canvas.getByTestId("pointer-parking"));
    await openNativePicker(userEvent, select);
    const optionElements = Array.from(select.options);
    expect(color(getComputedStyle(select, "::picker(select)").backgroundColor), "Native picker paints the surface role").toBe(role(select, "surface"));
    for (const option of optionElements) {
      expect(paint(option, "color"), "Native picker text uses the surface-foreground role").toBe(role(select, "surface-foreground"));
      const style = getComputedStyle(option);
      expect(corners.map((corner) => style[`border${corner}Radius`]), "Native option radius matches the custom option radius").toEqual(customRadii);
    }
    expectOptionsInset(optionElements, nativePickerBox(select), "Native picker");

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(select).toHaveValue("two"));
    await waitFor(() => expect(select.matches(":open"), "Enter closes the native picker").toBe(false));
    await expect(select).toHaveFocus();
    expect(new FormData(select.form!).get("native-choice"), "The chosen option is the form value").toBe("two");

    await userEvent.hover(canvas.getByTestId("pointer-parking"));
    await openNativePicker(userEvent, select);
    const { option, surface, fill } = await nativeHoverFill(userEvent, select, "three");
    expectCalmHighlight(fill, surface, "Hovered native option");
    expect(contrast(rgba(getComputedStyle(option).color), fill), "Hovered native option text reaches 4.5:1").toBeGreaterThanOrEqual(4.5);
    await closeNativePicker(userEvent, select);
  }
}

export const NativeSelectPicker390: Story = {
  render: () => <RoundTwoThemes kind="options" />,
  play: async ({ canvasElement }) => checkNativePicker(canvasElement, 390),
};

export const NativeSelectPicker1440: Story = {
  ...NativeSelectPicker390,
  play: async ({ canvasElement }) => checkNativePicker(canvasElement, 1440),
};

async function checkCustomOptionList(canvasElement: HTMLElement, width: number) {
  const { cdp, userEvent } = await browser(width);
  const session = cdp();
  for (const scope of roundTwoScopes(canvasElement, "options")) {
    const canvas = within(scope);
    const trigger = await canvas.findByRole("combobox", { name: "Custom choice" });
    await userEvent.hover(canvas.getByTestId("pointer-parking"));
    const listbox = await openCustomList(userEvent, trigger, scope);
    const surface = paintedBackground(listbox, scope);
    expectOptionsInset(within(listbox).getAllByRole("option"), listbox.getBoundingClientRect(), "Custom list");
    const target = within(listbox).getByRole("option", { name: "Three" });
    await userEvent.hover(target);
    await settled(target);
    const hovered = composite(rgba(getComputedStyle(target).backgroundColor), surface);
    expectCalmHighlight(hovered, surface, "Hovered custom option");
    expect(contrast(rgba(getComputedStyle(target).color), hovered), "Hovered custom option text reaches 4.5:1").toBeGreaterThanOrEqual(4.5);
    const point = topLevelPoint(target);
    await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
    try {
      expect(target.matches(":active"), "Real pointer-down must reach CSS :active").toBe(true);
      await settled(target);
      const pressed = composite(rgba(getComputedStyle(target).backgroundColor), surface);
      expectCalmHighlight(pressed, surface, "Pressed custom option");
      expect(distance(pressed, surface), "Held custom option press is stronger than hover").toBeGreaterThan(distance(hovered, surface) + 1);
    } finally {
      await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
    }
    await waitFor(() => expect(within(scope).queryByRole("listbox")).not.toBeInTheDocument());
    await expect(trigger).toHaveTextContent("Three");

    const select = canvas.getByRole("combobox", { name: "Native choice" }) as HTMLSelectElement;
    await userEvent.hover(canvas.getByTestId("pointer-parking"));
    await openNativePicker(userEvent, select);
    const native = await nativeHoverFill(userEvent, select, "three");
    expect(distance(native.fill, hovered), "Native and custom option lists paint the same hover highlight").toBeLessThanOrEqual(2);
    await closeNativePicker(userEvent, select);
  }
}

export const SelectOptionList390: Story = {
  render: () => <RoundTwoThemes kind="options" />,
  play: async ({ canvasElement }) => checkCustomOptionList(canvasElement, 390),
};

export const SelectOptionList1440: Story = {
  ...SelectOptionList390,
  play: async ({ canvasElement }) => checkCustomOptionList(canvasElement, 1440),
};

export const DangerOutlineToSolid: Story = {
  render: () => <RoundTwoThemes kind="danger" />,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const scope of roundTwoScopes(canvasElement, "danger")) {
      const canvas = within(scope);
      for (const name of ["Delete draft", "Delete file"]) {
        const button = await canvas.findByRole("button", { name });
        const ink = name === "Delete file" ? button.querySelector("svg") : button;
        expect(ink, `${name} paints its ink`).not.toBeNull();
        button.blur();
        await userEvent.hover(canvas.getByTestId("pointer-parking"));
        await settled(button);
        const rest = paintedBackground(button, scope);
        expect(rest, `${name} rest has no fill of its own`).toEqual(paintedBackground(button.parentElement!, scope));
        expect(color(getComputedStyle(button).borderTopColor), `${name} rest border uses the danger-ink role`).toBe(role(button, "danger-ink"));
        expect(paint(ink!, "color"), `${name} rest ink uses the danger-ink role`).toBe(role(button, "danger-ink"));

        await userEvent.hover(button);
        await settled(button);
        const hovered = paintedBackground(button, scope);
        expect(hovered.join(","), `${name} hover fills with the solid danger-hover role`).toBe(role(button, "danger-hover"));
        expect(paint(ink!, "color"), `${name} hover ink uses the on-danger role`).toBe(role(button, "on-danger"));
        const edge = getComputedStyle(button).borderTopColor;
        expect(color(edge) === role(button, "danger") || distance(composite(rgba(edge), hovered), hovered) <= 2, `${name} hover border is the danger role or invisible on the fill`).toBe(true);
        expect(contrast(rgba(getComputedStyle(ink!).color), hovered), `${name} hover ink reaches 4.5:1`).toBeGreaterThanOrEqual(4.5);

        const point = topLevelPoint(button);
        await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
        try {
          expect(button.matches(":active"), "Real pointer-down must reach CSS :active").toBe(true);
          await settled(button);
          const pressed = paintedBackground(button, scope);
          expect(pressed, `${name} press fills with the danger-press-fill paint`).toEqual(paintedBackground(canvas.getByTestId("danger-press-reference"), scope));
          expect(rgba(getComputedStyle(button).backgroundColor)[3], `${name} press fill is solid`).toBe(255);
          expect(pressed[0]! - Math.max(pressed[1]!, pressed[2]!), `${name} press fill stays red`).toBeGreaterThan(solidRedMargin);
          expect(paint(ink!, "color"), `${name} press ink uses the on-danger role`).toBe(role(button, "on-danger"));
          expect(contrast(rgba(getComputedStyle(ink!).color), pressed), `${name} press ink reaches 4.5:1`).toBeGreaterThanOrEqual(4.5);
          expect(distance(pressed, rest), `${name} press is stronger than hover`).toBeGreaterThan(distance(hovered, rest) + 1);
          expect(distance(pressed, hovered), `${name} press stays distinguishable from hover`).toBeGreaterThan(2);
        } finally {
          await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
        }
      }
    }
  },
};

function colorChangesOf(key: string): string[] {
  return colorChanges.get(key) ?? [];
}

function formatChooser(group: HTMLElement, label: string): HTMLSelectElement {
  const chooser = within(group).queryByRole("combobox", { name: `${label} format` });
  expect(chooser, `${label} has a format chooser`).not.toBeNull();
  return chooser as HTMLSelectElement;
}

function valueField(group: HTMLElement, label: string, format: ColorFormat): HTMLInputElement {
  const field = within(group).queryByRole("textbox", { name: `${label} ${format} value` });
  expect(field, `${label} has a ${format} value field`).not.toBeNull();
  return field as HTMLInputElement;
}

function channels(hex: string): number[] {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
}

async function expectPickerStructure(group: HTMLElement, label: string, value: string) {
  const picker = within(group);
  const name = textRect(group, label);
  expect(name, `${label} shows its visible name`).toBeDefined();
  const field = valueField(group, label, "hex");
  const fieldRect = field.getBoundingClientRect();
  expect(fieldRect.left, `${label} value field sits right of the visible name`).toBeGreaterThanOrEqual(name!.right);
  expect(Math.abs(verticalCenter(fieldRect) - verticalCenter(name!)), `${label} value field shares the visible name's line`).toBeLessThanOrEqual(2);
  const chooser = formatChooser(group, label);
  const chooserRect = chooser.getBoundingClientRect();
  expect(Math.abs(verticalCenter(chooserRect) - verticalCenter(name!)), `${label} format chooser shares the visible name's line`).toBeLessThanOrEqual(2);
  expect(chooser.tagName, `${label} format chooser is a native select`).toBe("SELECT");
  expect(Array.from(chooser.options).map((option) => [option.value, option.text]), `${label} offers Hex, RGB, HSL and OKLCH`).toEqual(colorFormats.map(([format, text]) => [format, text]));
  await expect(chooser).toHaveValue("hex");
  expect(picker.getAllByRole("textbox"), `${label} has exactly one text field`).toHaveLength(1);

  const well = picker.getByLabelText(`${label} color well`);
  await expect(well).toHaveAttribute("type", "color");
  await expect(well).toHaveValue(value);
  for (const element of [group, ...Array.from(group.querySelectorAll<HTMLElement>("*"))]) {
    if (element === well) continue;
    expect(paint(element), `${label}: only the color well paints the chosen color`).not.toBe(color(value));
  }
  const groupStyle = getComputedStyle(group);
  const contentWidth = group.clientWidth - length(groupStyle.paddingLeft) - length(groupStyle.paddingRight);
  const wellRect = well.getBoundingClientRect();
  expect(wellRect.width, `${label} swatch spans at least 90% of the picker width`).toBeGreaterThanOrEqual(contentWidth * 0.9);
  expect(wellRect.height, `${label} swatch is at least 32px tall`).toBeGreaterThanOrEqual(32);
  expect(document.elementFromPoint(wellRect.left + wellRect.width / 2, wellRect.top + wellRect.height / 2), `${label}: clicking the swatch reaches the native color input`).toBe(well);
  const walker = document.createTreeWalker(group, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    expect(node.textContent?.toLowerCase().includes(value), `${label} shows its hex value only in the field`).toBe(false);
  }
  for (const channel of ["Red", "Green", "Blue"]) {
    await expect(picker.getByRole("slider", { name: `${label} ${channel} channel` })).toBeEnabled();
  }
  return { firstLineTop: Math.min(name!.top, chooserRect.top, fieldRect.top), firstLine: [name!, chooserRect, fieldRect] };
}

async function checkColorPickerLayout(canvasElement: HTMLElement, width: number) {
  const { userEvent } = await browser(width);
  for (const scope of roundTwoScopes(canvasElement, "color")) {
    const canvas = within(scope);
    await expectPickerStructure(await canvas.findByRole("group", { name: "Accent color" }), "Accent color", "#4c88c5");

    const slot = canvas.getByRole("button", { name: "Series color 1" });
    slot.scrollIntoView({ block: "center" });
    await userEvent.click(slot);
    const dialog = await within(scope).findByRole("dialog", { name: "Series color 1 picker" });
    const { firstLineTop, firstLine } = await expectPickerStructure(within(dialog).getByRole("group", { name: "Series color 1" }), "Series color 1", "#4c88c5");
    const dialogRect = dialog.getBoundingClientRect();
    expect(firstLineTop - dialogRect.top, "Picker's first line sits at least 16px below the popover's top edge").toBeGreaterThanOrEqual(16);
    if (width === 390) {
      const dialogStyle = getComputedStyle(dialog);
      expect(dialogRect.left >= 0 && dialogRect.top >= 0 && dialogRect.right <= window.innerWidth && dialogRect.bottom <= window.innerHeight, "Color popover stays inside the 390px viewport").toBe(true);
      for (const rect of firstLine) {
        expect(rect.left, "Picker's first line stays inside the popover's left edge").toBeGreaterThanOrEqual(dialogRect.left + length(dialogStyle.borderLeftWidth));
        expect(rect.right, "Picker's first line stays inside the popover's right edge").toBeLessThanOrEqual(dialogRect.right - length(dialogStyle.borderRightWidth));
      }
      expect(dialog.scrollWidth, "Color popover does not overflow horizontally").toBeLessThanOrEqual(dialog.clientWidth);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(slot).toHaveFocus());
    await expect(dialog).not.toBeInTheDocument();
  }
}

export const ColorPickerLayout390: Story = {
  render: () => <RoundTwoThemes kind="color" />,
  play: async ({ canvasElement }) => checkColorPickerLayout(canvasElement, 390),
};

export const ColorPickerLayout1440: Story = {
  ...ColorPickerLayout390,
  play: async ({ canvasElement }) => checkColorPickerLayout(canvasElement, 1440),
};

export const ColorPickerFormats: Story = {
  render: () => <RoundTwoThemes kind="color" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    colorChanges.clear();
    const [scope] = roundTwoScopes(canvasElement, "color");
    const canvas = within(scope!);
    const group = await canvas.findByRole("group", { name: "Accent color" });
    const chooser = formatChooser(group, "Accent color");
    let current: ColorFormat = "hex";
    for (const [index, reference] of colorReferences.entries()) {
      if (index > 0) {
        await userEvent.click(canvas.getByRole("button", { name: `Use ${reference.hex}` }));
        await expect(valueField(group, "Accent color", current), `An external change to ${reference.hex} shows in the ${current} format`).toHaveValue(reference[current]);
      }
      for (const [format] of colorFormats) {
        await userEvent.selectOptions(chooser, format);
        current = format;
        await expect(valueField(group, "Accent color", format), `${reference.hex} in ${format}`).toHaveValue(reference[format]);
        expect(colorChangesOf("light Accent color"), "Choosing a format keeps the color").toEqual([]);
      }
    }
    const locked = canvas.getByRole("group", { name: "Locked color" });
    for (const control of [
      within(locked).getByLabelText("Locked color color well"),
      formatChooser(locked, "Locked color"),
      valueField(locked, "Locked color", "hex"),
      ...["Red", "Green", "Blue"].map((channel) => within(locked).getByRole("slider", { name: `Locked color ${channel} channel` })),
    ]) {
      await expect(control).toBeDisabled();
    }
  },
};

const colorEntries: ReadonlyArray<{ format: ColorFormat; entry: string; expected: string; exact: boolean }> = [
  { format: "hex", entry: "#123456", expected: "#123456", exact: true },
  { format: "hex", entry: "#ABCDEF", expected: "#abcdef", exact: true },
  { format: "rgb", entry: "18 52 86", expected: "#123456", exact: true },
  { format: "rgb", entry: "rgb(18 52 86)", expected: "#123456", exact: true },
  { format: "rgb", entry: "rgb(18, 52, 86)", expected: "#123456", exact: true },
  { format: "hsl", entry: "210 65% 20%", expected: "#123456", exact: false },
  { format: "hsl", entry: "hsl(210 65% 20%)", expected: "#123456", exact: false },
  { format: "oklch", entry: "0.319 0.072 251.2", expected: "#123456", exact: false },
  { format: "oklch", entry: "oklch(0.319 0.072 251.2)", expected: "#123456", exact: false },
  { format: "oklch", entry: "31.9% 0.072 251.2", expected: "#123456", exact: false },
  { format: "oklch", entry: "oklch(31.9% 0.072 251.2)", expected: "#123456", exact: false },
];

async function expectInvalidDraft(field: HTMLInputElement, entry: string) {
  await expect(field, `${entry} is marked invalid`).toHaveAttribute("aria-invalid", "true");
  const explanations = (field.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean).map((id) => document.getElementById(id));
  expect(explanations.some((explanation) => explanation && explanation.textContent?.trim() && visible(explanation)), `${entry} has a visible explanation`).toBe(true);
}

export const ColorPickerEditing: Story = {
  render: () => <RoundTwoThemes kind="color" />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    colorChanges.clear();
    const [scope] = roundTwoScopes(canvasElement, "color");
    const canvas = within(scope!);
    const key = "light Accent color";
    const group = await canvas.findByRole("group", { name: "Accent color" });
    for (const { format, entry, expected, exact } of colorEntries) {
      // Start from a different color so each entry's change is observable.
      await userEvent.click(canvas.getByRole("button", { name: "Use #c2410c" }));
      await userEvent.selectOptions(formatChooser(group, "Accent color"), format);
      const field = valueField(group, "Accent color", format);
      const before = colorChangesOf(key).length;
      await userEvent.clear(field);
      await userEvent.type(field, entry);
      const recorded = colorChangesOf(key);
      expect(recorded.length, `${entry} calls onValueChange`).toBeGreaterThan(before);
      const last = recorded.at(-1)!;
      expect(last, `${entry} reports a lowercase #rrggbb`).toMatch(/^#[0-9a-f]{6}$/);
      if (exact) {
        expect(last, `${entry} reports the exact color`).toBe(expected);
      } else {
        for (const [index, channel] of channels(last).entries()) {
          expect(Math.abs(channel - channels(expected)[index]!), `${entry} reports ${expected} within 2 per channel, got ${last}`).toBeLessThanOrEqual(2);
        }
      }
      if (format !== "hex") await expect(field, `${entry} stays as typed`).toHaveValue(entry);
    }

    const well = within(group).getByLabelText("Accent color color well");
    fireEvent.input(well, { target: { value: "#808080" } });
    await waitFor(() => expect(colorChangesOf(key).at(-1), "Changing the color well updates the color").toBe("#808080"));
    await expect(well).toHaveValue("#808080");

    for (const { format, entry, reset } of [{ format: "rgb", entry: "18 52", reset: "#c2410c" }, { format: "hex", entry: "#12", reset: "#808080" }] as const) {
      await userEvent.click(canvas.getByRole("button", { name: `Use ${reset}` }));
      await userEvent.selectOptions(formatChooser(group, "Accent color"), format);
      const field = valueField(group, "Accent color", format);
      const before = colorChangesOf(key).length;
      await userEvent.clear(field);
      await userEvent.type(field, entry);
      await expectInvalidDraft(field, entry);
      expect(colorChangesOf(key), `${entry} does not change the color`).toHaveLength(before);
    }

    const slot = canvas.getByRole("button", { name: "Series color 2" });
    slot.scrollIntoView({ block: "center" });
    await userEvent.click(slot);
    const dialog = await within(scope!).findByRole("dialog", { name: "Series color 2 picker" });
    const slotGroup = within(dialog).getByRole("group", { name: "Series color 2" });
    await userEvent.selectOptions(formatChooser(slotGroup, "Series color 2"), "rgb");
    const slotField = valueField(slotGroup, "Series color 2", "rgb");
    await expect(slotField).toHaveValue("194 65 12");
    await userEvent.clear(slotField);
    await userEvent.type(slotField, "18 52 86");
    expect(colorChangesOf("light Series color 2").at(-1), "The popover picker reports the typed color").toBe("#123456");
    await expect(slotField).toHaveValue("18 52 86");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(slot).toHaveFocus());
    await settled(slot);
    expect(paint(slot), "The slot paints the color chosen in its picker").toBe(color("#123456"));
  },
};

type PaintedPixels = { data: Uint8ClampedArray; width: number; left: number; top: number; scale: number };

async function paintedPixels(session: CDPSession, element: HTMLElement, margin: number): Promise<PaintedPixels> {
  const rect = topLevelRect(element.getBoundingClientRect());
  const left = Math.floor(rect.left - margin);
  const top = Math.floor(rect.top - margin);
  const width = Math.ceil(rect.left + rect.width + margin) - left;
  const height = Math.ceil(rect.top + rect.height + margin) - top;
  const { data: png } = await session.send("Page.captureScreenshot", { format: "png", clip: { x: left, y: top, width, height, scale: 1 } });
  const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas pixel decoding is unavailable");
  context.drawImage(bitmap, 0, 0);
  return { data: context.getImageData(0, 0, bitmap.width, bitmap.height).data, width: bitmap.width, left, top, scale: bitmap.width / width };
}

type PixelPaint = { coverage: number; knob: boolean };

function trackCoverage(pixel: number[], track: number[], knob: number[], page: number[]): PixelPaint {
  // Project onto the segment toward the track paint from whichever other paint (knob or page) explains the pixel best.
  let best = { coverage: 0, residual: Number.POSITIVE_INFINITY, knob: false };
  for (const other of [knob, page]) {
    const axis = [0, 1, 2].map((index) => track[index]! - other[index]!);
    const offset = [0, 1, 2].map((index) => pixel[index]! - other[index]!);
    const span = axis.reduce((sum, value) => sum + value * value, 0);
    const coverage = Math.min(1, Math.max(0, offset.reduce((sum, value, index) => sum + value * axis[index]!, 0) / span));
    const residual = Math.hypot(...offset.map((value, index) => value - coverage * axis[index]!));
    if (residual < best.residual) best = { coverage, residual, knob: other === knob };
  }
  return { coverage: best.coverage, knob: best.knob };
}

async function paintedKnobGaps(session: CDPSession, control: HTMLElement, scope: HTMLElement) {
  const pixels = await paintedPixels(session, control, 3);
  const track = role(control, control.getAttribute("aria-checked") === "true" ? "accent" : "border").split(",").map(Number);
  const knob = role(control, "surface").split(",").map(Number);
  const page = paintedBackground(control.parentElement!, scope);
  const paintAt = (x: number, y: number) => {
    const offset = (y * pixels.width + x) * 4;
    return trackCoverage(Array.from(pixels.data.slice(offset, offset + 3)), track, knob, page);
  };
  const rows = pixels.data.length / 4 / pixels.width;
  // Locate the knob from paint, not from an element box: the centroid of knob paint inside the pill,
  // at least one device pixel in from its edge so the track's anti-aliased rim never counts as knob.
  const trackRect = topLevelRect(control.getBoundingClientRect());
  const radius = trackRect.height * pixels.scale / 2;
  const axisY = (trackRect.top - pixels.top) * pixels.scale + radius;
  const axisStart = (trackRect.left - pixels.left) * pixels.scale + radius;
  const axisEnd = (trackRect.left + trackRect.width - pixels.left) * pixels.scale - radius;
  let weight = 0;
  let sumX = 0;
  let sumY = 0;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < pixels.width; x += 1) {
      const nearestX = Math.min(axisEnd, Math.max(axisStart, x + 0.5));
      if (Math.hypot(x + 0.5 - nearestX, y + 0.5 - axisY) > radius - 1) continue;
      const paint = paintAt(x, y);
      if (!paint.knob) continue;
      weight += 1 - paint.coverage;
      sumX += (1 - paint.coverage) * (x + 0.5);
      sumY += (1 - paint.coverage) * (y + 0.5);
    }
  }
  expect(weight, "The switch paints a knob inside its track").toBeGreaterThan(0);
  const centerX = sumX / weight;
  const centerY = sumY / weight;
  let top = 0;
  let bottom = 0;
  for (let y = 0; y < rows; y += 1) {
    if (y + 0.5 < centerY) top += paintAt(Math.floor(centerX), y).coverage;
    else if (y + 0.5 > centerY) bottom += paintAt(Math.floor(centerX), y).coverage;
  }
  let start = 0;
  let end = 0;
  for (let x = 0; x < pixels.width; x += 1) {
    if (x + 0.5 < centerX) start += paintAt(x, Math.floor(centerY)).coverage;
    else if (x + 0.5 > centerX) end += paintAt(x, Math.floor(centerY)).coverage;
  }
  const nearerEnd = centerX < (axisStart + axisEnd) / 2 ? start : end;
  return { top, bottom, end: nearerEnd };
}

async function parkPointerOutsideFrame(session: CDPSession) {
  const frame = topLevelRect({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
  const host = window.top!;
  const point = frame.left + frame.width + 4 < host.innerWidth
    ? { x: frame.left + frame.width + 2, y: frame.top + 2 }
    : { x: frame.left + 2, y: frame.top + frame.height + 2 };
  expect(point.x < host.innerWidth && point.y < host.innerHeight, "The pointer parks outside the test frame").toBe(true);
  await session.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
}

async function checkPaintedSwitches(canvasElement: HTMLElement, width: number) {
  const context = await browser(width);
  const session = context.cdp();
  await session.send("Emulation.setDeviceMetricsOverride", { ...unscaledHost, deviceScaleFactor: 1, mobile: false });
  try {
    // The runner fits its frame on viewport changes; reapply the width on the enlarged host.
    await context.page.viewport(width, 844);
    const frame = topLevelRect({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
    expect(frame.width / window.innerWidth, "Painted measurement needs an unscaled test frame").toBe(1);
    await parkPointerOutsideFrame(session);
    for (const scope of roundTwoScopes(canvasElement, "switch")) {
      const switches = await within(scope).findAllByRole("switch");
      expect(switches, "Every zoom and offset renders an on and an off switch").toHaveLength(switchZooms.length * switchOffsets.length * 2);
      await settled(scope);
      for (const control of switches) {
        control.scrollIntoView({ block: "center" });
        expect(control.matches(":hover"), "The pointer is parked away from the switch").toBe(false);
        const name = `${scope.dataset.theme} ${control.getAttribute("aria-label")}`;
        const gaps = await paintedKnobGaps(session, control, scope);
        expect(Math.abs(gaps.top - gaps.bottom), `${name}: painted knob gaps top ${gaps.top.toFixed(2)} and bottom ${gaps.bottom.toFixed(2)} device px differ by at most 0.35`).toBeLessThanOrEqual(0.35);
        const crossAxis = (gaps.top + gaps.bottom) / 2;
        expect(Math.abs(gaps.end - crossAxis), `${name}: painted end gap ${gaps.end.toFixed(2)} device px is within 0.5 of the cross-axis gap ${crossAxis.toFixed(2)}`).toBeLessThanOrEqual(0.5);
      }
    }
  } finally {
    await session.send("Emulation.clearDeviceMetricsOverride");
  }
}

export const SwitchKnobCentered390: Story = {
  render: () => <RoundTwoThemes kind="switch" />,
  play: async ({ canvasElement }) => checkPaintedSwitches(canvasElement, 390),
};

export const SwitchKnobCentered1440: Story = {
  ...SwitchKnobCentered390,
  play: async ({ canvasElement }) => checkPaintedSwitches(canvasElement, 1440),
};

function tabIndicator(list: HTMLElement, trigger: HTMLElement) {
  const target = trigger.getBoundingClientRect();
  return Array.from(list.children).find((child) => {
    if (child.getAttribute("role") === "tab") return false;
    const rect = child.getBoundingClientRect();
    return rect.width > 0 && rect.height >= target.height - 2;
  }) as HTMLElement | undefined;
}

async function animationFrame() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function sampleTabTransition(trigger: HTMLElement, indicator: HTMLElement, previousLeft: number | null) {
  let lastLeft = previousLeft;
  for (let frame = 0; frame < 16; frame += 1) {
    await animationFrame();
    const backgroundAlpha = rgba(getComputedStyle(trigger).backgroundColor)[3]! / 255;
    expect(backgroundAlpha, "Trigger fill must not obscure the moving selected indicator").toBeLessThanOrEqual(0.25);
    const currentLeft = indicator.getBoundingClientRect().left;
    if (lastLeft !== null) expect(currentLeft + 0.5, "Selected indicator moves monotonically toward the destination").toBeGreaterThanOrEqual(lastLeft);
    lastLeft = currentLeft;
  }
  return lastLeft;
}

function SegmentSwitchProbe({ theme }: { theme: Theme }) {
  const [value, setValue] = useState("one");
  return <section data-theme={theme} aria-label={`${theme} segment animation`} className="w-full bg-ui-background p-4 text-sm text-ui-foreground">
    <SegmentedControl
      ariaLabel={`${theme} segment animation`}
      value={value}
      onValueChange={setValue}
      options={[{ value: "one", label: "Segment One" }, { value: "two", label: "Segment Two" }]}
    />
  </section>;
}

export const TabSwitchFeedback: Story = {
  render: () => <TabsLayoutProbe />,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} graph and data` });
      const canvas = within(scope);
      const list = canvas.getByRole("tablist", { name: "Graph and data" });
      const graph = within(list).getByRole("tab", { name: "Graph" });
      const data = within(list).getByRole("tab", { name: "Data" });
      const indicator = tabIndicator(list, graph);
      expect(indicator).toBeDefined();
      await userEvent.hover(data);
      await sampleTabTransition(data, indicator!, null);
      const point = topLevelPoint(data);
      await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
      let lastLeft: number | null = indicator!.getBoundingClientRect().left;
      try {
        lastLeft = await sampleTabTransition(data, indicator!, lastLeft);
      } finally {
        await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
      }
      await expect(data).toHaveAttribute("aria-selected", "true");
      await sampleTabTransition(data, indicator!, lastLeft);
      const finalIndicator = indicator!.getBoundingClientRect();
      const selected = data.getBoundingClientRect();
      expect(Math.abs(finalIndicator.left - selected.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(finalIndicator.width - selected.width)).toBeLessThanOrEqual(0.5);
    }
  },
};

export const SegmentSwitchFeedback: Story = {
  render: () => <>{themes.map((theme) => <SegmentSwitchProbe key={theme} theme={theme} />)}</>,
  play: async ({ canvasElement }) => {
    const { cdp, userEvent } = await browser();
    const session = cdp();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} segment animation` });
      const track = within(scope).getByRole("group", { name: `${theme} segment animation` });
      const first = within(track).getByRole("button", { name: "Segment One" });
      const destination = within(track).getByRole("button", { name: "Segment Two" });
      const indicator = tabIndicator(track, first);
      expect(indicator).toBeDefined();
      await userEvent.hover(destination);
      await sampleTabTransition(destination, indicator!, null);
      const point = topLevelPoint(destination);
      await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
      let lastLeft: number | null = indicator!.getBoundingClientRect().left;
      try {
        lastLeft = await sampleTabTransition(destination, indicator!, lastLeft);
      } finally {
        await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
      }
      await expect(destination).toHaveAttribute("aria-pressed", "true");
      await sampleTabTransition(destination, indicator!, lastLeft);
      const finalIndicator = indicator!.getBoundingClientRect();
      const selected = destination.getBoundingClientRect();
      expect(Math.abs(finalIndicator.left - selected.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(finalIndicator.width - selected.width)).toBeLessThanOrEqual(0.5);
    }
  },
};

const SharedControls = composeStory(sharedControlsStory, statesMeta);

export const PortaledColorPickerThemes: Story = {
  render: () => <SharedControls />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} shared control states` });
      const trigger = within(scope).getByRole("button", { name: `${theme} data color 1` });
      await userEvent.click(trigger);
      const picker = await within(document.body).findByRole("dialog");
      expect(paint(picker)).toBe(role(scope, "surface"));
      expect(paint(picker, "color")).toBe(role(scope, "surface-foreground"));
      await userEvent.keyboard("{Escape}");
    }
  },
};

export const PortaledSelectThemes: Story = {
  render: () => <SharedControls />,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} shared control states` });
      const select = within(scope).getByRole("combobox", { name: "Shared choice" });
      await userEvent.click(select);
      const listbox = await within(document.body).findByRole("listbox");
      expect(paint(listbox)).toBe(role(scope, "surface"));
      expect(paint(listbox, "color")).toBe(role(scope, "surface-foreground"));
      await userEvent.keyboard("{Escape}");
    }
  },
};
function InvalidComparisonProbe({ theme }: { theme: Theme }) {
  return <section data-theme={theme} aria-label={`${theme} invalid comparison`} className="grid w-full gap-3 bg-ui-background p-4 text-sm text-ui-foreground">
    <button type="button" data-testid="pointer-parking">Invalid comparison start</button>
    <Fields theme={theme} />
    <Fields theme={theme} invalid />
  </section>;
}

export const InvalidFieldStateComparison: Story = {
  render: () => <>{themes.map((theme) => <InvalidComparisonProbe key={theme} theme={theme} />)}</>,
  play: async ({ canvasElement }) => {
    const { userEvent } = await browser();
    for (const theme of themes) {
      const scope = within(canvasElement).getByRole("region", { name: `${theme} invalid comparison` });
      const canvas = within(scope);
      await userEvent.hover(canvas.getByTestId("pointer-parking"));
      await settled(scope);
      for (const name of fieldNames) {
        const valid = field(scope, name);
        const invalid = field(scope, `Invalid ${name}`);
        const expectMatchingState = (state: string, validBackground: number[], invalidBackground: number[]) => {
          expect(distance(invalidBackground, validBackground), `${name} ${state} background remains unchanged when invalid`).toBeLessThanOrEqual(2);
          expect(paint(invalid, "color"), `${name} ${state} text keeps normal ink`).toBe(paint(valid, "color"));
          expect([role(invalid, "danger"), role(invalid, "danger-ink")], `${name} ${state} underline uses danger`).toContain(paint(invalid, "borderBottomColor"));
        };
        expectMatchingState("rest", rgba(getComputedStyle(valid).backgroundColor), rgba(getComputedStyle(invalid).backgroundColor));
        await userEvent.hover(valid);
        await settled(valid);
        const validHover = rgba(getComputedStyle(valid).backgroundColor);
        await userEvent.hover(invalid);
        await settled(invalid);
        expectMatchingState("hover", validHover, rgba(getComputedStyle(invalid).backgroundColor));
        await keyboardFocus(valid);
        const validFocus = rgba(getComputedStyle(valid).backgroundColor);
        await keyboardFocus(invalid);
        expectMatchingState("focus", validFocus, rgba(getComputedStyle(invalid).backgroundColor));
      }
    }
  },
};

function SegmentGeometryProbe({ theme }: { theme: Theme }) {
  const [value, setValue] = useState("one");
  return <section data-theme={theme} aria-label={`${theme} segment geometry`} className="w-full bg-ui-background p-4 text-sm text-ui-foreground">
    <SegmentedControl
      ariaLabel={`${theme} segment geometry`}
      value={value}
      onValueChange={setValue}
      options={[{ value: "one", label: "Segment One" }, { value: "two", label: "Segment Two" }]}
    />
  </section>;
}

async function checkSegmentedGeometry(canvasElement: HTMLElement, width: number) {
  await browser(width);
  for (const theme of themes) {
    const scope = within(canvasElement).getByRole("region", { name: `${theme} segment geometry` });
    const track = within(scope).getByRole("group", { name: `${theme} segment geometry` });
    const selected = within(track).getByRole("button", { pressed: true });
    const unselected = within(track).getByRole("button", { pressed: false });
    await settled(track);
    expect(paint(track)).toBe(role(track, "muted"));
    expect(paint(unselected, "color")).toBe(role(unselected, "muted-foreground"));
    expectSelectionInk(selected);
    const indicator = tabIndicator(track, selected);
    expect(indicator).toBeDefined();
    expect(paint(indicator!)).toBe(role(selected, "accent"));
    const indicatorRect = indicator!.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    expect(Math.abs(indicatorRect.left - selectedRect.left)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(indicatorRect.width - selectedRect.width)).toBeLessThanOrEqual(0.5);
  }
}

export const SegmentedControlGeometry390: Story = {
  render: () => <>{themes.map((theme) => <SegmentGeometryProbe key={theme} theme={theme} />)}</>,
  play: async ({ canvasElement }) => checkSegmentedGeometry(canvasElement, 390),
};

export const SegmentedControlGeometry1440: Story = {
  ...SegmentedControlGeometry390,
  play: async ({ canvasElement }) => checkSegmentedGeometry(canvasElement, 1440),
};
