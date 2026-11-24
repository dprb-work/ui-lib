import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, ChevronUp, FileCode, Image as ImageIcon, LineChart, Table2 } from "lucide-react";
import { useState } from "react";

import { CodeText } from "../chat/content/CodeText";
import { Button } from "./Button";
import { CodeViewport } from "./CodeViewport";
import { ContentBlock } from "./ContentBlock";

const code = Array.from({ length: 30 }, (_, index) => `Record ${index + 1}: a deliberately long line to exercise horizontal and vertical scrolling inside the content viewport.`).join("\n");
const diagram = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='240' viewBox='0 0 480 240'%3E%3Crect width='480' height='240' fill='%23f1f5f4'/%3E%3Crect x='24' y='88' width='112' height='64' rx='8' fill='%230e7490'/%3E%3Crect x='184' y='88' width='112' height='64' rx='8' fill='%23157f5b'/%3E%3Crect x='344' y='88' width='112' height='64' rx='8' fill='%23525f5c'/%3E%3Cpath d='M136 120h48M296 120h48' stroke='%23333' stroke-width='3'/%3E%3Ctext x='240' y='228' font-size='6' text-anchor='middle' fill='%23333'%3ESmall footnote that becomes readable when zoomed%3C/text%3E%3C/svg%3E";
const rows = Array.from({ length: 40 }, (_, index) => ({ run: `run-${index + 1}`, status: index % 5 === 0 ? "failed" : "passed", seconds: 30 + ((index * 17) % 90), host: `runner-${index % 4}.example.internal` }));
const runColumns = [
  { key: "run", label: "Run" },
  { key: "status", label: "Status" },
  { key: "seconds", label: "Seconds" },
  { key: "host", label: "Host" },
] as const;

const meta = {
  title: "Components/ContentBlock",
  component: ContentBlock,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ContentBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Code: Story = {
  args: { label: "Records", title: "records.txt", metadata: ["30 lines"], children: null },
  render: (args) => (
    <ContentBlock
      {...args}
      className="w-full max-w-[32rem]"
      icon={<FileCode aria-hidden="true" />}
      actions={[{ kind: "copy", label: "Copy records", text: code }]}
      expansion="scroll"
    >
      <CodeViewport aria-label="Record contents"><CodeText code={code} /></CodeViewport>
    </ContentBlock>
  ),
};

function ChartContent() {
  const [table, setTable] = useState(false);
  const [sort, setSort] = useState<{ column: "week" | "value"; descending: boolean } | null>(null);
  const points = [4, 9, 6, 14, 11, 18, 22];
  const values = points.map((value, index) => ({ week: index + 1, value }));
  if (sort) values.sort((left, right) => (left[sort.column] - right[sort.column]) * (sort.descending ? -1 : 1));
  return (
    <ContentBlock
      label="Weekly runs"
      title="Weekly runs"
      icon={<LineChart aria-hidden="true" />}
      className="w-full max-w-[32rem]"
      expansion={table ? "scroll" : "zoom"}
      actions={[
        { kind: "button", label: table ? "Show chart" : "Show table", icon: <Table2 aria-hidden="true" />, pressed: table, onSelect: () => setTable((current) => !current) },
        { kind: "copy", label: "Copy CSV", text: points.map((value, index) => `${index + 1},${value}`).join("\n") },
      ]}
    >
      <div className="flex h-56 min-h-0 flex-col in-data-[content-block-viewport=expanded]:h-full">
      {table ? (
        <div className="flex min-h-0 flex-1 overflow-x-auto p-3">
          <table className="ui-content-data-table">
            <thead><tr>{(["week", "value"] as const).map((column) => (
              <th key={column} scope="col" aria-sort={sort?.column === column ? (sort.descending ? "descending" : "ascending") : "none"}>
                <Button variant="ghost" className="h-auto w-full rounded-none border-0 py-2 text-sm text-ui-foreground" onClick={() => setSort({ column, descending: sort?.column === column && !sort.descending })}>
                  {column === "week" ? "Week" : "Runs"}
                  {sort?.column === column && (sort.descending ? <ChevronDown className="absolute right-1" aria-hidden="true" /> : <ChevronUp className="absolute right-1" aria-hidden="true" />)}
                </Button>
              </th>
            ))}</tr></thead>
            <tbody tabIndex={0} aria-label="Weekly runs data">{values.map(({ week, value }) => <tr key={week}><td>Week {week}</td><td>{value}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <svg viewBox="0 0 100 60" role="img" aria-label="Weekly runs chart" className="block h-full w-full p-3">
          <polyline fill="none" className="stroke-ui-accent" strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={points.map((value, index) => `${8 + index * 14},${55 - value * 2}`).join(" ")} />
        </svg>
      )}
      </div>
    </ContentBlock>
  );
}

export const Chart: Story = {
  args: { label: "Weekly runs", children: null },
  render: () => <ChartContent />,
};

export const Image: Story = {
  args: { label: "Pipeline diagram", title: "Pipeline diagram", metadata: ["SVG"], children: null },
  render: (args) => (
    <ContentBlock {...args} className="w-full max-w-[32rem]" icon={<ImageIcon aria-hidden="true" />} expansion="zoom">
      <img src={diagram} alt="Three pipeline stages connected left to right" className="mx-auto block h-auto max-w-full in-data-[content-block-viewport=expanded]:max-h-full in-data-[content-block-viewport=expanded]:object-contain" />
    </ContentBlock>
  ),
};

function RunsTable() {
  const [sort, setSort] = useState<{ column: keyof typeof rows[number]; descending: boolean } | null>(null);
  const sortedRows = sort === null ? rows : [...rows].sort((left, right) => {
    const order = sort.column === "seconds" ? left.seconds - right.seconds : String(left[sort.column]).localeCompare(String(right[sort.column]), undefined, { numeric: true });
    return sort.descending ? -order : order;
  });
  return (
    <div className="flex min-h-0 overflow-x-auto p-2" aria-label="Test runs table">
      <table className="ui-content-data-table min-w-[34rem] [--ui-content-table-columns:6rem_6rem_6rem_minmax(16rem,1fr)]">
        <thead><tr>{runColumns.map(({ key, label }) => (
          <th key={key} scope="col" aria-sort={sort?.column === key ? (sort.descending ? "descending" : "ascending") : "none"}>
            <Button variant="ghost" className="h-auto w-full rounded-none border-0 py-2 text-sm text-ui-foreground" onClick={() => setSort({ column: key, descending: sort?.column === key && !sort.descending })}>
              {label}
              {sort?.column === key && (sort.descending ? <ChevronDown className="absolute right-1" aria-hidden="true" /> : <ChevronUp className="absolute right-1" aria-hidden="true" />)}
            </Button>
          </th>
        ))}</tr></thead>
        <tbody tabIndex={0} aria-label="Test run rows">{sortedRows.map((row) => <tr key={row.run}>{runColumns.map(({ key }) => <td key={key}>{row[key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export const Table: Story = {
  args: { label: "Test runs", title: "Test runs", metadata: ["40 rows"], children: null },
  render: (args) => (
    <ContentBlock {...args} className="w-full max-w-[28rem]" icon={<Table2 aria-hidden="true" />} expansion="scroll">
      <RunsTable />
    </ContentBlock>
  ),
};

export const UntitledShort: Story = {
  args: { label: "Command output", children: null },
  render: (args) => (
    <ContentBlock {...args} className="w-full max-w-[32rem]" actions={[{ kind: "copy", label: "Copy output", text: "ok" }]}>
      <CodeViewport aria-label="Command output"><CodeText code="ok" /></CodeViewport>
    </ContentBlock>
  ),
};
