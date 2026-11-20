import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheck, CircleX, Info, MoreHorizontal, Trash2, TriangleAlert } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { expect, userEvent, within } from "storybook/test";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { NumberInput, SelectInput, TextareaInput, TextInput } from "./Inputs";
import { MenuItem } from "./MenuItem";
import { StatusMessage } from "./StatusMessage";
import { StatusPanel } from "./StatusPanel";
const statusRoles = [
  { tone: "success", Icon: CircleCheck, label: "Saved successfully" },
  { tone: "warning", Icon: TriangleAlert, label: "Review before continuing" },
  { tone: "info", Icon: Info, label: "Analysis is running" },
  { tone: "danger", Icon: CircleX, label: "Could not save" },
] as const;

function IconTextGapProbe({ theme }: { theme: "light" | "dark" }) {
  return (
    <div data-testid={`gap-probe-${theme}`}>
      <Button data-testid={`button-gap-${theme}`}><CircleCheck aria-hidden="true" size={16} /><span>Save changes</span></Button>
      <Button variant="danger" data-testid={`danger-button-gap-${theme}`}><CircleX aria-hidden="true" size={16} /><span>Delete sample</span></Button>
      {statusRoles.map(({ tone, Icon, label }) => <Badge key={tone} tone={tone} data-testid={`badge-${theme}-${tone}`}><Icon aria-hidden="true" size={14} /><span>{label}</span></Badge>)}
      <StatusPanel data-testid={`status-panel-${theme}`} icon={<CircleCheck aria-hidden="true" size={18} />} title="Changes saved" />
      <StatusPanel data-testid={`danger-panel-${theme}`} icon={<CircleX aria-hidden="true" size={18} />} tone="danger" title="Could not save" />
      <StatusMessage data-testid={`status-message-gap-${theme}`} icon={<CircleX aria-hidden="true" size={14} />}><span>The sample could not be saved because its name is unavailable.</span></StatusMessage>
      <label>Display name<TextInput error={<span>Enter a display name before saving.</span>} /></label>
      <label>Count<NumberInput error={<span>Enter a count.</span>} /></label>
      <label>Notes<TextareaInput error={<span>Enter notes.</span>} /></label>
      <SelectInput label="Mode" options={[{ label: "One", value: "one" }]} defaultValue="one" error={<span>Choose a mode.</span>} />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild><Button data-testid={`menu-trigger-gap-${theme}`} variant="secondary"><MoreHorizontal aria-hidden="true" size={16} />More actions</Button></DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="rounded-md border border-ui-border bg-ui-surface p-1 shadow-sm" sideOffset={4}>
            <MenuItem data-testid={`menu-item-gap-${theme}`} icon={<Trash2 aria-hidden="true" size={16} />} onSelect={(event) => event.preventDefault()}><span>Delete sample permanently</span></MenuItem>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

const meta = {
  title: "Foundations/Icon and label spacing contract",
  component: IconTextGapProbe,
  args: { theme: "light" },
} satisfies Meta<typeof IconTextGapProbe>;

export default meta;
type Story = StoryObj<typeof meta>;

function expectRenderedGap(container: HTMLElement, expected: number) {
  const icon = container.querySelector("svg")!;
  const label = [...container.querySelectorAll("span")].find((span) => !span.querySelector("svg") && span.textContent?.trim())!;
  const actual = label.getBoundingClientRect().left - icon.getBoundingClientRect().right;
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.5);
}

export const SharedRenderedIconTextGap: Story = {
  tags: ["!dev", "!autodocs"],
  render: () => (
    <>
      {(["light", "dark"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="bg-ui-background text-ui-foreground" style={{ "--spacing-ui-icon-text": "13px" } as CSSProperties}>
          <IconTextGapProbe theme={theme} />
        </section>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    const documentRoot = canvasElement.ownerDocument.documentElement;
    const body = canvasElement.ownerDocument.body;
    const previousTheme = body.getAttribute("data-theme");
    const previousGap = documentRoot.style.getPropertyValue("--spacing-ui-icon-text");
    const previousGapPriority = documentRoot.style.getPropertyPriority("--spacing-ui-icon-text");
    documentRoot.style.setProperty("--spacing-ui-icon-text", "13px");
    try {
      for (const theme of ["light", "dark"] as const) {
        body.setAttribute("data-theme", theme);
        const section = canvasElement.querySelector<HTMLElement>(`[data-theme="${theme}"]`)!;
        const style = getComputedStyle(section);
        const rawGap = style.getPropertyValue("--spacing-ui-icon-text").trim();
        expect(rawGap).toBe("13px");
        const expectedGap = Number.parseFloat(rawGap);
        const probe = section.querySelector<HTMLElement>(`[data-testid="gap-probe-${theme}"]`)!;
        const scoped = within(probe);
        expectRenderedGap(scoped.getByTestId(`button-gap-${theme}`), expectedGap);
        expectRenderedGap(scoped.getByTestId(`danger-button-gap-${theme}`), expectedGap);
        for (const { tone } of statusRoles) expectRenderedGap(scoped.getByTestId(`badge-${theme}-${tone}`), expectedGap);
        for (const panelHeading of probe.querySelectorAll("h1")) expectRenderedGap(panelHeading, expectedGap);
        expectRenderedGap(scoped.getByTestId(`status-message-gap-${theme}`), expectedGap);
        for (const message of ["Enter a display name before saving.", "Enter a count.", "Enter notes.", "Choose a mode."]) {
          expectRenderedGap(scoped.getByText(message).closest("p")!, expectedGap);
        }

        const menuTrigger = scoped.getByTestId(`menu-trigger-gap-${theme}`);
        expect(menuTrigger).toHaveRole("button");
        await userEvent.click(menuTrigger);
        const menuItem = await within(canvasElement.ownerDocument.body).findByTestId(`menu-item-gap-${theme}`);
        expectRenderedGap(menuItem, expectedGap);
        await userEvent.keyboard("{Escape}");
        await expect(menuItem).not.toBeInTheDocument();
      }
    } finally {
      if (previousTheme) body.setAttribute("data-theme", previousTheme);
      else body.removeAttribute("data-theme");
      if (previousGap) documentRoot.style.setProperty("--spacing-ui-icon-text", previousGap, previousGapPriority);
      else documentRoot.style.removeProperty("--spacing-ui-icon-text");
    }
  },
};

export const CanonicalDefaultGap: Story = {
  tags: ["!dev", "!autodocs"],
  render: () => (
    <>
      {(["light", "dark"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="bg-ui-background text-ui-foreground">
          <Button data-testid={`default-button-${theme}`}><CircleCheck aria-hidden="true" size={16} /><span>Save changes</span></Button>
          <div data-testid={`default-utility-${theme}`} className="flex items-center gap-ui-icon-text"><CircleCheck aria-hidden="true" size={16} /><span>Utility spacing</span></div>
          <div data-testid={`default-css-${theme}`} style={{ display: "flex", alignItems: "center", gap: "var(--spacing-ui-icon-text)" }}><CircleCheck aria-hidden="true" size={16} /><span>Plain CSS spacing</span></div>
        </section>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    const scoped = within(canvasElement);
    const rem = Number.parseFloat(getComputedStyle(canvasElement.ownerDocument.documentElement).fontSize);
    for (const theme of ["light", "dark"] as const) {
      const section = canvasElement.querySelector<HTMLElement>(`[data-theme="${theme}"]`)!;
      const style = getComputedStyle(section);
      const token = style.getPropertyValue("--spacing-ui-icon-text").trim();
      expect(token.endsWith("rem")).toBe(true);
      expect(Number.parseFloat(token)).toBe(0.375);
      expect(style.getPropertyValue("--ui-icon-text-gap").trim()).toBe("");
      for (const kind of ["button", "utility", "css"]) {
        expectRenderedGap(scoped.getByTestId(`default-${kind}-${theme}`), rem * 0.375);
      }
    }
  },
};
