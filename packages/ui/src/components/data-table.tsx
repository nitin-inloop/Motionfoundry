"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/data-table.module.css";

export type DataTableRow = { id: string } & Record<string, string | number>;

export interface DataTableColumn {
  /** Row field rendered in this column */
  key: string;
  /** Header text */
  header: string;
  /** Cell rendering: plain text, number, USD currency or a colored status pill */
  type?: "text" | "number" | "currency" | "status";
  /** Optional second field shown as a muted line under the value */
  subKey?: string;
  /** Allow sorting by this column (default true) */
  sortable?: boolean;
}

export interface DataTableProps {
  /** Column definitions */
  columns?: DataTableColumn[];
  /** Row data (each row needs a unique `id`) */
  rows?: DataTableRow[];
  /** Rows per page */
  pageSize?: number;
  /** Show row selection checkboxes with a select-all header checkbox */
  selectable?: boolean;
  /** Alternate row backgrounds */
  striped?: boolean;
  /** Compact row height */
  dense?: boolean;
  /** Accent color for checkboxes, sort indicator and selected rows */
  accentColor?: string;
  /** Table caption / accessible name */
  caption?: string;
  /** Show the caption visibly above the table */
  showCaption?: boolean;
  /** Called with the selected row ids */
  onSelectionChange?: (ids: string[]) => void;
  /** Called when the sort changes (direction null = unsorted) */
  onSortChange?: (key: string | null, direction: "ascending" | "descending" | null) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_COLUMNS: DataTableColumn[] = [
  { key: "name", header: "Customer", subKey: "email" },
  { key: "status", header: "Status", type: "status" },
  { key: "plan", header: "Plan" },
  { key: "amount", header: "Amount", type: "currency" },
];

const D: Array<[string, string, string, string, number]> = [
  ["Olivia Martin", "olivia@acme.io", "Active", "Pro", 1999],
  ["Jackson Lee", "jackson@northwind.co", "Invited", "Starter", 39],
  ["Isabella Nguyen", "isabella@globex.com", "Active", "Team", 299],
  ["William Kim", "will@initech.dev", "Suspended", "Pro", 99],
  ["Sofia Davis", "sofia@umbrella.org", "Active", "Enterprise", 4250],
  ["Lucas Moreau", "lucas@hooli.xyz", "Active", "Team", 450],
  ["Amara Singh", "amara@stark.ind", "Invited", "Pro", 189],
  ["Mateo Rossi", "mateo@wayne.co", "Active", "Starter", 29],
  ["Hana Suzuki", "hana@cyberdyne.ai", "Suspended", "Team", 720],
  ["Noah Fischer", "noah@vandelay.com", "Active", "Enterprise", 3180],
  ["Chloe Dubois", "chloe@pied.pi", "Active", "Pro", 249],
  ["Elijah Brown", "elijah@soylent.co", "Invited", "Starter", 59],
];
const DEFAULT_ROWS: DataTableRow[] = D.map(([name, email, status, plan, amount], i) => ({ id: `r${i + 1}`, name, email, status, plan, amount }));

const fmtCell = (v: string | number | undefined, type: DataTableColumn["type"]) => {
  if (v === undefined) return "";
  if (type === "currency" && typeof v === "number") return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (type === "number" && typeof v === "number") return v.toLocaleString("en-US");
  return String(v);
};

export function DataTable({
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  pageSize = 5,
  selectable = true,
  striped = false,
  dense = false,
  accentColor = "#6366f1",
  caption = "Recent customers",
  showCaption = true,
  onSelectionChange,
  onSortChange,
  className = "",
  style,
}: DataTableProps) {
  const reduce = useReducedMotion();
  const [sort, setSort] = React.useState<{ key: string; dir: "ascending" | "descending" } | null>(null);
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set(rows[2] ? [rows[2].id] : []));
  const allRef = React.useRef<HTMLInputElement>(null);
  const size = Math.max(1, Math.floor(pageSize));

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const m = sort.dir === "ascending" ? 1 : -1;
    return rows
      .map((r, i) => [r, i] as const)
      .sort(([a, ia], [b, ib]) => {
        const x = a[sort.key];
        const y = b[sort.key];
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
        return c * m || ia - ib;
      })
      .map(([r]) => r);
  }, [rows, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pages - 1);
  const pageRows = sorted.slice(current * size, current * size + size);
  const pageSelected = pageRows.filter((r) => selected.has(r.id)).length;
  const allOnPage = pageRows.length > 0 && pageSelected === pageRows.length;

  React.useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = pageSelected > 0 && !allOnPage;
  }, [pageSelected, allOnPage]);

  const commit = (next: Set<string>) => {
    setSelected(next);
    onSelectionChange?.([...next]);
  };
  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    commit(next);
  };
  const toggleAll = () => {
    const next = new Set(selected);
    pageRows.forEach((r) => (allOnPage ? next.delete(r.id) : next.add(r.id)));
    commit(next);
  };
  const cycleSort = (key: string) => {
    const next = sort?.key !== key ? { key, dir: "ascending" as const } : sort.dir === "ascending" ? { key, dir: "descending" as const } : null;
    setSort(next);
    onSortChange?.(next ? next.key : null, next ? next.dir : null);
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 42, mass: 0.8 };

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-dense={dense ? "" : undefined}
      data-striped={striped ? "" : undefined}
      style={{ "--mf-dt-accent": accentColor, ...style } as React.CSSProperties}
    >
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className={showCaption ? styles.caption : styles.srOnly}>{caption}</caption>
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className={styles.check}>
                  <input ref={allRef} type="checkbox" className={styles.box} aria-label="Select all rows on this page" checked={allOnPage} onChange={toggleAll} />
                </th>
              )}
              {columns.map((col) => {
                const dir = sort?.key === col.key ? sort.dir : undefined;
                const right = col.type === "currency" || col.type === "number";
                return (
                  <th key={col.key} scope="col" aria-sort={col.sortable === false ? undefined : dir ?? "none"} data-align={right ? "right" : undefined}>
                    {col.sortable === false ? (
                      col.header
                    ) : (
                      <button type="button" className={styles.sortBtn} onClick={() => cycleSort(col.key)} data-active={dir ? "" : undefined}>
                        {col.header}
                        <svg aria-hidden="true" className={styles.sortIcon} data-dir={dir} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                          <path className={styles.up} d="m8 10 4-4 4 4" />
                          <path className={styles.down} d="m8 14 4 4 4-4" />
                        </svg>
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const isSel = selected.has(row.id);
              return (
                <motion.tr
                  key={row.id}
                  layout="position"
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, opacity: { duration: reduce ? 0 : 0.2, delay: reduce ? 0 : i * 0.03 } }}
                  className={styles.row}
                  data-state={isSel ? "selected" : undefined}
                >
                  {selectable && (
                    <td className={styles.check}>
                      <input type="checkbox" className={styles.box} aria-label={`Select ${String(row[columns[0]?.key ?? "id"] ?? row.id)}`} checked={isSel} onChange={() => toggleRow(row.id)} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} data-align={col.type === "currency" || col.type === "number" ? "right" : undefined}>
                      {col.type === "status" ? (
                        <span className={styles.status} data-status={String(row[col.key] ?? "").toLowerCase()}>
                          {fmtCell(row[col.key], col.type)}
                        </span>
                      ) : (
                        <span className={styles.primary}>{fmtCell(row[col.key], col.type)}</span>
                      )}
                      {col.subKey && <span className={styles.secondary}>{fmtCell(row[col.subKey], "text")}</span>}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.footer}>
        <span className={styles.count} aria-live="polite">
          {selectable ? `${selected.size} of ${rows.length} row(s) selected` : `${rows.length} rows`}
        </span>
        <nav className={styles.pager} aria-label="Pagination">
          <span className={styles.pageInfo}>
            Page {current + 1} of {pages}
          </span>
          <button type="button" className={styles.pageBtn} aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button type="button" className={styles.pageBtn} aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}
