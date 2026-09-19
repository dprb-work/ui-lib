import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Search } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { CopyButton, Tooltip, TooltipProvider } from "./Interactions";

const meta = {
  title: "Components/Tooltip",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip label="Inspect the current selection" delayDuration={0}>
      <Button>Inspect</Button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "Inspect" }));
    await expect(await within(canvasElement.ownerDocument.body).findByRole("tooltip", { name: "Inspect the current selection" })).toHaveAttribute("data-side", "bottom");
  },
};

export const Optional: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button tooltip="Save the current draft">Save</Button>
      <Button tooltip={false}>No tooltip</Button>
      <Tooltip label={false}>
        <Button>Direct child</Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "Save" }));
    await expect(await within(canvasElement.ownerDocument.body).findByRole("tooltip", { name: "Save the current draft" })).toBeVisible();
    await userEvent.unhover(canvas.getByRole("button", { name: "Save" }));
    await userEvent.hover(canvas.getByRole("button", { name: "No tooltip" }));
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).queryByRole("tooltip")).not.toBeInTheDocument());
  },
};

export const AccessibleLabelFallback: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton label="Search">
        <Search aria-hidden="true" />
      </IconButton>
      <IconButton label="Copy permalink" tooltip={false}>
        <Copy aria-hidden="true" />
      </IconButton>
      <CopyButton text="https://example.test/reviews/42" label="Copy review link" />
      <CopyButton text="https://example.test/reviews/42" label="Copy without a tooltip" tooltip={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "Search" }));
    await expect(await within(canvasElement.ownerDocument.body).findByRole("tooltip", { name: "Search" })).toBeVisible();
  },
};

export const ProviderDefaults: Story = {
  render: () => (
    <TooltipProvider delayDuration={0} className="border-ui-accent bg-ui-accent text-ui-on-accent">
      <Button tooltip="Configured by the application provider">Provider style</Button>
    </TooltipProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "Provider style" }));
    await expect(await within(canvasElement.ownerDocument.body).findByRole("tooltip", { name: "Configured by the application provider" })).toHaveAttribute("data-side", "bottom");
  },
};

export const NearBottomCollision: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="flex h-[calc(100dvh-1rem)] items-end justify-center p-4">
      <Tooltip label="Flips above when the bottom edge has no room" delayDuration={0}>
        <Button>Near bottom edge</Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "Near bottom edge" }));
    await expect(await within(canvasElement.ownerDocument.body).findByRole("tooltip", { name: "Flips above when the bottom edge has no room" })).toHaveAttribute("data-side", "top");
  },
};
