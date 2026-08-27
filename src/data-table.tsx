import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { useMemo } from "react";

import { cn } from "./cn";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

type SortableRow = { getValue: (columnId: string) => unknown };

export type MatrixDataTableLabels = {
  filter: string;
  filterPlaceholder: string;
  rowsPerPage: string;
  pages: string;
  previous: string;
  next: string;
  empty: (filter: string) => string;
  count: (start: number, end: number, filtered: number, total: number) => string;
};

const defaultLabels: MatrixDataTableLabels = {
  filter: "Filter rows",
  filterPlaceholder: "Type to filter every column",
  rowsPerPage: "Rows per page",
  pages: "Table pages",
  previous: "Previous",
  next: "Next",
  empty: (filter) => `No rows match “${filter}”.`,
  count: (start, end, filtered, total) =>
    `Showing ${start}–${end} of ${filtered} filtered rows${filtered !== total ? ` (${total} total)` : ""}.`,
};

export type MatrixDataTableProps = {
  caption: string;
  headers: readonly string[];
  rows: readonly (readonly string[])[];
  interactive?: boolean;
  pageSizes?: readonly number[];
  initialPageSize?: number;
  labels?: Partial<MatrixDataTableLabels>;
  className?: string;
  toolbarClassName?: string;
  filterClassName?: string;
  filterInputClassName?: string;
  pageSizeClassName?: string;
  scrollClassName?: string;
  tableClassName?: string;
  emptyClassName?: string;
  paginationClassName?: string;
  countClassName?: string;
};

function sortState(value: false | "asc" | "desc"): "none" | "ascending" | "descending" {
  if (value === "asc") return "ascending";
  if (value === "desc") return "descending";
  return "none";
}

export function MatrixDataTable({
  caption,
  headers,
  rows,
  interactive = false,
  pageSizes = [10, 25, 50, 100],
  initialPageSize = 25,
  labels: labelOverrides,
  className,
  toolbarClassName,
  filterClassName,
  filterInputClassName,
  pageSizeClassName,
  scrollClassName,
  tableClassName,
  emptyClassName,
  paginationClassName,
  countClassName,
}: MatrixDataTableProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const columns = useMemo<Array<ColumnDef<typeof features, readonly string[]>>>(
    () =>
      headers.map((header, index) => ({
        id: `column-${index}`,
        accessorFn: (row) => row[index] ?? "",
        header,
        sortingFn: (left: SortableRow, right: SortableRow, columnId: string) =>
          collator.compare(String(left.getValue(columnId)), String(right.getValue(columnId))),
      })),
    [headers],
  );
  const table = useTable({
    features,
    columns,
    data: rows,
    enableFilters: interactive,
    enableGlobalFilter: interactive,
    enableSorting: interactive,
    globalFilterFn: "includesString",
    manualFiltering: !interactive,
    manualPagination: !interactive,
    manualSorting: !interactive,
    initialState: { pagination: { pageIndex: 0, pageSize: initialPageSize } },
  });
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pagination = table.state.pagination;
  const rangeStart = filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const rangeEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredCount);
  const globalFilter = String(table.state.globalFilter ?? "");

  return (
    <div className={className} data-ui-matrix-table>
      {interactive && (
        <div className={cn("flex flex-wrap items-end justify-between gap-3", toolbarClassName)}>
          <label className={cn("grid min-w-56 flex-1 gap-1 text-sm", filterClassName)}>
            <span>{labels.filter}</span>
            <span className={cn("relative flex items-center", filterInputClassName)}>
              <Search className="pointer-events-none absolute left-2.5 size-4 text-slate-500" aria-hidden="true" />
              <input
                className="h-9 w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent dark:border-slate-700 dark:bg-slate-950"
                type="search"
                inputMode="search"
                placeholder={labels.filterPlaceholder}
                value={globalFilter}
                onChange={(event) => table.setGlobalFilter(event.currentTarget.value)}
              />
            </span>
          </label>
          <label className={cn("grid gap-1 text-sm", pageSizeClassName)}>
            <span>{labels.rowsPerPage}</span>
            <select
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent dark:border-slate-700 dark:bg-slate-950"
              value={pagination.pageSize}
              onChange={(event) => table.setPageSize(Number(event.currentTarget.value))}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className={cn("overflow-x-auto", scrollClassName)} tabIndex={0}>
        <table className={cn("w-full border-collapse text-left text-sm", tableClassName)}>
          <caption>{caption}</caption>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const headerText = typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : "";
                  return (
                    <th key={header.id} scope="col" aria-sort={interactive ? sortState(sorted) : undefined}>
                      {interactive ? (
                        <button type="button" onClick={header.column.getToggleSortingHandler()}>
                          <span>{headerText}</span>
                          {sorted === "asc" ? <ArrowUp aria-hidden="true" /> : sorted === "desc" ? <ArrowDown aria-hidden="true" /> : <ChevronsUpDown aria-hidden="true" />}
                        </button>
                      ) : headerText}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell) => <td key={cell.id}>{String(cell.getValue())}</td>)}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr><td colSpan={headers.length} className={emptyClassName}>{labels.empty(globalFilter)}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {interactive && (
        <nav className={cn("flex flex-wrap items-center justify-between gap-3", paginationClassName)} aria-label={labels.pages}>
          <p className={countClassName} aria-live="polite">{labels.count(rangeStart, rangeEnd, filteredCount, rows.length)}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>{labels.previous}</button>
            <span>Page {pagination.pageIndex + 1} of {table.getPageCount()}</span>
            <button type="button" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>{labels.next}</button>
          </div>
        </nav>
      )}
    </div>
  );
}
