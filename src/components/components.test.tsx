import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { Checkbox, Switch } from "./BinaryControls";
import { StatusPanel } from "./StatusPanel";

describe("shared controls", () => {
  test("button is non-submitting by default and forwards activation", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("checkbox and switch expose their labels and state", async () => {
    render(
      <>
        <Checkbox label="Include generated files" />
        <Switch label="Show context" />
      </>,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Include generated files" });
    const toggle = screen.getByRole("switch", { name: "Show context" });
    await userEvent.click(checkbox);
    await userEvent.click(toggle);
    expect(checkbox).toBeChecked();
    expect(toggle).toBeChecked();
  });
});

describe("shared feedback", () => {
  test("status panel and badge preserve semantic content", () => {
    render(
      <StatusPanel
        eyebrow="Snapshot rejected"
        title="Review unavailable"
        description={<p>Invalid analysis payload.</p>}
        tone="danger"
        role="alert"
      />,
    );
    render(<Badge tone="warning">Watch</Badge>);

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid analysis payload");
    expect(screen.getByText("Watch")).toBeVisible();
  });
});
