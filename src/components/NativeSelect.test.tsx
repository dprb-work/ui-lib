import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";

import { NativeSelect } from "./NativeSelect";

describe("NativeSelect", () => {
  test("preserves native form changes and refs", async () => {
    const onChange = vi.fn();
    const ref = createRef<HTMLSelectElement>();
    render(
      <form>
        <label>
          Review depth
          <NativeSelect ref={ref} name="depth" required defaultValue="focused" onChange={onChange}>
            <option value="focused">Focused</option>
            <option value="complete">Complete</option>
          </NativeSelect>
        </label>
      </form>,
    );

    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Review depth" });
    ref.current?.focus();
    expect(select).toHaveFocus();

    await userEvent.selectOptions(select, "complete");

    expect(select).toHaveValue("complete");
    expect(new FormData(select.form!).get("depth")).toBe("complete");
    expect(onChange).toHaveBeenCalledOnce();
  });

  test("keeps disabled native selects unavailable", async () => {
    const onChange = vi.fn();
    render(
      <label>
        Model
        <NativeSelect disabled defaultValue="astra" onChange={onChange}>
          <option value="luna">Luna</option>
          <option value="astra">Astra</option>
        </NativeSelect>
      </label>,
    );

    const select = screen.getByRole("combobox", { name: "Model" });
    await userEvent.selectOptions(select, "luna");

    expect(select).toBeDisabled();
    expect(select).toHaveValue("astra");
    expect(onChange).not.toHaveBeenCalled();
  });
});
