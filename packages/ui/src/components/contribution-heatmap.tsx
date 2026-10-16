"use client";

import * as React from "react";
import styles from "../styles/contribution-heatmap.module.css";

export interface ContributionHeatmapProps {
  /** Explicit daily counts, oldest first, ending on `endDate` (overrides the generated demo data) */
  data?: number[];
  /** Number of week columns to show */
  weeks?: number;
  /** Last day of the calendar as YYYY-MM-DD */
  endDate?: string;
  /** Seed for the deterministic demo data */
  seed?: number;
  /** Base color; the four active levels are mixed from it */
  accentColor?: string;
  /** Noun used in the header and tooltip */
  unit?: string;
  /** Cell size in px */
  cellSize?: number;
  /** Gap between cells in px */
  cellGap?: number;
  /** Cell corner radius in px */
  cellRadius?: number;
  /** Show month and weekday labels */
  showLabels?: boolean;
  /** Show the Less/More legend */
  showLegend?: boolean;
  /** Per-diagonal delay of the cell reveal in ms */
  stagger?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 86400000;

function rand(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function parseDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : Date.UTC(2026, 9, 16);
}

const fmtDate = (t: number) => {
  const d = new Date(t);
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

interface Cell {
  t: number;
  count: number;
  level: number;
  col: number;
  row: number;
}

export function ContributionHeatmap({
  data,
  weeks = 40,
  endDate = "2026-10-16",
  seed = 7,
  accentColor = "#6366f1",
  unit = "contributions",
  cellSize = 12,
  cellGap = 3,
  cellRadius = 3,
  showLabels = true,
  showLegend = true,
  stagger = 12,
  className = "",
  style,
}: ContributionHeatmapProps) {
  const [active, setActive] = React.useState<number | null>(null);
  const [kbd, setKbd] = React.useState(false);
  const cols = Math.max(1, Math.min(60, Math.round(weeks)));

  const { cells, total, monthLabels } = React.useMemo(() => {
    const end = parseDate(endDate);
    const endRow = new Date(end).getUTCDay();
    const start = end - ((cols - 1) * 7 + endRow) * DAY_MS;
    const days = (cols - 1) * 7 + endRow + 1;
    const raw: number[] = [];
    for (let i = 0; i < days; i++) {
      if (data) {
        raw.push(Math.max(0, data[data.length - days + i] ?? 0));
        continue;
      }
      const dow = new Date(start + i * DAY_MS).getUTCDay();
      const weekend = dow === 0 || dow === 6;
      const r = rand(i * 1.37 + seed * 101.3);
      const burst = rand(Math.floor(i / 9) + seed * 7.1) > 0.7 ? 1.8 : 1;
      const base = (weekend ? 0.35 : 1) * (0.6 + (i / days) * 0.8) * burst;
      raw.push(r < (weekend ? 0.55 : 0.18) ? 0 : Math.round(r * 9 * base));
    }
    const max = Math.max(1, ...raw);
    const out: Cell[] = raw.map((count, i) => ({
      t: start + i * DAY_MS,
      count,
      level: count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)),
      col: Math.floor(i / 7),
      row: i % 7,
    }));
    const labels: Array<{ col: number; text: string }> = [];
    let prev = -1;
    for (let c = 0; c < cols; c++) {
      const mo = new Date(start + c * 7 * DAY_MS).getUTCMonth();
      if (mo !== prev && (labels.length === 0 || c - labels[labels.length - 1].col > 2)) labels.push({ col: c, text: MONTHS[mo] });
      prev = mo;
    }
    return { cells: out, total: raw.reduce((a, b) => a + b, 0), monthLabels: labels };
  }, [data, cols, endDate, seed]);

  const step = cellSize + cellGap;
  const label = (c: Cell) => `${c.count === 0 ? "No" : c.count} ${unit} on ${fmtDate(c.t)}`;
  const cur = active !== null ? cells[active] : null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = active ?? cells.length - 1;
    const moves: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    let next = -1;
    if (e.key in moves) next = i + moves[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = cells.length - 1;
    else if (e.key === "Escape") return setActive(null);
    else return;
    e.preventDefault();
    if (next < 0 || next >= cells.length) return;
    setKbd(true);
    setActive(next);
  };

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      style={
        {
          "--mf-ch-accent": accentColor,
          "--mf-ch-size": `${cellSize}px`,
          "--mf-ch-gap": `${cellGap}px`,
          "--mf-ch-radius": `${cellRadius}px`,
          ...style,
        } as React.CSSProperties
      }
    >
      <div className={styles.header}>
        <span className={styles.total}>
          {total.toLocaleString("en-US")} {unit}
        </span>
        <span className={styles.range}>in the last {cols} weeks</span>
      </div>
      <div className={styles.scroller}>
        <div className={styles.layout} data-labels={showLabels ? "" : undefined}>
          {showLabels && (
            <div className={styles.months} aria-hidden="true">
              {monthLabels.map((m) => (
                <span key={`${m.col}-${m.text}`} style={{ left: m.col * step }}>
                  {m.text}
                </span>
              ))}
            </div>
          )}
          {showLabels && (
            <div className={styles.days} aria-hidden="true">
              {DAYS.map((d, i) => (
                <span key={d}>{i % 2 === 1 ? d : ""}</span>
              ))}
            </div>
          )}
          <div
            className={styles.grid}
            tabIndex={0}
            role="img"
            aria-label={`${total.toLocaleString("en-US")} ${unit} over ${cols} weeks ending ${fmtDate(parseDate(endDate))}. Use arrow keys to read individual days.`}
            onKeyDown={onKeyDown}
            onBlur={() => kbd && setActive(null)}
            onPointerLeave={() => setActive(null)}
          >
            {cells.map((c, i) => (
              <span
                key={c.t}
                className={styles.cell}
                data-level={c.level}
                data-active={active === i ? "" : undefined}
                style={{ gridColumn: c.col + 1, gridRow: c.row + 1, animationDelay: `${(c.col + c.row) * stagger}ms` } as React.CSSProperties}
                onPointerEnter={() => {
                  setKbd(false);
                  setActive(i);
                }}
              />
            ))}
            {cur && (
              <div
                className={styles.tooltip}
                aria-hidden="true"
                style={{ left: cur.col * step + cellSize / 2, top: cur.row * step }}
                data-flip={cur.col < 6 ? "start" : cur.col > cols - 7 ? "end" : undefined}
                data-below={cur.row < 3 ? "" : undefined}
              >
                <strong>{cur.count === 0 ? "No" : cur.count} {unit}</strong> on {fmtDate(cur.t)}
              </div>
            )}
          </div>
        </div>
      </div>
      {showLegend && (
        <div className={styles.legend} aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={styles.swatch} data-level={l} />
          ))}
          <span>More</span>
        </div>
      )}
      <span className={styles.srOnly} aria-live="polite">
        {kbd && cur ? label(cur) : ""}
      </span>
    </div>
  );
}
