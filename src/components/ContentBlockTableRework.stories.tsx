import { composeStory, type Meta, type StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import catalogMeta, { Table } from "./ContentBlock.stories";

const CatalogTable = composeStory(Table, catalogMeta);
const meta = {
  title: "Components/ContentBlock/Table rework contract",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
  globals: { theme: "light" },
  render: () => <CatalogTable />,
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function visibleBorder(element: Element, edge: "Top" | "Bottom" | "Left" | "Right") {
  const style = getComputedStyle(element);
  return parseFloat(style[`border${edge}Width`]) > 0
    && !["none", "hidden"].includes(style[`border${edge}Style`])
    && style[`border${edge}Color`] !== "transparent"
    && !style[`border${edge}Color`].endsWith(", 0)");
}

function paints(element: Element): string[] {
  return [element, ...element.querySelectorAll("*")].map((child) => getComputedStyle(child).backgroundColor);
}

export const SortUsesOnlyTheActiveHeaderChevron: Story = {
  play: async ({ canvasElement }) => {
    const query = within(canvasElement);
    const header = query.getByRole("columnheader", { name: "Seconds" });
    const values = () => query.getAllByRole("row").slice(1).map((row) => Number(within(row).getAllByRole("cell")[2]!.textContent));
    const original = values();
    await userEvent.click(within(header).getByRole("button", { name: "Seconds" }));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(values(), "sorting is numeric, not lexical").toEqual([...original].sort((left, right) => left - right));
    for (const candidate of query.getAllByRole("columnheader")) {
      expect(candidate.querySelectorAll("svg").length, "only the sorted header shows a chevron").toBe(candidate === header ? 1 : 0);
    }
    await userEvent.click(within(header).getByRole("button", { name: "Seconds" }));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(values()).toEqual([...original].sort((left, right) => right - left));
    const status = query.getByRole("columnheader", { name: "Status" });
    await userEvent.click(within(status).getByRole("button", { name: "Status" }));
    expect(status).toHaveAttribute("aria-sort", "ascending");
    expect(status.querySelectorAll("svg")).toHaveLength(1);
    expect(header.querySelectorAll("svg")).toHaveLength(0);
  },
};

export const ZebraAndColumnRulesReplaceRowRules: Story = {
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole("row").slice(1);
    const first = rows[0]!;
    const second = rows[1]!;
    expect(paints(first), "neighboring rows have distinct zebra backgrounds").not.toEqual(paints(second));
    expect(paints(first), "the zebra pattern repeats on alternate rows").toEqual(paints(rows[2]!));
    for (const row of rows.slice(0, 3)) {
      const cells = within(row).getAllByRole("cell");
      for (const cell of [row, ...cells]) {
        expect(visibleBorder(cell, "Top") || visibleBorder(cell, "Bottom"), "zebra rows have no horizontal separators").toBe(false);
      }
      for (let index = 1; index < cells.length; index += 1) {
        expect(visibleBorder(cells[index - 1]!, "Right") || visibleBorder(cells[index]!, "Left"), "adjacent columns have a visible separator").toBe(true);
      }
    }
  },
};

export const RowsAndHeadersHaveHoverFeedback: Story = {
  play: async ({ canvasElement }) => {
    const query = within(canvasElement);
    const row = query.getAllByRole("row")[1]!;
    const header = query.getAllByRole("columnheader")[0]!;
    // Use the browser runner's real pointer so :hover, not synthetic events, is observed.
    const { page } = await import("@vitest/browser/context");
    await page.elementLocator(query.getByRole("button", { name: "Expand" })).hover();
    const restingRow = paints(row);
    const restingHeader = paints(header);
    await page.elementLocator(row).hover();
    expect(paints(row), "row hover changes its painted background").not.toEqual(restingRow);
    await page.elementLocator(header).hover();
    expect(paints(header), "header hover changes its painted background").not.toEqual(restingHeader);
  },
};
