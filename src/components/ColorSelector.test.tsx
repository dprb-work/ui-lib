import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test } from "vitest";

import { ColorSelector } from "./ColorSelector";

function ControlledSelector() {
  const [colors, setColors] = useState(["#123456", "#abcdef"]);
  return (
    <ColorSelector
      label="Series color"
      colors={colors}
      onValueChange={(index, color) => setColors((current) => current.map((value, slot) => slot === index ? color : value))}
    />
  );
}

describe("ColorSelector", () => {
  test("opens named slots and preserves controlled color updates and focus return", async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);
    const firstSlot = screen.getByRole("button", { name: "Series color 1" });
    expect(screen.getByRole("button", { name: "Series color 2" })).toBeVisible();
    expect(firstSlot).toHaveAttribute("aria-expanded", "false");
    await user.click(firstSlot);
    expect(firstSlot).toHaveAttribute("aria-expanded", "true");
    expect(firstSlot).not.toHaveAttribute("aria-pressed");

    const picker = within(screen.getByRole("dialog", { name: "Series color 1 picker" }));
    const input = picker.getByRole("textbox", { name: "Series color 1 hex value" });
    await user.clear(input);
    await user.type(input, "#654321");
    expect(input).toHaveValue("#654321");

    await user.keyboard("{Escape}");
    expect(firstSlot).toHaveFocus();
    expect(firstSlot).toHaveAttribute("aria-expanded", "false");
    await user.click(firstSlot);
    expect(screen.getByRole("textbox", { name: "Series color 1 hex value" })).toHaveValue("#654321");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Series color 2" }));
    expect(screen.getByRole("textbox", { name: "Series color 2 hex value" })).toHaveValue("#abcdef");
  });

  test("disabled slots cannot open their color picker", async () => {
    render(<ColorSelector colors={["#123456"]} onValueChange={() => {}} disabled />);
    const slot = screen.getByRole("button", { name: "Color 1" });
    expect(slot).toBeDisabled();
    await userEvent.click(slot);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
