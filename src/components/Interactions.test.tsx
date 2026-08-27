import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";

import { Dialog, InfoPopover, Tabs, ThemeSelector, Tooltip } from "./Interactions";

function ControlledTabs() {
  const [value, setValue] = useState("summary");
  return (
    <Tabs
      ariaLabel="Analysis views"
      tabs={[
        { value: "summary", label: "Summary" },
        { value: "evidence", label: "Evidence" },
      ]}
      value={value}
      onValueChange={setValue}
    >
      {(tab) => <p>{tab.value} panel</p>}
    </Tabs>
  );
}

describe("shared interactions", () => {
  test("tabs expose selection and keyboard navigation", async () => {
    render(<ControlledTabs />);
    const summary = screen.getByRole("tab", { name: "Summary" });
    const evidence = screen.getByRole("tab", { name: "Evidence" });

    expect(summary).toHaveAttribute("aria-selected", "true");
    await userEvent.click(summary);
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(evidence).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("evidence panel")).toBeVisible();
  });

  test("dialog exposes its title and close callback", async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <Dialog open={open} onOpenChange={setOpen} title="Details" trigger={<button type="button">Open details</button>}>
          {(close) => <button type="button" onClick={close}>Done</button>}
        </Dialog>
      );
    }
    render(<Example />);

    await userEvent.click(screen.getByRole("button", { name: "Open details" }));
    expect(screen.getByRole("dialog", { name: "Details" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog", { name: "Details" })).not.toBeInTheDocument();
  });

  test("tooltip and information popover retain accessible names", async () => {
    render(
      <>
        <Tooltip label="Inspect"><button type="button">Target</button></Tooltip>
        <InfoPopover label="Decision" description="Accepted constraint">i</InfoPopover>
      </>,
    );

    expect(screen.getByRole("button", { name: "Decision" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Decision" }));
    expect(await screen.findByText("Accepted constraint")).toBeVisible();
  });

  test("theme selector reports the selected mode", async () => {
    const onChange = vi.fn();
    render(<ThemeSelector mode="system" onChange={onChange} />);

    expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(onChange).toHaveBeenCalledWith("dark");
  });
});
