"use client";

import * as React from "react";
import styles from "../styles/parallax-columns.module.css";

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

export interface ParallaxColumnsProps {
  /** Heading shown on the frosted card over the columns (empty string hides it) */
  title?: string;
  /** Number of tiles in each of the three columns */
  tilesPerColumn?: number;
  /** Gap in px between columns and tiles */
  gap?: number;
  /** Travel speed of the outer columns, 0..1 of their available distance */
  speed?: number;
  /** Move the middle column in the opposite direction */
  counterMiddle?: boolean;
  /** Gradient colors cycled through the tiles */
  palette?: string[];
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

const DEFAULT_PALETTE = ["#f472b6", "#a78bfa", "#60a5fa", "#2dd4bf", "#fbbf24", "#fb7185"];
const LABELS = ["Aurora", "Dune", "Lagoon", "Ember", "Nebula", "Orchard", "Glacier", "Saffron", "Tidal", "Velvet"];

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export function ParallaxColumns({
  title = "A gallery that moves with you",
  tilesPerColumn = 6,
  gap = 12,
  speed = 0.8,
  counterMiddle = true,
  palette = DEFAULT_PALETTE,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ParallaxColumnsProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const colRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const travelRef = React.useRef<number[]>([0, 0, 0]);
  const progressRef = React.useRef(0);
  const colors = palette.length > 0 ? palette : DEFAULT_PALETTE;
  const count = Math.max(2, Math.round(tilesPerColumn));

  const apply = React.useCallback(() => {
    const p = progressRef.current;
    const k = clamp(speed, 0, 1);
    const factors = [p * k, counterMiddle ? 1 - p : p, p * k * 0.55];
    for (let c = 0; c < 3; c++) {
      const col = colRefs.current[c];
      if (!col) continue;
      const y = reduced ? 0 : -factors[c] * travelRef.current[c];
      col.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    }
  }, [speed, counterMiddle, reduced]);

  const handleScroll = React.useCallback(
    ({ progress }: SmoothScrollState) => {
      progressRef.current = progress;
      apply();
    },
    [apply],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const h = stage.clientHeight;
      travelRef.current = colRefs.current.map((col) => (col ? Math.max(0, col.offsetHeight - h) : 0));
      apply();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    colRefs.current.forEach((col) => col && ro.observe(col));
    return () => ro.disconnect();
  }, [apply, count, gap]);

  const vars = {
    "--mf-pcl-h": `${height}px`,
    "--mf-pcl-r": `${borderRadius}px`,
    "--mf-pcl-gap": `${Math.max(0, gap)}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title || "Parallax gallery"}>
        <div style={{ height: height * 3 }}>
          <div ref={stageRef} className={styles.stage}>
            {[0, 1, 2].map((c) => (
              <div key={c} className={styles.lane} aria-hidden="true">
                <div
                  ref={(node) => {
                    colRefs.current[c] = node;
                  }}
                  className={styles.column}
                >
                  {Array.from({ length: count }, (_, t) => {
                    const seed = c * 41 + t * 7;
                    const c1 = colors[(c + t * 2) % colors.length];
                    const c2 = colors[(c + t * 2 + 1) % colors.length];
                    return (
                      <div
                        key={t}
                        className={styles.tile}
                        style={
                          {
                            height: Math.round(height * (0.3 + rand(seed) * 0.32)),
                            "--mf-pcl-c1": c1,
                            "--mf-pcl-c2": c2,
                            "--mf-pcl-a": `${Math.round(110 + rand(seed + 3) * 140)}deg`,
                            "--mf-pcl-gx": `${Math.round(15 + rand(seed + 5) * 70)}%`,
                          } as React.CSSProperties
                        }
                      >
                        {rand(seed + 9) > 0.45 && <span className={styles.label}>{LABELS[(seed + t) % LABELS.length]}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {title && (
              <div className={styles.overlay}>
                <div className={styles.card}>
                  <span className={styles.kicker}>Parallax Columns</span>
                  <h3 className={styles.title}>{title}</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
