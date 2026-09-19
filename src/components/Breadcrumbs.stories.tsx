import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Breadcrumbs } from "./Breadcrumbs";

const meta = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { key: "workspaces", label: "Workspaces", href: "/workspaces" },
  { key: "research", label: "Research", href: "/workspaces/research" },
  { key: "review", label: "Review 42" },
];

export const Navigation: Story = {
  args: { "aria-label": "Review location", items },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Workspaces" });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(canvas.getByText("Review 42")).toHaveAttribute("aria-current", "page");
  },
};

export const LongMobile: Story = {
  args: {
    "aria-label": "Repository location",
    items: [
      { key: "org", label: "dprb-work", href: "/org" },
      { key: "repository", label: "agent-assisted-responsibility-review", href: "/repositories/agent-assisted-responsibility-review" },
      { key: "review", label: "Extract a reusable evidence policy without losing provenance" },
    ],
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export const Ancestors: Story = {
  args: {
    "aria-label": "Parent folders",
    items: [
      { key: "knowledge", label: "Knowledge", href: "/knowledge" },
      { key: "decisions", label: "Decisions", href: "/knowledge/decisions", current: false },
    ],
  },
};
