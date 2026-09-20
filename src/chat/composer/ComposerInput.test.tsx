import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";

import { ComposerInput } from "./ComposerInput";

describe("ComposerInput", () => {
  test("replaces the active command completion without submitting the draft", async () => {
    const onSubmit = vi.fn();

    function Example() {
      const [value, setValue] = useState("");
      return (
        <ComposerInput
          value={value}
          onValueChange={setValue}
          onSubmit={onSubmit}
          commands={[{ name: "review", description: "Review the change" }]}
          skills={[]}
        />
      );
    }

    render(<Example />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "/rev");
    await userEvent.keyboard("{Tab}");

    expect(input).toHaveValue("/review");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("submits with Enter but keeps Shift+Enter available for a newline", async () => {
    const onSubmit = vi.fn();

    function Example() {
      const [value, setValue] = useState("");
      return (
        <ComposerInput
          value={value}
          onValueChange={setValue}
          onSubmit={onSubmit}
          commands={[]}
          skills={[]}
        />
      );
    }

    render(<Example />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "First");
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}Second");
    await userEvent.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("First\nSecond");
  });
});
