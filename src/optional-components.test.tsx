import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { DistributionChart } from "./charts";
import { MatrixDataTable } from "./data-table";

describe("optional components", () => {
  test("matrix table filters, sorts, and paginates string data", async () => {
    const rows = Array.from({ length: 30 }, (_, index) => [
      index === 29 ? "Needle" : `Row ${index + 1}`,
      String(30 - index),
    ]);
    render(<MatrixDataTable caption="Items" headers={["Name", "Score"]} rows={rows} interactive />);

    expect(screen.getByText("Showing 1–25 of 30 filtered rows.")).toBeVisible();
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter rows" }), "Needle");
    expect(screen.getByText("Needle")).toBeVisible();
    expect(screen.getByText("Showing 1–1 of 1 filtered rows (30 total).")).toBeVisible();
  });

  test("non-canvas distribution views expose an optional accessible name", () => {
    const { container, rerender } = render(
      <DistributionChart
        view="box"
        records={[{ label: "a", value: 1 }, { label: "b", value: 2 }, { label: "c", value: 3 }]}
        min={1}
        max={3}
        yLabel="Duration"
        unit="ms"
        ariaLabel="Duration distribution"
      />,
    );

    expect(screen.getByRole("img", { name: "Duration distribution" })).toBeVisible();
    expect(container.querySelector(".box-whisker")).toBeInTheDocument();
    expect(container.querySelector(".box-body")).toBeInTheDocument();
    expect(container.querySelector(".box-median")).toBeInTheDocument();
    expect(screen.getByText("Median 2.000 ms")).toBeVisible();

    rerender(
      <DistributionChart
        view="violin"
        records={[{ label: "a", value: 1 }, { label: "b", value: 2 }, { label: "c", value: 3 }]}
        min={1}
        max={3}
        yLabel="Duration"
        unit="ms"
        ariaLabel="Duration distribution"
      />,
    );
    expect(container.querySelector(".violin-axis")).toBeInTheDocument();
    expect(container.querySelector(".violin-body")).toBeInTheDocument();
  });
});
