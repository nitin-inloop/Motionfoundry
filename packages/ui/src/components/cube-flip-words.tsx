"use client";

import * as React from "react";
import styles from "../styles/cube-flip-words.module.css";

export type CubeFlipWordsEase =
  "power2.out" | "power3.out" | "power4.out" | "expo.out" | "back.out" | "elastic.out" | "sine.inOut" | "circ.out";

export interface CubeFlipWordsProps {
  /** Static text shown before the rotating word */
  prefix?: string;
  /** Words cycled on the faces of the cube */
  words?: string[];
  /** Pause between flips in seconds */
  interval?: number;
  /** Duration of each flip in seconds */
  duration?: number;
  /** GSAP-style ease name */
  ease?: CubeFlipWordsEase;
  /** Direction the cube rolls: "up" brings the next word from below */
  direction?: "up" | "down";
  /** Color of the rotating word */
  accentColor?: string;
  /** Prefix color (defaults to the theme foreground) */
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

const EASES: Record<CubeFlipWordsEase, (t: number) => number> = {
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

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const DEFAULT_WORDS = ["alive", "fluid", "inevitable", "human"];

const DEPTH = "0.6em";

export function CubeFlipWords({
  prefix = "Interfaces that feel",
  words = DEFAULT_WORDS,
  interval = 1.8,
  duration = 0.8,
  ease = "back.out",
  direction = "up",
  accentColor = "#a78bfa",
  color,
  fontSize = 56,
  as = "h2",
  className = "",
  style,
}: CubeFlipWordsProps) {
  const list = React.useMemo(() => {
    const clean = words.map((w) => w.trim()).filter(Boolean);
    return clean.length ? clean : ["motion"];
  }, [words]);
  const listKey = list.join("\u0000");
  const [index, setIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLElement | null>(null);
  const cubeRef = React.useRef<HTMLSpanElement | null>(null);
  const frontRef = React.useRef<HTMLSpanElement | null>(null);
  const nextRef = React.useRef<HTMLSpanElement | null>(null);
  const sign = direction === "down" ? -1 : 1;

  const pose = React.useCallback(
    (p: number) => {
      const cube = cubeRef.current;
      if (!cube) return;
      cube.style.transform = `translateZ(-${DEPTH}) rotateX(${(sign * 90 * p).toFixed(3)}deg)`;
      const q = Math.min(1, Math.max(0, p));
      if (frontRef.current) frontRef.current.style.opacity = (1 - 0.75 * q).toFixed(3);
      if (nextRef.current) nextRef.current.style.opacity = (0.25 + 0.75 * q).toFixed(3);
    },
    [sign],
  );

  // After each committed word swap, snap the cube back to its resting pose before paint.
  useIsoLayoutEffect(() => {
    pose(0);
  }, [index, pose, listKey]);

  React.useEffect(() => {
    setIndex(0);
    const root = rootRef.current;
    if (!root || list.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const easeFn = EASES[ease] ?? EASES["back.out"];
    const dur = Math.max(0.05, duration) * 1000;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inView = true;
    let waiting = false;

    const canRun = () => inView && !document.hidden;

    const flip = () => {
      timer = null;
      if (!canRun()) {
        waiting = true;
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        pose(t >= 1 ? 1 : easeFn(t));
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = 0;
          setIndex((i) => (i + 1) % list.length);
          schedule();
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const schedule = () => {
      timer = setTimeout(flip, Math.max(0.2, interval) * 1000);
    };

    const resume = () => {
      if (waiting && canRun()) {
        waiting = false;
        schedule();
      }
    };

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => {
        inView = entries.some((e) => e.isIntersecting);
        resume();
      });
      io.observe(root);
    }
    document.addEventListener("visibilitychange", resume);
    schedule();

    return () => {
      if (timer) clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [listKey, interval, duration, ease, pose, list.length]);

  const current = list[index % list.length];
  const upcoming = list[(index + 1) % list.length];
  const Tag = as;
  const vars = {
    "--mf-cf-size": `${fontSize}px`,
    "--mf-cf-accent": accentColor,
    "--mf-cf-depth": DEPTH,
    ...(color ? { "--mf-cf-color": color } : {}),
    ...style,
  } as React.CSSProperties;

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        rootRef.current = el;
      }}
      className={`${styles.root} ${className}`.trim()}
      data-direction={direction}
      style={vars}
    >
      <span className={styles.srOnly}>{`${prefix} ${list.join(", ")}`}</span>
      <span aria-hidden="true" className={styles.visual}>
        {prefix ? <span className={styles.prefix}>{prefix} </span> : null}
        <span className={styles.slot}>
          {list.map((w, i) => (
            <span key={`${w}-${i}`} className={styles.sizer}>
              {w}
            </span>
          ))}
          <span ref={cubeRef} className={styles.cube}>
            <span ref={frontRef} className={`${styles.face} ${styles.front}`}>
              {current}
            </span>
            <span ref={nextRef} className={`${styles.face} ${styles.next}`}>
              {upcoming}
            </span>
          </span>
        </span>
      </span>
    </Tag>
  );
}
