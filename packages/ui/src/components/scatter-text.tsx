"use client";

import * as React from "react";
import styles from "../styles/scatter-text.module.css";

export type ScatterTextEase =
  "power2.out" | "power3.out" | "power4.out" | "expo.out" | "back.out" | "elastic.out" | "sine.inOut" | "circ.out";

export type ScatterTextStaggerFrom = "start" | "center" | "end" | "edges" | "random";

export interface ScatterTextProps {
  /** Text whose letters assemble from scattered positions */
  text?: string;
  /** Maximum scatter distance in pixels */
  spread?: number;
  /** Duration of each letter's flight in seconds */
  duration?: number;
  /** GSAP-style ease name */
  ease?: ScatterTextEase;
  /** Delay between consecutive letters in seconds */
  stagger?: number;
  /** Where the stagger wave starts from */
  staggerFrom?: ScatterTextStaggerFrom;
  /** Scatter the letters again while hovered and reassemble on leave */
  scatterOnHover?: boolean;
  /** Seed for the deterministic scatter layout */
  seed?: number;
  /** Text color (defaults to the theme foreground) */
  color?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Element rendered as the root */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const EASES: Record<ScatterTextEase, (t: number) => number> = {
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
const toCssEasing = (name: ScatterTextEase) => {
  const fn = EASES[name] ?? EASES["expo.out"];
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) pts.push(String(Math.round(fn(i / 48) * 10000) / 10000));
  return `linear(${pts.join(", ")})`;
};

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

function staggerRanks(count: number, from: ScatterTextStaggerFrom): number[] {
  if (count <= 0) return [];
  const mid = (count - 1) / 2;
  if (from === "random") {
    const ranks = new Array<number>(count).fill(0);
    Array.from({ length: count }, (_, i) => i)
      .sort((a, b) => rand(a + 1) - rand(b + 1))
      .forEach((idx, r) => {
        ranks[idx] = r;
      });
    return ranks;
  }
  const raw = Array.from({ length: count }, (_, i) => {
    if (from === "end") return count - 1 - i;
    if (from === "center") return Math.abs(i - mid);
    if (from === "edges") return mid - Math.abs(i - mid);
    return i;
  });
  const min = Math.min(...raw);
  return raw.map((v) => v - min);
}

type Phase = "intro" | "assembled" | "scattered";

export function ScatterText({
  text = "Pieces fall into place",
  spread = 240,
  duration = 1.1,
  ease = "expo.out",
  stagger = 0.025,
  staggerFrom = "center",
  scatterOnHover = true,
  seed = 7,
  color,
  fontSize = 56,
  as = "h2",
  className = "",
  style,
}: ScatterTextProps) {
  const [phase, setPhase] = React.useState<Phase>("intro");
  const reducedRef = React.useRef(false);
  const words = React.useMemo(() => text.split(" "), [text]);
  const charCount = Array.from(text).length;
  const ranks = React.useMemo(() => staggerRanks(charCount, staggerFrom), [charCount, staggerFrom]);
  const wordStarts = React.useMemo(() => {
    let acc = 0;
    return words.map((w) => {
      const start = acc;
      acc += Array.from(w).length + 1;
      return start;
    });
  }, [words]);

  React.useEffect(() => {
    setPhase("intro");
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedRef.current) {
      setPhase("assembled");
      return;
    }
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPhase("assembled"));
    });
    return () => cancelAnimationFrame(raf);
  }, [text, spread, seed, duration, ease, stagger, staggerFrom]);

  const onEnter = () => {
    if (scatterOnHover && !reducedRef.current && phase === "assembled") setPhase("scattered");
  };
  const onLeave = () => {
    if (phase === "scattered") setPhase("assembled");
  };

  const Tag = as;
  const vars = {
    "--mf-sc-size": `${fontSize}px`,
    "--mf-sc-duration": `${Math.max(0, duration)}s`,
    "--mf-sc-ease": toCssEasing(ease),
    ...(color ? { "--mf-sc-color": color } : {}),
    ...style,
  } as React.CSSProperties;

  return (
    <Tag
      className={`${styles.root} ${className}`.trim()}
      data-phase={phase}
      style={vars}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true" className={styles.letters}>
        {words.map((word, wi) => (
          <React.Fragment key={`${word}-${wi}`}>
            <span className={styles.word}>
              {Array.from(word).map((ch, ci) => {
                const i = wordStarts[wi] + ci;
                const s = seed * 131 + i * 7;
                const angle = rand(s) * Math.PI * 2;
                const dist = spread * (0.35 + rand(s + 1) * 0.65);
                return (
                  <span
                    key={i}
                    className={styles.char}
                    style={
                      {
                        "--mf-sc-x": `${(Math.cos(angle) * dist).toFixed(1)}px`,
                        "--mf-sc-y": `${(Math.sin(angle) * dist * 0.6).toFixed(1)}px`,
                        "--mf-sc-r": `${((rand(s + 2) - 0.5) * 300).toFixed(1)}deg`,
                        "--mf-sc-s": (0.4 + rand(s + 3) * 1.1).toFixed(2),
                        "--mf-sc-delay": `${((ranks[i] ?? 0) * stagger).toFixed(3)}s`,
                      } as React.CSSProperties
                    }
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}
