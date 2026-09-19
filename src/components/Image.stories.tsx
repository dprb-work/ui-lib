import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Image } from "./Image";

const meta = {
  title: "Components/Image",
  component: Image,
  parameters: { layout: "centered" },
  args: { alt: "Repository activity preview" },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

const preview = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='96'%3E%3Crect width='100%25' height='100%25' fill='%230e7490'/%3E%3C/svg%3E";

export const AltFallback: Story = {
  render: (args) => <Image {...args} src={preview} className="h-24 w-40 rounded-md" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("img", { name: "Repository activity preview" }));
    await expect(await within(canvasElement.ownerDocument.body).findByRole("tooltip", { name: "Repository activity preview" })).toBeVisible();
  },
};

export const DecorativeAndOptOut: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Image src={preview} alt="" className="h-24 w-40 rounded-md" />
      <Image src={preview} alt="Visible chart preview" tooltip={false} className="h-24 w-40 rounded-md" />
    </div>
  ),
};
