import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { NumberInput, SelectInput, TextInput } from "./Inputs";
import { Checkbox, Switch } from "./BinaryControls";
import { StatusPanel } from "./StatusPanel";

describe("shared controls", () => {
  test("button is non-submitting by default and forwards activation", async () => {
    const onClick = vi.fn();
    render(<Button className="h-5 rounded-none" onClick={onClick}>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("h-5", "rounded-none");
    expect(button).not.toHaveClass("h-8", "rounded-md");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("icon button accepts independent parent-owned dimensions", () => {
    render(
      <IconButton className="h-full w-auto" label="Expand" size="large">
        X
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Expand" });
    expect(button).toHaveClass("h-full", "w-auto");
    expect(button).not.toHaveClass("h-8", "w-8", "h-11", "w-11");
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

  test("standard inputs render and associate error messages", () => {
    render(
      <>
        <label>
          Repository
          <TextInput error="Repository is required." />
        </label>
        <label>
          Context lines
          <NumberInput error="Use at least one line." />
        </label>
        <SelectInput
          label="Review depth"
          options={[{ label: "Focused", value: "focused" }]}
          error="Choose a review depth."
        />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Repository" })).toHaveAccessibleDescription(
      "Repository is required.",
    );
    expect(screen.getByRole("spinbutton", { name: "Context lines" })).toHaveAccessibleDescription(
      "Use at least one line.",
    );
    expect(screen.getByRole("combobox", { name: "Review depth" })).toHaveAccessibleDescription(
      "Choose a review depth.",
    );
    for (const control of [
      screen.getByRole("textbox", { name: "Repository" }),
      screen.getByRole("spinbutton", { name: "Context lines" }),
      screen.getByRole("combobox", { name: "Review depth" }),
    ]) {
      expect(control).toHaveAttribute("aria-invalid", "true");
    }
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
