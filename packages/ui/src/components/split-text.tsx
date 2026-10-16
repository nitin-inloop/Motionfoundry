"use client";

import * as React from "react";
import styles from "../styles/split-text.module.css";

export type SplitTextEase =
  "power2.out" | "power3.out" | "power4.out" | "expo.out" | "back.out" | "elastic.out" | "sine.inOut" | "circ.out";

export type SplitTextStaggerFrom = "start" | "center" | "end" | "edges" | "random";

export interface SplitTextProps {
  /** Text to split and animate */
  text?: string;
  /** Unit each animated piece is made of; "lines" measures the real line wraps */
  splitBy?: "chars" | "words" | "lines";
  /** GSAP-style ease name */
  ease?: SplitTextEase;
  /** Duration of each piece's tween in seconds */
  duration?: number;
  /** Delay between consecutive pieces in seconds */
  stagger?: number;
  /** Where the stagger wave starts from */
  staggerFrom?: SplitTextStaggerFrom;
  /** Delay before the first piece starts, in seconds */
  delay?: number;
  /** Starting vertical offset of each piece in pixels */
  fromY?: number;
  /** Starting 3D rotation around the X axis in degrees */
  fromRotateX?: number;
  /** Starting opacity (0–1) */
  fromOpacity?: number;
  /** Starting blur radius in pixels */
  fromBlur?: number;
  /** When the animation plays: on mount, when scrolled into view, or on every hover */
  trigger?: "mount" | "inView" | "hover";
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

const EASES: Record<SplitTextEase, (t: number) => number> = {
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

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

function staggerRanks(count: number, from: SplitTextStaggerFrom): number[] {
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

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const PIECE_ATTR = "data-mf-st-piece";
const WORD_ATTR = "data-mf-st-word";

export function SplitText({
  text = "Motion that feels inevitable.",
  splitBy = "chars",
  ease = "power4.out",
  duration = 0.9,
  stagger = 0.03,
  staggerFrom = "start",
  delay = 0,
  fromY = 64,
  fromRotateX = -70,
  fromOpacity = 0,
  fromBlur = 8,
  trigger = "mount",
  as = "h2",
  fontSize = 56,
  color,
  className = "",
  style,
}: SplitTextProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const groupsRef = React.useRef<number[]>([]);
  const words = React.useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pieces = Array.from(root.querySelectorAll<HTMLElement>(`[${PIECE_ATTR}]`));
    const wordEls = Array.from(root.querySelectorAll<HTMLElement>(`[${WORD_ATTR}]`));
    const easeFn = EASES[ease] ?? EASES["power4.out"];
    const dur = Math.max(0.01, duration);
    const opacity0 = Math.min(1, Math.max(0, fromOpacity));

    const measureGroups = () => {
      if (splitBy !== "lines") {
        groupsRef.current = pieces.map((_, i) => i);
        return;
      }
      // Real line wraps: group words by their untransformed offsetTop.
      const tops: number[] = [];
      groupsRef.current = wordEls.map((el) => {
        const top = el.offsetTop;
        let line = tops.findIndex((t) => Math.abs(t - top) < Math.max(2, el.offsetHeight * 0.4));
        if (line === -1) {
          tops.push(top);
          line = tops.length - 1;
        }
        return line;
      });
    };

    const apply = (el: HTMLElement, p: number, done: boolean) => {
      if (done) {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.filter = "";
        return;
      }
      const q = Math.min(1, Math.max(0, p));
      const inv = 1 - p;
      el.style.transform = `perspective(600px) translate3d(0, ${(fromY * inv).toFixed(2)}px, 0) rotateX(${(
        fromRotateX * inv
      ).toFixed(2)}deg)`;
      el.style.opacity = String(opacity0 + (1 - opacity0) * q);
      const blur = fromBlur * (1 - q);
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
    };

    let raf = 0;
    const play = () => {
      cancelAnimationFrame(raf);
      measureGroups();
      const groups = groupsRef.current;
      const groupCount = groups.length ? Math.max(...groups) + 1 : 0;
      const ranks = staggerRanks(groupCount, staggerFrom);
      const delays = pieces.map((_, i) => delay + (ranks[groups[i] ?? 0] ?? 0) * stagger);
      const finished = pieces.map(() => false);
      pieces.forEach((el) => apply(el, 0, false));
      const start = performance.now();
      const tick = (now: number) => {
        const t = (now - start) / 1000;
        let active = false;
        pieces.forEach((el, i) => {
          if (finished[i]) return;
          const local = (t - delays[i]) / dur;
          if (local >= 1) {
            finished[i] = true;
            apply(el, 1, true);
          } else {
            active = true;
            apply(el, easeFn(Math.max(0, local)), false);
          }
        });
        if (active) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      pieces.forEach((el) => apply(el, 1, true));
      return;
    }

    let ro: ResizeObserver | null = null;
    if (splitBy === "lines" && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measureGroups());
      ro.observe(root);
    }

    let io: IntersectionObserver | null = null;
    const onEnter = () => play();

    if (trigger === "inView" && typeof IntersectionObserver !== "undefined") {
      pieces.forEach((el) => apply(el, 0, false));
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            play();
          }
        },
        { threshold: 0.2 },
      );
      io.observe(root);
    } else if (trigger === "hover") {
      measureGroups();
      root.addEventListener("pointerenter", onEnter);
    } else {
      play();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      pieces.forEach((el) => apply(el, 1, true));
    };
  }, [text, splitBy, ease, duration, stagger, staggerFrom, delay, fromY, fromRotateX, fromOpacity, fromBlur, trigger]);

  const Tag = as;
  const vars = {
    "--mf-st-size": `${fontSize}px`,
    ...(color ? { "--mf-st-color": color } : {}),
    ...style,
  } as React.CSSProperties;

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        rootRef.current = el;
      }}
      className={`${styles.root} ${className}`.trim()}
      style={vars}
    >
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true" className={styles.pieces}>
        {words.map((word, wi) => (
          <React.Fragment key={`${word}-${wi}`}>
            {splitBy === "chars" ? (
              <span className={styles.word} {...{ [WORD_ATTR]: "" }}>
                {Array.from(word).map((ch, ci) => (
                  <span key={ci} className={styles.char} {...{ [PIECE_ATTR]: "" }}>
                    {ch}
                  </span>
                ))}
              </span>
            ) : (
              <span className={`${styles.word} ${styles.char}`} {...{ [WORD_ATTR]: "", [PIECE_ATTR]: "" }}>
                {word}
              </span>
            )}
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}
