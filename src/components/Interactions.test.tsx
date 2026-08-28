import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test } from "vitest";

import { Dialog, Tabs, Tooltip } from "./Interactions";

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
      forceMount
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
    expect(screen.getByText("summary panel")).toBeVisible();
    const evidencePanel = screen.getByText("evidence panel").closest("[data-state]");
    expect(evidencePanel).toHaveAttribute("data-state", "inactive");
    expect(evidencePanel).toHaveClass("data-[state=inactive]:hidden");
    await userEvent.click(summary);
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(evidence).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("evidence panel")).toBeVisible();
  });

  test("dialog exposes its title and close callback", async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <Dialog unstyled contentClassName="consumer-dialog" open={open} onOpenChange={setOpen} title="Details" trigger={<button type="button">Open details</button>}>
          {(close) => <button type="button" onClick={close}>Done</button>}
        </Dialog>
      );
    }
    render(<Example />);

    await userEvent.click(screen.getByRole("button", { name: "Open details" }));
    expect(screen.getByRole("dialog", { name: "Details" })).toBeVisible();
    expect(screen.getByRole("dialog", { name: "Details" })).toHaveClass("consumer-dialog");
    expect(screen.getByRole("dialog", { name: "Details" }).className).toBe("consumer-dialog");
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog", { name: "Details" })).not.toBeInTheDocument();
  });

  test("tooltip retains the trigger's accessible name", () => {
    render(<Tooltip label="Inspect"><button type="button">Target</button></Tooltip>);
    expect(screen.getByRole("button", { name: "Target" })).toBeVisible();
  });
});
