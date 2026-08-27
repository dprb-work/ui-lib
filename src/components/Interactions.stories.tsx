import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Dialog, Tabs, Tooltip } from "./Interactions";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";
import { ThemeProvider, ThemeSwitch } from "./Theme";

const meta = {
  title: "Components/Interactions",
  component: Tabs,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractionFixture() {
  const [tab, setTab] = useState("summary");
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <ThemeProvider storageKey={null}>
      <div className="grid w-[34rem] gap-6 rounded-xl bg-white p-6 text-slate-950 shadow dark:bg-slate-950 dark:text-white">
        <Tabs
          ariaLabel="Example views"
          tabs={[{ value: "summary", label: "Summary" }, { value: "evidence", label: "Evidence" }]}
          value={tab}
          onValueChange={setTab}
          forceMount
        >
          {(option) => <p className="p-4">{option.label} content</p>}
        </Tabs>
        <div className="flex items-center gap-4">
          <Tooltip label="More information"><button type="button" aria-label="More information"><Info aria-hidden="true" /></button></Tooltip>
          <Popover>
            <PopoverTrigger asChild><button type="button">Context</button></PopoverTrigger>
            <PopoverContent aria-label="Context details">
              Reusable accessible popover content
              <PopoverArrow />
            </PopoverContent>
          </Popover>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Example dialog" trigger={<button type="button">Open dialog</button>}>
            {(close) => <button type="button" onClick={close}>Close dialog</button>}
          </Dialog>
        </div>
        <ThemeSwitch />
      </div>
    </ThemeProvider>
  );
}

export const Behaviors: Story = {
  args: {
    ariaLabel: "Unused",
    tabs: [],
    value: "",
    onValueChange: () => undefined,
    children: () => null,
  },
  render: () => <InteractionFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Evidence" }));
    await expect(canvas.getByText("Evidence content")).toBeVisible();
    await expect(canvas.getByText("Summary content")).not.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Dark" }));
    await expect(canvas.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  },
};
