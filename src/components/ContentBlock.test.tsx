import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { BarChart3, Pin, RefreshCw, SlidersHorizontal } from "lucide-react";
import { describe, expect, test, vi } from "vitest";

import { ContentBlock, type ContentBlockAction, type ContentBlockProps } from "./ContentBlock";

const content = "Revenue grew 12% quarter over quarter.";

function Block(props: Partial<ContentBlockProps>) {
  return (
    <ContentBlock label="Quarterly revenue" title="Revenue" {...props}>
      <p>{content}</p>
    </ContentBlock>
  );
}

async function expand(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Expand" }));
  return screen.getByRole("dialog", { name: "Quarterly revenue" });
}

describe("ContentBlock container", () => {
  test("renders a region named by label with the caption and the consumer's section props", () => {
    render(<Block id="revenue-block" className="consumer-block" icon={<BarChart3 aria-hidden />} metadata={["Q3 2026"]} />);

    const region = screen.getByRole("region", { name: "Quarterly revenue" });
    expect(region.tagName).toBe("SECTION");
    expect(region).toHaveAttribute("id", "revenue-block");
    expect(region).toHaveClass("consumer-block");
    expect(within(region).getByText("Revenue")).toBeVisible();
    expect(within(region).getByText("Q3 2026")).toBeVisible();
    expect(within(region).getByText(content)).toBeVisible();
  });

  test("button actions call onSelect once and expose pressed and disabled states", async () => {
    const user = userEvent.setup();
    const filter = vi.fn();
    const refresh = vi.fn();
    render(
      <Block
        actions={[
          { kind: "button", label: "Filter", icon: <SlidersHorizontal />, onSelect: filter },
          { kind: "button", label: "Pin", icon: <Pin />, onSelect: () => {}, pressed: true },
          { kind: "button", label: "Refresh", icon: <RefreshCw />, onSelect: refresh, disabled: true },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filter" }));
    expect(filter).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Pin" })).toHaveAttribute("aria-pressed", "true");
    const disabled = screen.getByRole("button", { name: "Refresh" });
    expect(disabled).toBeDisabled();
    await user.click(disabled);
    expect(refresh).not.toHaveBeenCalled();
  });

  test("copy action writes its text to the clipboard and reports Copied", async () => {
    const user = userEvent.setup();
    render(<Block actions={[{ kind: "copy", label: "Copy data", text: "Q3,1.2M" }]} />);

    await user.click(screen.getByRole("button", { name: "Copy data" }));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeVisible();
    await expect(navigator.clipboard.readText()).resolves.toBe("Q3,1.2M");
  });

  test("offers no Expand control without expansion", () => {
    render(<Block actions={[{ kind: "copy", label: "Copy data", text: "Q3" }]} />);
    expect(screen.getByRole("button", { name: "Copy data" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Expand" })).not.toBeInTheDocument();
  });

  test("Expand opens a dialog named by label with Close, the actions, and the only copy of the content", async () => {
    const user = userEvent.setup();
    render(<Block expansion="scroll" actions={[{ kind: "copy", label: "Copy data", text: "Q3" }]} />);

    const dialog = await expand(user);
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeVisible();
    expect(within(dialog).queryByRole("button", { name: "Expand" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Copy data" })).toBeVisible();
    const shown = screen.getAllByText(content);
    expect(shown).toHaveLength(1);
    expect(dialog).toContainElement(shown[0]!);
  });

  test.each([
    ["the Close button", (user: UserEvent) => user.click(screen.getByRole("button", { name: "Close" }))],
    ["one Escape", (user: UserEvent) => user.keyboard("{Escape}")],
  ])("%s closes the dialog and returns focus to Expand", async (_, close) => {
    const user = userEvent.setup();
    render(<Block expansion="zoom" />);

    await expand(user);
    await close(user);
    // Closing may settle asynchronously (history traversal, focus restoration), so wait for the end state.
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Quarterly revenue" })).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Expand" })).toHaveFocus());
  });

  test("expanding pushes one history entry and history.back() closes the dialog on the same page", async () => {
    const user = userEvent.setup();
    // Start from a fresh entry so earlier tests' forward entries cannot affect the count.
    window.history.pushState(null, "", window.location.href);
    const entries = window.history.length;
    const page = window.location.href;
    render(<Block expansion="scroll" />);

    await expand(user);
    expect(window.history.length).toBe(entries + 1);
    window.history.back();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Quarterly revenue" })).not.toBeInTheDocument());
    expect(window.location.href).toBe(page);
    expect(screen.getByRole("region", { name: "Quarterly revenue" })).toHaveTextContent(content);
  });

  test("expanded zoom controls precede the normal actions and Close", async () => {
    const user = userEvent.setup();
    const actions: ContentBlockAction[] = [{ kind: "copy", label: "Copy data", text: "Q3" }];
    const { unmount } = render(<Block expansion="scroll" actions={actions} />);

    const scrollDialog = await expand(user);
    expect(within(scrollDialog).queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
    unmount();

    render(<Block expansion="zoom" actions={actions} />);
    expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
    const dialog = await expand(user);
    const names = ["Zoom in", "Zoom out", "Reset view", "Copy data", "Close"];
    const controls = names.map((name) => within(dialog).getByRole("button", { name }));
    const documentOrder = [...controls]
      .sort((first, second) => (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      .map((control) => names[controls.indexOf(control)]);
    expect(documentOrder).toEqual(names);
    expect(within(dialog).queryByRole("button", { name: "Click to zoom" })).not.toBeInTheDocument();
  });

  test("zoom buttons select mutually exclusive viewport directions without changing the view", async () => {
    const user = userEvent.setup();
    render(<Block expansion="zoom" />);
    const dialog = await expand(user);
    const zoomIn = within(dialog).getByRole("button", { name: "Zoom in" });
    const zoomOut = within(dialog).getByRole("button", { name: "Zoom out" });
    const reset = within(dialog).getByRole("button", { name: "Reset view" });

    expect(reset).toBeDisabled();
    await user.click(zoomIn);
    expect(zoomIn).toHaveAttribute("aria-pressed", "true");
    expect(zoomOut).toHaveAttribute("aria-pressed", "false");
    expect(reset).toBeDisabled();
    await user.click(zoomOut);
    expect(zoomOut).toHaveAttribute("aria-pressed", "true");
    expect(zoomIn).toHaveAttribute("aria-pressed", "false");
    expect(reset).toBeDisabled();
  });
});
