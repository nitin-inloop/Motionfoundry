"use client";

import * as React from "react";
import styles from "../styles/mask-wipe-text.module.css";

export type MaskWipeTextEase =
  "power2.out" | "power3.out" | "power4.out" | "expo.out" | "back.out" | "elastic.out" | "sine.inOut" | "circ.out";

export interface MaskWipeTextProps {
  /** Headline lines, each wiped in from behind its own mask */
  lines?: string[];
  /** Direction the text travels as it is revealed */
  direction?: "up" | "down" | "left" | "right";
  /** Show a colored bar that sweeps across each line before the text appears */
  showBar?: boolean;
  /** Color of the sweeping wipe bar */
  wipeColor?: string;
  /** GSAP-style ease name */
  ease?: MaskWipeTextEase;
  /** Duration of each line's reveal in seconds */
  duration?: number;
  /** Delay between consecutive lines in seconds */
  stagger?: number;
  /** Delay before the first line starts, in seconds */
  delay?: number;
  /** When the animation plays */
  trigger?: "mount" | "inView";
  /** Horizontal alignment of the lines */
  align?: "left" | "center";
  /** Element rendered as the root */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  /** Font size in pixels */
  fontSize?: number;
  /** Text color (defaults to the theme foreground) */
  color?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const EASES: Record<MaskWipeTextEase, (t: number) => number> = {
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

/** Smooth in-out used for the bar sweep so it reads as one deliberate stroke. */
const barEase = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const DEFAULT_LINES = ["Design in motion,", "built to be felt,", "not just seen."];

export function MaskWipeText({
  lines = DEFAULT_LINES,
  direction = "up",
  showBar = true,
  wipeColor = "#a78bfa",
  ease = "power4.out",
  duration = 0.8,
  stagger = 0.18,
  delay = 0.1,
  trigger = "mount",
  align = "center",
  as = "h2",
  fontSize = 56,
  color,
  className = "",
  style,
}: MaskWipeTextProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const cleanLines = lines.map((l) => l.trim()).filter(Boolean);
  const linesKey = cleanLines.join("\n");
  const horizontal = direction === "left" || direction === "right";
  const barFromRight = direction === "left";

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const texts = Array.from(root.querySelectorAll<HTMLElement>("[data-mf-mw-text]"));
    const bars = Array.from(root.querySelectorAll<HTMLElement>("[data-mf-mw-bar]"));
    const easeFn = EASES[ease] ?? EASES["power4.out"];
    const dur = Math.max(0.05, duration);
    const barDur = dur * 0.55;

    const setText = (el: HTMLElement, p: number | null) => {
      if (p === null) {
        el.style.transform = "";
        el.style.clipPath = "";
        el.style.opacity = "";
        return;
      }
      const inv = 1 - p;
      if (direction === "up") el.style.transform = `translate3d(0, ${(inv * 110).toFixed(2)}%, 0)`;
      else if (direction === "down") el.style.transform = `translate3d(0, ${(-inv * 110).toFixed(2)}%, 0)`;
      else {
        const shift = (direction === "right" ? -1 : 1) * inv * 0.4;
        const hidden = (clamp01(inv) * 100).toFixed(2);
        el.style.transform = `translate3d(${shift.toFixed(3)}em, 0, 0)`;
        el.style.clipPath = direction === "right" ? `inset(-10% ${hidden}% -10% 0)` : `inset(-10% 0 -10% ${hidden}%)`;
      }
      el.style.opacity = horizontal ? "1" : String(0.2 + 0.8 * clamp01(p * 1.5));
    };

    const setBar = (el: HTMLElement, phase: "idle" | "in" | "out", p: number) => {
      if (phase === "idle") {
        el.style.transform = "scaleX(0)";
        return;
      }
      el.style.transformOrigin =
        phase === "in" ? (barFromRight ? "100% 50%" : "0% 50%") : barFromRight ? "0% 50%" : "100% 50%";
      el.style.transform = `scaleX(${(phase === "in" ? p : 1 - p).toFixed(4)})`;
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      texts.forEach((el) => setText(el, null));
      bars.forEach((el) => setBar(el, "idle", 0));
      return;
    }

    texts.forEach((el) => setText(el, 0));
    bars.forEach((el) => setBar(el, "idle", 0));

    let raf = 0;
    const play = () => {
      const start = performance.now();
      const done = texts.map(() => false);
      const tick = (now: number) => {
        const t = (now - start) / 1000;
        let active = false;
        texts.forEach((el, i) => {
          if (done[i]) return;
          const lineStart = delay + i * stagger;
          const textStart = lineStart + (showBar ? barDur : 0);
          const bar = bars[i];
          if (showBar && bar) {
            const b = (t - lineStart) / barDur;
            if (b < 0) setBar(bar, "idle", 0);
            else if (b < 1) setBar(bar, "in", barEase(b));
            else if (b < 2) setBar(bar, "out", barEase(b - 1));
            else setBar(bar, "idle", 0);
          }
          const local = (t - textStart) / dur;
          if (local >= 1 && (!showBar || t - lineStart >= barDur * 2)) {
            done[i] = true;
            setText(el, null);
            if (bar) setBar(bar, "idle", 0);
            return;
          }
          active = true;
          setText(el, local <= 0 ? 0 : local >= 1 ? 1 : easeFn(local));
        });
        if (active) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    let io: IntersectionObserver | null = null;
    if (trigger === "inView" && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            play();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(root);
    } else {
      play();
    }

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      texts.forEach((el) => setText(el, null));
      bars.forEach((el) => setBar(el, "idle", 0));
    };
  }, [linesKey, direction, showBar, ease, duration, stagger, delay, trigger, horizontal, barFromRight]);

  const Tag = as;
  const vars = {
    "--mf-mw-size": `${fontSize}px`,
    "--mf-mw-wipe": wipeColor,
    ...(color ? { "--mf-mw-color": color } : {}),
    ...style,
  } as React.CSSProperties;

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        rootRef.current = el;
      }}
      className={`${styles.root} ${className}`.trim()}
      data-align={align}
      style={vars}
    >
      <span className={styles.srOnly}>{cleanLines.join(" ")}</span>
      {cleanLines.map((line, i) => (
        <span key={`${line}-${i}`} aria-hidden="true" className={styles.line}>
          <span className={styles.text} data-mf-mw-text="">
            {line}
          </span>
          {showBar ? <span className={styles.bar} data-mf-mw-bar="" /> : null}
        </span>
      ))}
    </Tag>
  );
}
