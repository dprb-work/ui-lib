import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test } from "vitest";

import { Calendar } from "./Calendar";

function ControlledCalendar() {
  const [value, setValue] = useState<Date | null>(new Date(2026, 0, 16));
  const [month, setMonth] = useState(new Date(2026, 0, 1));

  return <Calendar
    value={value}
    onValueChange={setValue}
    month={month}
    onMonthChange={setMonth}
    disabled={(date) => date.getDay() === 0}
  />;
}


function CalendarWithDisabledPreviousMonthBoundary() {
  const [value, setValue] = useState<Date | null>(new Date(2026, 0, 1));
  const [month, setMonth] = useState(new Date(2026, 0, 1));

  return <Calendar
    value={value}
    onValueChange={setValue}
    month={month}
    onMonthChange={setMonth}
    disabled={(date) => date.getFullYear() === 2025 && date.getMonth() === 11 && date.getDate() === 31}
  />;
}
function CalendarWithUnavailableFebruary() {
  const [value, setValue] = useState<Date | null>(new Date(2026, 0, 16));
  const [month, setMonth] = useState(new Date(2026, 0, 1));

  return <Calendar
    value={value}
    onValueChange={setValue}
    month={month}
    onMonthChange={setMonth}
    disabled={() => month.getMonth() === 1}
  />;
}
function CalendarWithDisabledFebruaryFirst() {
  const [value, setValue] = useState<Date | null>(new Date(2026, 2, 1));
  const [month, setMonth] = useState(new Date(2026, 2, 1));

  return <Calendar
    value={value}
    onValueChange={setValue}
    month={month}
    onMonthChange={setMonth}
    weekStartsOn={0}
    disabled={(date) => date.getFullYear() === 2026 && date.getMonth() === 1 && date.getDate() === 1}
  />;
}


describe("Calendar", () => {
  test("moves backward across a disabled previous-month boundary", async () => {
    const user = userEvent.setup();
    render(<CalendarWithDisabledPreviousMonthBoundary />);

    const selectedDay = screen.getByRole("gridcell", { name: /Thursday, January 1, 2026/i });
    selectedDay.focus();
    await user.keyboard("{ArrowLeft}");

    await waitFor(() => expect(screen.getByRole("gridcell", { name: /Tuesday, December 30, 2025/i })).toHaveFocus());
  });

  test("keeps focus in the calendar when backward month navigation has no eligible day", async () => {
    const user = userEvent.setup();
    render(<CalendarWithDisabledFebruaryFirst />);

    const selectedDay = screen.getByRole("gridcell", { name: /Sunday, March 1, 2026/i });
    selectedDay.focus();
    await user.keyboard("{PageUp}");

    await waitFor(() => expect(screen.getByRole("button", { name: "Previous month" })).toHaveFocus());
    expect(document.activeElement).not.toBe(document.body);
  });

  test("keeps keyboard focus on an enabled local day when month navigation targets a disabled day", async () => {
    const user = userEvent.setup();
    render(<ControlledCalendar />);

    const selectedDay = screen.getByRole("gridcell", { name: /Friday, January 16, 2026/i });
    expect(selectedDay).toHaveAttribute("data-calendar-day", "2026-01-16");
    selectedDay.focus();

    await user.keyboard("{PageDown}");

    await waitFor(() => expect(screen.getByRole("gridcell", { name: /Monday, February 2, 2026/i })).toHaveFocus());
    expect(document.activeElement).not.toBe(document.body);
  });

  test("keeps focus in the calendar when the target month has no enabled days", async () => {
    const user = userEvent.setup();
    render(<CalendarWithUnavailableFebruary />);

    const selectedDay = screen.getByRole("gridcell", { name: /Friday, January 16, 2026/i });
    selectedDay.focus();
    await user.keyboard("{PageDown}");

    await waitFor(() => expect(screen.getByRole("button", { name: "Previous month" })).toHaveFocus());
    expect(document.activeElement).not.toBe(document.body);
  });

  test("keeps month-navigation focus in the calendar that received the key event", async () => {
    const user = userEvent.setup();
    render(<><ControlledCalendar /><ControlledCalendar /></>);

    const calendars = screen.getAllByRole("region", { name: "Calendar" });
    const selectedDay = within(calendars[1]).getByRole("gridcell", { name: /Friday, January 16, 2026/i });
    selectedDay.focus();
    await user.keyboard("{PageDown}");

    await waitFor(() => expect(within(calendars[1]).getByRole("gridcell", { name: /Monday, February 2, 2026/i })).toHaveFocus());
  });
});
