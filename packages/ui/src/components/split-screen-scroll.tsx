"use client";

import * as React from "react";
import styles from "../styles/split-screen-scroll.module.css";

interface SmoothScrollState {
  /** Current scrollTop of the viewport in px */
  scroll: number;
  /** Maximum scrollTop in px */
  limit: number;
  /** scroll / limit, 0..1 */
  progress: number;
}

interface SmoothScrollOptions {
  lerp: number;
  wheelMultiplier: number;
  smooth: boolean;
  onScroll?: (state: SmoothScrollState) => void;
}

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

/** True when a nested scrollable element under the pointer can still scroll in the wheel direction. */
function nestedCanScroll(node: EventTarget | null, root: HTMLElement, dy: number): boolean {
  let el: Element | null = node instanceof Element ? node : null;
  while (el && el !== root) {
    if (el instanceof HTMLElement) {
      if (el.dataset.mfScrollPrevent !== undefined) return true;
      const oy = window.getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Self-contained smooth scroller for an overflow container: wheel input sets a target, a rAF
 * loop eases scrollTop toward it (frame-rate independent) and stops when settled. Touch,
 * keyboard and scrollbar stay native; at the edges wheel events are released to the page.
 */
function useSmoothScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  { lerp, wheelMultiplier, smooth, onScroll }: SmoothScrollOptions,
) {
  const callbackRef = React.useRef(onScroll);
  React.useEffect(() => {
    callbackRef.current = onScroll;
  }, [onScroll]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ease = clamp(Number.isFinite(lerp) ? lerp : 0.1, 0.01, 1);
    const multiplier = Number.isFinite(wheelMultiplier) ? wheelMultiplier : 1;
    let target = el.scrollTop;
    let current = target;
    let raf = 0;
    let lastTime = 0;
    const getLimit = () => Math.max(0, el.scrollHeight - el.clientHeight);
    const emit = () => {
      const limit = getLimit();
      const scroll = clamp(el.scrollTop, 0, limit);
      callbackRef.current?.({ scroll, limit, progress: limit > 0 ? scroll / limit : 0 });
    };
    const stop = () => {
      raf = 0;
      lastTime = 0;
    };
    const tick = (time: number) => {
      const frames = (lastTime ? clamp(time - lastTime, 1, 64) : 16.667) / 16.667;
      lastTime = time;
      target = clamp(target, 0, getLimit());
      if (Math.abs(el.scrollTop - current) > 2) {
        // Scrollbar drag, keyboard or touch moved the viewport: hand control back.
        current = target = el.scrollTop;
        stop();
        emit();
        return;
      }
      current += (target - current) * (1 - Math.pow(1 - ease, frames));
      if (Math.abs(target - current) < 0.35) current = target;
      el.scrollTop = current;
      emit();
      if (current === target) stop();
      else raf = requestAnimationFrame(tick);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      let dy = event.deltaY;
      if (event.deltaMode === 1) dy *= 16;
      else if (event.deltaMode === 2) dy *= el.clientHeight;
      dy *= multiplier;
      if (dy === 0 || nestedCanScroll(event.target, el, dy)) return;
      const limit = getLimit();
      if (!raf) current = target = el.scrollTop;
      // Release to native scrolling at the edges so the page is never trapped.
      if ((dy < 0 && target <= 0) || (dy > 0 && target >= limit - 0.5)) return;
      event.preventDefault();
      target = clamp(target + dy, 0, limit);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onNativeScroll = () => {
      if (raf) return;
      current = target = el.scrollTop;
      emit();
    };
    if (smooth) el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onNativeScroll, { passive: true });
    const ro = new ResizeObserver(emit);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    emit();
    return () => {
      if (smooth) el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onNativeScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [containerRef, lerp, wheelMultiplier, smooth]);
}

export interface SplitScreenScrollProps {
  /** Panel titles, one text panel paired with one visual panel per item */
  items?: string[];
  /** Gradient colors cycled through the visual panels */
  palette?: string[];
  /** Accent color for numbers, divider progress and counter */
  accentColor?: string;
  /** Swap directions: text column moves down and visual column moves up */
  reverse?: boolean;
  /** Show the progress divider and "01 / 05" counter in the middle */
  showCounter?: boolean;
  /** Viewport height in px */
  height?: number;
  /** Viewport corner radius in px */
  borderRadius?: number;
  /** Interpolation factor per 60fps frame (0.05 = floaty, 0.3 = snappy) */
  lerp?: number;
  /** Multiplier applied to wheel / trackpad deltas */
  wheelMultiplier?: number;
  /** Enable smooth wheel scrolling (native scrolling when false or under reduced motion) */
  smooth?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS = ["Capture the idea", "Shape the system", "Prototype in motion", "Ship with confidence", "Learn and iterate"];
const DEFAULT_PALETTE = ["#f472b6", "#a78bfa", "#38bdf8", "#34d399", "#fbbf24"];
const COPY = [
  "Sketch fast, keep everything. Rough notes become the first frame of the story.",
  "Tokens, grids and type scales turn scattered screens into one coherent language.",
  "Real interactions, real timing. Feel the flow long before a line of production code.",
  "Accessible, tested and measured. Releases become routine instead of events.",
  "Watch how people use it, then fold every insight back into the next cycle.",
];
const TAGS = ["Discovery", "Design", "Motion", "Engineering", "Insights"];

export function SplitScreenScroll({
  items = DEFAULT_ITEMS,
  palette = DEFAULT_PALETTE,
  accentColor = "#f472b6",
  reverse = false,
  showCounter = true,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: SplitScreenScrollProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);
  const total = Math.max(1, items.length);
  const colors = palette.length > 0 ? palette : DEFAULT_PALETTE;

  const handleScroll = React.useCallback(
    ({ progress }: SmoothScrollState) => {
      stageRef.current?.style.setProperty("--mf-sss-p", progress.toFixed(5));
      setActive(clamp(Math.round(progress * (total - 1)), 0, total - 1));
    },
    [total],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  const order = items.map((_, i) => i);
  const textOrder = reverse ? [...order].reverse() : order;
  const visualOrder = reverse ? order : [...order].reverse();

  const vars = {
    "--mf-sss-h": `${height}px`,
    "--mf-sss-r": `${borderRadius}px`,
    "--mf-sss-accent": accentColor,
    "--mf-sss-n": total,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label="Split screen story">
        <div className={styles.track} style={{ height: height * total }}>
          <div ref={stageRef} className={styles.stage}>
            <div className={styles.column}>
              <ol className={`${styles.strip} ${reverse ? styles.down : styles.up}`}>
                {textOrder.map((i) => (
                  <li key={`t-${i}`} className={styles.textPanel} aria-current={i === active ? "step" : undefined}>
                    <span className={styles.tag}>
                      <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                      {TAGS[i % TAGS.length]}
                    </span>
                    <h3 className={styles.title}>{items[i]}</h3>
                    <p className={styles.copy}>{COPY[i % COPY.length]}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className={styles.column} aria-hidden="true">
              <div className={`${styles.strip} ${reverse ? styles.up : styles.down}`}>
                {visualOrder.map((i) => {
                  const c1 = colors[i % colors.length];
                  const c2 = colors[(i + 1) % colors.length];
                  return (
                    <div
                      key={`v-${i}`}
                      className={styles.visualPanel}
                      style={{ "--mf-sss-c1": c1, "--mf-sss-c2": c2 } as React.CSSProperties}
                    >
                      <div className={styles.visual}>
                        <svg className={styles.art} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
                          <circle cx={60 + (i % 3) * 40} cy={70 + (i % 2) * 30} r={46 + (i % 4) * 8} fill="rgba(255,255,255,0.2)" />
                          <rect x={100 - (i % 3) * 20} y={110} width="80" height="80" rx="18" fill="rgba(0,0,0,0.16)" transform={`rotate(${12 + i * 9} 140 150)`} />
                          <path d={`M0 ${150 - i * 6} C 60 ${120 + i * 4}, 120 ${180 - i * 5}, 200 ${140 + i * 3} L200 200 L0 200 Z`} fill="rgba(255,255,255,0.14)" />
                        </svg>
                        <span className={styles.bigNum}>{String(i + 1).padStart(2, "0")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {showCounter && (
              <div className={styles.divider} aria-hidden="true">
                <span className={styles.rail}>
                  <span className={styles.fill} />
                </span>
                <span className={styles.counter}>{`${String(active + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
