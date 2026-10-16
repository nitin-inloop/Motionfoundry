"use client";

import * as React from "react";
import styles from "../styles/snap-sections.module.css";

type SnapEase = "expo.out" | "power3.inOut" | "power2.out" | "sine.inOut" | "back.out";

const EASES: Record<SnapEase, (t: number) => number> = {
  "expo.out": (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  "power3.inOut": (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  "power2.out": (t) => 1 - (1 - t) * (1 - t),
  "sine.inOut": (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  "back.out": (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export interface SnapSectionsProps {
  /** Section titles, one full-height section per item */
  sections?: string[];
  /** Accent color for the glow orb, kicker and active dot */
  accentColor?: string;
  /** Snap animation duration in ms */
  duration?: number;
  /** Easing curve of the snap animation */
  ease?: SnapEase;
  /** Show the clickable dot navigation */
  showDots?: boolean;
  /** Side the dot navigation sits on */
  dotsPosition?: "right" | "left";
  /** Accumulated wheel delta in px needed to trigger a snap */
  threshold?: number;
  /** Animate snaps with easing (native CSS scroll-snap when false or under reduced motion) */
  smooth?: boolean;
  /** Viewport height in px */
  height?: number;
  /** Viewport corner radius in px */
  borderRadius?: number;
  /** Called with the new index whenever the active section changes */
  onSectionChange?: (index: number) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_SECTIONS = ["Capture", "Organize", "Collaborate", "Publish"];
const BLURBS = [
  "Drop in ideas from anywhere: links, notes, screenshots and voice.",
  "Everything finds its place with smart tags and nested spaces.",
  "Comment, assign and decide together in real time.",
  "Turn any space into a polished page with one click.",
  "Every gesture moves exactly one section, never more.",
];

export function SnapSections({
  sections = DEFAULT_SECTIONS,
  accentColor = "#34d399",
  duration = 900,
  ease = "expo.out",
  showDots = true,
  dotsPosition = "right",
  threshold = 12,
  smooth = true,
  height = 380,
  borderRadius = 20,
  onSectionChange,
  className = "",
  style,
}: SnapSectionsProps) {
  const reduced = usePrefersReducedMotion();
  const animated = smooth && !reduced;
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = React.useState(0);
  const activeRef = React.useRef(0);
  const animRef = React.useRef(0);
  const changeRef = React.useRef(onSectionChange);
  const count = sections.length;

  React.useEffect(() => {
    changeRef.current = onSectionChange;
  }, [onSectionChange]);

  const markActive = React.useCallback((i: number) => {
    if (activeRef.current === i) return;
    activeRef.current = i;
    setActive(i);
    changeRef.current?.(i);
  }, []);

  const goTo = React.useCallback(
    (index: number) => {
      const el = viewportRef.current;
      const i = clamp(index, 0, Math.max(0, count - 1));
      const section = sectionRefs.current[i];
      if (!el || !section) return;
      markActive(i);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = 0;
      const to = section.offsetTop;
      if (!animated) {
        el.scrollTop = to;
        return;
      }
      const from = el.scrollTop;
      const fn = EASES[ease] ?? EASES["expo.out"];
      const ms = Math.max(1, duration);
      const start = performance.now();
      el.dataset.animating = "true";
      const tick = (now: number) => {
        const t = clamp((now - start) / ms, 0, 1);
        el.scrollTop = from + (to - from) * fn(t);
        if (t < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          animRef.current = 0;
          el.scrollTop = to;
          el.dataset.animating = "false";
        }
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [animated, count, duration, ease, markActive],
  );

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let lastWheel = 0;
    let acc = 0;
    let consumed = false;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1);
      if (dy === 0) return;
      const now = performance.now();
      const fresh = now - lastWheel > 160;
      lastWheel = now;
      if (fresh) {
        consumed = false;
        acc = 0;
      }
      const idx = activeRef.current;
      const atEdge = (dy < 0 && idx === 0) || (dy > 0 && idx === count - 1);
      // A new gesture past the first/last section is released so the page keeps scrolling.
      if (atEdge && !animRef.current && (fresh || !consumed)) return;
      event.preventDefault();
      if (consumed || animRef.current) return;
      acc += dy;
      if (Math.abs(acc) >= Math.max(1, threshold)) {
        consumed = true;
        acc = 0;
        goTo(idx + (dy > 0 ? 1 : -1));
      }
    };
    const onScroll = () => {
      if (animRef.current || el.clientHeight === 0) return;
      markActive(clamp(Math.round(el.scrollTop / el.clientHeight), 0, Math.max(0, count - 1)));
    };
    const ro = new ResizeObserver(() => {
      const section = sectionRefs.current[activeRef.current];
      if (!animRef.current && section) el.scrollTop = section.offsetTop;
    });
    ro.observe(el);
    if (animated) el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (animated) el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = 0;
      el.dataset.animating = "false";
    };
  }, [animated, count, threshold, goTo, markActive]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = activeRef.current;
    let next = -1;
    if (event.key === "PageDown" || event.key === "ArrowDown" || (event.key === " " && !event.shiftKey)) next = idx + 1;
    else if (event.key === "PageUp" || event.key === "ArrowUp" || (event.key === " " && event.shiftKey)) next = idx - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    if (next < 0 || next > count - 1 || next === idx) return;
    event.preventDefault();
    goTo(next);
  };

  const vars = {
    "--mf-sns-h": `${height}px`,
    "--mf-sns-r": `${borderRadius}px`,
    "--mf-sns-accent": accentColor,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()} data-dots={dotsPosition}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        tabIndex={0}
        role="region"
        aria-label={`${count} snapping sections. Use Page Up and Page Down to move between them.`}
        onKeyDown={onKeyDown}
        data-animating="false"
        data-snap={animated ? "js" : "css"}
      >
        {sections.map((title, i) => (
          <section
            key={`${title}-${i}`}
            ref={(node) => {
              sectionRefs.current[i] = node;
            }}
            className={styles.section}
            data-active={String(i === active)}
            aria-label={`${i + 1} of ${count}: ${title}`}
            style={{ "--mf-sns-i": i } as React.CSSProperties}
          >
            <span aria-hidden="true" className={styles.orb} />
            <span aria-hidden="true" className={styles.bigIndex}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={styles.body}>
              <span className={styles.kicker}>{`${String(i + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`}</span>
              <h3 className={styles.title}>{title}</h3>
              <p className={styles.text}>{BLURBS[i % BLURBS.length]}</p>
            </div>
          </section>
        ))}
      </div>
      {showDots && count > 1 ? (
        <nav className={styles.dots} aria-label="Sections">
          {sections.map((title, i) => (
            <button
              key={`${title}-${i}`}
              type="button"
              className={styles.dot}
              aria-label={`Go to section ${i + 1}: ${title}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </nav>
      ) : null}
    </div>
  );
}
