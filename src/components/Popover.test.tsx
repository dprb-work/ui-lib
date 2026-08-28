import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import {
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";

describe("Popover", () => {
  test("composes an accessible trigger, content, arrow, and close control", async () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Open filters">Filters</button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filter options">
          <p>Filter content</p>
          <PopoverArrow />
          <PopoverClose asChild>
            <button type="button">Apply</button>
          </PopoverClose>
        </PopoverContent>
      </Popover>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Open filters" }));
    expect(await screen.findByRole("dialog", { name: "Filter options" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.queryByRole("dialog", { name: "Filter options" })).not.toBeInTheDocument();
  });
});
