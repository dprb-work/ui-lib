import { composeStory, type Meta, type StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import storybookHostHtml from "../../node_modules/storybook/assets/server/base-preview-head.html?raw";
import controlsMeta, { BinaryControls, Inputs } from "./Controls.stories";
import interactionsMeta, { Popovers, TabbedContent } from "./Interactions.stories";

const ShippedInputs = composeStory(Inputs, controlsMeta);
const ShippedBinary = composeStory(BinaryControls, controlsMeta);
const ShippedTabs = composeStory(TabbedContent, interactionsMeta);
const ShippedPopovers = composeStory(Popovers, interactionsMeta);

type LayoutArgs = {
  example: "inputs" | "binary" | "tabs" | "popovers";
  width: number;
};

const meta = {
  title: "Foundations/Subtraction layout contract",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "centered" },
  globals: { theme: "light" },
  args: { example: "inputs", width: 390 },
  render: ({ example }) => example === "inputs" ? <ShippedInputs />
    : example === "binary" ? <ShippedBinary />
      : example === "tabs" ? <ShippedTabs /> : <ShippedPopovers />,
  beforeEach: ({ canvasElement }) => {
    // Portable stories omit PreviewWeb's host layout. Use the installed
    // Storybook stylesheet/profile, not copied CSS or mocked component behavior.
    // This source-browser fixture is not an actual static-catalog page test.
    const doc = canvasElement.ownerDocument;
    const styles = Array.from(new DOMParser().parseFromString(storybookHostHtml, "text/html").querySelectorAll("style"))
      .map((style) => doc.importNode(style, true));
    const previousClasses = doc.body.className;
    const previousId = canvasElement.getAttribute("id");
    for (const style of styles) doc.head.appendChild(style);
    doc.body.classList.add("sb-show-main", "sb-main-centered");
    canvasElement.id = "storybook-root";
    return () => {
      for (const style of styles) style.remove();
      doc.body.className = previousClasses;
      if (previousId === null) canvasElement.removeAttribute("id");
      else canvasElement.id = previousId;
    };
  },
  play: async ({ canvasElement, args }) => {
    // Vitest's browser platform is unavailable in the ordinary Storybook runtime.
    const { page } = await import("@vitest/browser/context");
    await page.viewport(args.width, 844);
    const doc = canvasElement.ownerDocument;
    const rootStyle = getComputedStyle(canvasElement);
    expect(getComputedStyle(doc.body).display, "The actual centered host profile must be active").toBe("flex");
    const rem = Number.parseFloat(getComputedStyle(doc.documentElement).fontSize);
    expect(Number.parseFloat(rootStyle.paddingLeft)).toBe(rem);
    expect(Number.parseFloat(rootStyle.paddingRight)).toBe(rem);
    const layout = canvasElement.querySelector<HTMLElement>(":scope > *")!;
    const rect = layout.getBoundingClientRect();
    expect(doc.documentElement.clientWidth).toBe(args.width);
    expect(doc.documentElement.scrollWidth, `${args.example} must not overflow the ${args.width}px page`).toBeLessThanOrEqual(args.width);
    expect(rect.left, "The example must not be clipped on the left").toBeGreaterThanOrEqual(0);
    expect(rect.right, "The example must not be clipped on the right").toBeLessThanOrEqual(args.width);
    if (args.width === 1440) {
      const authoredRem = args.example === "inputs" || args.example === "binary" ? 24 : 34;
      expect(Math.abs(rect.width - authoredRem * rem), "Preserve the existing desktop composition width").toBeLessThanOrEqual(1);
    }
    if (args.example === "tabs") {
      const tablist = within(canvasElement).getByRole("tablist");
      const parent = tablist.parentElement!;
      const parentStyle = getComputedStyle(parent);
      const innerWidth = parent.clientWidth - Number.parseFloat(parentStyle.paddingLeft) - Number.parseFloat(parentStyle.paddingRight);
      expect(Math.abs(tablist.getBoundingClientRect().width - innerWidth), "The tab group fills its containing content width").toBeLessThanOrEqual(1);
    }
  },
} satisfies Meta<LayoutArgs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const InputsPhoneLight: Story = {};
export const InputsPhoneDark: Story = { globals: { theme: "dark" } };
export const InputsDesktopLight: Story = { args: { width: 1440 } };
export const InputsDesktopDark: Story = { ...InputsDesktopLight, globals: { theme: "dark" } };

export const BinaryPhoneLight: Story = { args: { example: "binary" } };
export const BinaryPhoneDark: Story = { ...BinaryPhoneLight, globals: { theme: "dark" } };
export const BinaryDesktopLight: Story = { args: { example: "binary", width: 1440 } };
export const BinaryDesktopDark: Story = { ...BinaryDesktopLight, globals: { theme: "dark" } };

export const TabsPhoneLight: Story = { args: { example: "tabs" } };
export const TabsPhoneDark: Story = { ...TabsPhoneLight, globals: { theme: "dark" } };
export const TabsDesktopLight: Story = { args: { example: "tabs", width: 1440 } };
export const TabsDesktopDark: Story = { ...TabsDesktopLight, globals: { theme: "dark" } };

export const PopoversPhoneLight: Story = { args: { example: "popovers" } };
export const PopoversPhoneDark: Story = { ...PopoversPhoneLight, globals: { theme: "dark" } };
export const PopoversDesktopLight: Story = { args: { example: "popovers", width: 1440 } };
export const PopoversDesktopDark: Story = { ...PopoversDesktopLight, globals: { theme: "dark" } };
