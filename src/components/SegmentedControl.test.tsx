import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test } from "vitest";

import { SegmentedControl } from "./SegmentedControl";

const options = [
  { value: "unified", label: "Unified" },
  { value: "split", label: "Split" },
  { value: "disabled", label: "Disabled", disabled: true },
] as const;

function ControlledSegmentedControl() {
  const [value, setValue] = useState("unified");
  return (
    <SegmentedControl
      ariaLabel="Diff layout"
      options={options}
      value={value}
      onValueChange={setValue}
    />
  );
}

describe("SegmentedControl", () => {
  test("changes the pressed option and preserves disabled options", async () => {
    render(<ControlledSegmentedControl />);

    const unified = screen.getByRole("button", { name: "Unified" });
    const split = screen.getByRole("button", { name: "Split" });
    const disabled = screen.getByRole("button", { name: "Disabled" });

    expect(unified).toHaveAttribute("aria-pressed", "true");
    expect(split).toHaveAttribute("aria-pressed", "false");
    expect(disabled).toBeDisabled();

    await userEvent.click(split);

    expect(unified).toHaveAttribute("aria-pressed", "false");
    expect(split).toHaveAttribute("aria-pressed", "true");
  });
});
