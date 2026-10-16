"use client";

import * as React from "react";
import styles from "../styles/marker-highlight.module.css";

export type MarkerHighlightEase =
  "power2.out" | "power3.out" | "power4.out" | "expo.out" | "back.out" | "elastic.out" | "sine.inOut" | "circ.out";

export interface MarkerHighlightProps {
  /** Sentence to render */
  text?: string;
  /** Words or phrases inside `text` that get a marker stroke (case-insensitive, first match each) */
  highlight?: string[];
  /** Marker ink color */
  color?: string;
  /** Sentence color (defaults to the theme foreground) */
  textColor?: string;
  /** Marker style: a full highlighter band or a low underline stroke */
  thickness?: "full" | "underline";
  /** Duration of each marker sweep in seconds */
  duration?: number;
  /** Delay between consecutive markers in seconds */
  stagger?: number;
  /** Delay before the first marker sweeps, in seconds */
  delay?: number;
  /** GSAP-style ease name */
  ease?: MarkerHighlightEase;
  /** When the markers sweep in */
  trigger?: "mount" | "inView";
  /** Font size in pixels */
  fontSize?: number;
  /** Element rendered as the root */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const EASES: Record<MarkerHighlightEase, (t: number) => number> = {
  "power2.out": (t) => 1 - Math.pow(1 - t, 3),
  "power3.out": (t) => 1 - Math.pow(1 - t, 4),
  "power4.out": (t) => 1 - Math.pow(1 - t, 5),
  "expo.out": (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  "back.out": (t) => {
    const c = 1.70158;
    const u = t - 1;
    return 1 + (c + 1) * u * u * u + c * u * u;
  },
  "elastic.out": (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  "sine.inOut": (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  "circ.out": (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
};

/** Samples an ease into a CSS linear() timing function (falls back to the CSS default where unsupported). */
const toCssEasing = (name: MarkerHighlightEase) => {
  const fn = EASES[name] ?? EASES["power3.out"];
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) pts.push(String(Math.round(fn(i / 48) * 10000) / 10000));
  return `linear(${pts.join(", ")})`;
};

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

interface Segment {
  text: string;
  mark: number;
  /** Punctuation glued before the marked phrase so it never wraps away from it */
  lead: string;
  /** Punctuation glued after the marked phrase */
  tail: string;
}

function segment(text: string, phrases: string[]): Segment[] {
  const lower = text.toLowerCase();
  const ranges: Array<[number, number]> = [];
  phrases
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((p) => {
      const at = lower.indexOf(p.toLowerCase());
      if (at === -1) return;
      const end = at + p.length;
      if (ranges.some(([s, e]) => at < e && end > s)) return;
      ranges.push([at, end]);
    });
  ranges.sort((a, b) => a[0] - b[0]);
  const out: Segment[] = [];
  let cursor = 0;
  ranges.forEach(([s, e], i) => {
    if (s > cursor) out.push({ text: text.slice(cursor, s), mark: -1, lead: "", tail: "" });
    out.push({ text: text.slice(s, e), mark: i, lead: "", tail: "" });
    cursor = e;
  });
  if (cursor < text.length) out.push({ text: text.slice(cursor), mark: -1, lead: "", tail: "" });
  out.forEach((seg, i) => {
    if (seg.mark === -1) return;
    const prev = out[i - 1];
    const next = out[i + 1];
    if (prev && prev.mark === -1) {
      const m = /\S+$/.exec(prev.text);
      if (m) {
        seg.lead = m[0];
        prev.text = prev.text.slice(0, m.index);
      }
    }
    if (next && next.mark === -1) {
      const m = /^\S+/.exec(next.text);
      if (m) {
        seg.tail = m[0];
        next.text = next.text.slice(m[0].length);
      }
    }
  });
  return out;
}

const DEFAULT_HIGHLIGHT = ["effortless", "intentional", "alive"];

export function MarkerHighlight({
  text = "Great interfaces feel effortless, intentional, and quietly alive.",
  highlight = DEFAULT_HIGHLIGHT,
  color = "#7c3aed",
  textColor,
  thickness = "full",
  duration = 0.7,
  stagger = 0.4,
  delay = 0.25,
  ease = "power3.out",
  trigger = "mount",
  fontSize = 44,
  as = "p",
  className = "",
  style,
}: MarkerHighlightProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const [active, setActive] = React.useState(false);
  const highlightKey = highlight.join("\u0000");
  const segments = React.useMemo(() => segment(text, highlightKey.split("\u0000")), [text, highlightKey]);

  React.useEffect(() => {
    const root = rootRef.current;
    setActive(false);
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(true);
      return;
    }
    let raf = 0;
    const activate = () => {
      // Two frames so the collapsed state is painted before the sweep starts.
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setActive(true));
      });
    };
    let io: IntersectionObserver | null = null;
    if (trigger === "inView" && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            activate();
          }
        },
        { threshold: 0.4 },
      );
      io.observe(root);
    } else {
      activate();
    }
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [trigger, text, highlightKey]);

  const Tag = as;
  const vars = {
    "--mf-mh-size": `${fontSize}px`,
    "--mf-mh-color": color,
    "--mf-mh-duration": `${Math.max(0, duration)}s`,
    "--mf-mh-ease": toCssEasing(ease),
    ...(textColor ? { "--mf-mh-text": textColor } : {}),
    ...style,
  } as React.CSSProperties;

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        rootRef.current = el;
      }}
      className={`${styles.root} ${className}`.trim()}
      data-active={active ? "true" : undefined}
      data-thickness={thickness}
      style={vars}
    >
      {segments.map((seg, i) =>
        seg.mark === -1 ? (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ) : (
          <span key={i} className={styles.nowrap}>
            {seg.lead}
            <mark
              className={styles.mark}
              style={
                {
                  "--mf-mh-delay": `${(delay + seg.mark * stagger).toFixed(3)}s`,
                  "--mf-mh-rot": `${((rand(seg.mark + 3) - 0.5) * 3).toFixed(2)}deg`,
                  "--mf-mh-skew": `${(-4 - rand(seg.mark + 11) * 6).toFixed(2)}deg`,
                } as React.CSSProperties
              }
            >
              <span aria-hidden="true" className={styles.ink} />
              <span className={styles.label}>{seg.text}</span>
            </mark>
            {seg.tail}
          </span>
        ),
      )}
    </Tag>
  );
}
