"use client";

import * as React from "react";
import styles from "../styles/rolling-text.module.css";

export type RollingTextEase =
  "power2.out" | "power3.out" | "power4.out" | "expo.out" | "back.out" | "elastic.out" | "sine.inOut" | "circ.out";

export type RollingTextStaggerFrom = "start" | "center" | "end" | "edges" | "random";

export interface RollingTextProps {
  /** Label text; every character rolls up to reveal its duplicate */
  text?: string;
  /** When set, renders an anchor pointing here */
  href?: string;
  /** Anchor target (only used with href) */
  target?: string;
  /** When set (and no href), renders a button that calls this on click */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  /** Delay between consecutive characters in seconds */
  stagger?: number;
  /** Where the stagger wave starts from */
  staggerFrom?: RollingTextStaggerFrom;
  /** Roll duration per character in seconds */
  duration?: number;
  /** GSAP-style ease name */
  ease?: RollingTextEase;
  /** Resting text color (defaults to the theme foreground) */
  color?: string;
  /** Color of the duplicate revealed on hover/focus */
  hoverColor?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Automatically roll back and forth as a demo loop (paused off-screen) */
  autoPlay?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const EASES: Record<RollingTextEase, (t: number) => number> = {
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

/** Samples an ease into a CSS linear() timing function (falls back to `ease` where unsupported). */
const toCssEasing = (name: RollingTextEase) => {
  const fn = EASES[name] ?? EASES["power3.out"];
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) pts.push(String(Math.round(fn(i / 48) * 10000) / 10000));
  return `linear(${pts.join(", ")})`;
};

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

function staggerRanks(count: number, from: RollingTextStaggerFrom): number[] {
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

export function RollingText({
  text = "Explore the work",
  href,
  target,
  onClick,
  stagger = 0.025,
  staggerFrom = "start",
  duration = 0.55,
  ease = "power3.out",
  color,
  hoverColor = "#a78bfa",
  fontSize = 56,
  autoPlay = true,
  className = "",
  style,
}: RollingTextProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const [active, setActive] = React.useState(false);
  const chars = React.useMemo(() => Array.from(text), [text]);
  const ranks = React.useMemo(() => staggerRanks(chars.length, staggerFrom), [chars.length, staggerFrom]);
  const words = React.useMemo(() => text.split(" "), [text]);
  const wordStarts = React.useMemo(() => {
    let acc = 0;
    return words.map((w) => {
      const start = acc;
      acc += Array.from(w).length + 1;
      return start;
    });
  }, [words]);

  React.useEffect(() => {
    const root = rootRef.current;
    setActive(false);
    if (!autoPlay || !root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const period = Math.max(1.4, duration + stagger * chars.length + 0.9) * 1000;
    let timer: ReturnType<typeof setInterval> | null = null;
    const startLoop = () => {
      if (timer) return;
      timer = setInterval(() => setActive((a) => !a), period);
    };
    const stopLoop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) startLoop();
        else stopLoop();
      });
      io.observe(root);
    } else {
      startLoop();
    }
    const kick = setTimeout(() => setActive(true), 450);
    return () => {
      clearTimeout(kick);
      stopLoop();
      io?.disconnect();
    };
  }, [autoPlay, duration, stagger, chars.length]);

  const vars = {
    "--mf-rt-size": `${fontSize}px`,
    "--mf-rt-hover": hoverColor,
    "--mf-rt-duration": `${Math.max(0, duration)}s`,
    "--mf-rt-ease": toCssEasing(ease),
    ...(color ? { "--mf-rt-color": color } : {}),
    ...style,
  } as React.CSSProperties;

  const visual = (
    <span aria-hidden="true" className={styles.visual}>
      {words.map((word, wi) => (
        <React.Fragment key={`${word}-${wi}`}>
          <span className={styles.word}>
            {Array.from(word).map((ch, ci) => {
              const i = wordStarts[wi] + ci;
              return (
                <span
                  key={i}
                  className={styles.char}
                  style={{ "--mf-rt-delay": `${((ranks[i] ?? 0) * stagger).toFixed(3)}s` } as React.CSSProperties}
                >
                  <span className={styles.track}>
                    <span className={styles.face}>{ch}</span>
                    <span className={`${styles.face} ${styles.dup}`}>{ch}</span>
                  </span>
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  );

  const common = {
    className: `${styles.root} ${className}`.trim(),
    style: vars,
    "data-active": active ? "true" : undefined,
  };
  const content = (
    <>
      <span className={styles.srOnly}>{text}</span>
      {visual}
    </>
  );

  if (href) {
    return (
      <a
        {...common}
        ref={(el) => {
          rootRef.current = el;
        }}
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        {...common}
        ref={(el) => {
          rootRef.current = el;
        }}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
  return (
    <span
      {...common}
      ref={(el) => {
        rootRef.current = el;
      }}
    >
      {content}
    </span>
  );
}
