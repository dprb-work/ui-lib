import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "./Button";
import { Dialog, Tabs, Tooltip } from "./Interactions";
import {
  Popover,
  PopoverArrow,
  PopoverClose,
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

const unusedArgs = {
  ariaLabel: "Unused",
  tabs: [],
  value: "",
  onValueChange: () => undefined,
  children: () => null,
};
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-[34rem] gap-6 rounded-xl border border-ui-border bg-ui-surface p-6 text-ui-surface-foreground shadow-sm">
      {children}
    </div>
  );
}

function TabsFixture() {
  const [tab, setTab] = useState("summary");
  return (
    <Frame>
      <Tabs
        ariaLabel="Review views"
        tabs={[
          { value: "summary", label: "Summary" },
          { value: "evidence", label: "Evidence" },
          { value: "history", label: "History", disabled: true },
        ]}
        value={tab}
        onValueChange={setTab}
        forceMount
      >
        {(option) => (
          <div className="rounded-lg bg-ui-muted p-4 text-sm">
            {option.label} content
          </div>
        )}
      </Tabs>
    </Frame>
  );
}

export const TabbedContent: Story = {
  args: unusedArgs,
  render: () => <TabsFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Evidence" }));
    await expect(canvas.getByText("Evidence content")).toBeVisible();
    await expect(canvas.getByText("Summary content")).not.toBeVisible();
    await expect(canvas.getByRole("tab", { name: "History" })).toBeDisabled();
  },
};

export const Tooltips: Story = {
  args: unusedArgs,
  render: () => (
    <Frame>
      <div className="flex items-center gap-4">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <Tooltip key={side} label={`${side} tooltip`} side={side} delayDuration={0}>
            <Button variant="secondary">{side}</Button>
          </Tooltip>
        ))}
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.hover(canvas.getByRole("button", { name: "top" }));
    await expect(await body.findByRole("tooltip", { name: "top tooltip" })).toBeVisible();
  },
};

export const Popovers: Story = {
  args: unusedArgs,
  render: () => (
    <Frame>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary">
            <Info aria-hidden="true" />
            Explain review effort
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Review effort explanation">
          <div className="grid gap-3">
            <div>
              <p className="m-0 font-semibold">Review effort</p>
              <p className="m-0 mt-1 text-ui-muted-foreground">
                Estimated from changed responsibilities and dependency impact.
              </p>
            </div>
            <PopoverClose asChild>
              <Button size="small" variant="ghost">
                <X aria-hidden="true" />
                Close
              </Button>
            </PopoverClose>
          </div>
          <PopoverArrow />
        </PopoverContent>
      </Popover>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Explain review effort" }));
    await expect(
      await body.findByRole("dialog", { name: "Review effort explanation" }),
    ).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "Close" }));
    await expect(
      body.queryByRole("dialog", { name: "Review effort explanation" }),
    ).not.toBeInTheDocument();
  },
};

function DialogFixture() {
  const [open, setOpen] = useState(false);
  return (
    <Frame>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Discard review notes?"
        trigger={<Button variant="danger">Discard notes</Button>}
      >
        {(close) => (
          <div className="grid gap-5">
            <p className="m-0 text-sm text-ui-muted-foreground">
              This removes the local draft. Published comments are unchanged.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button variant="danger" onClick={close}>
                Discard
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </Frame>
  );
}

export const Dialogs: Story = {
  args: unusedArgs,
  render: () => <DialogFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Discard notes" }));
    await expect(await body.findByRole("dialog", { name: "Discard review notes?" })).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "Cancel" }));
    await expect(
      body.queryByRole("dialog", { name: "Discard review notes?" }),
    ).not.toBeInTheDocument();
  },
};

export const ThemeSelection: Story = {
  args: unusedArgs,
  render: () => (
    <ThemeProvider defaultMode="light" storageKey={null}>
      <Frame>
        <ThemeSwitch />
        <p className="m-0 text-sm text-ui-muted-foreground">
          The provider updates the document theme for every shared component.
        </p>
      </Frame>
    </ThemeProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Dark" }));
    await expect(canvas.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};
