"use client";

import * as React from "react";
import styles from "../styles/scroll-path-draw.module.css";

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
      const overflowY = window.getComputedStyle(el).overflowY;
      if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Self-contained smooth scroller for an overflow container: wheel input sets a target and a rAF
 * loop eases scrollTop toward it. Touch, keyboard and scrollbar stay native; wheel is released at
 * the edges so the page keeps scrolling.
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
    const tick = (time: number) => {
      const dt = lastTime ? Math.min(64, Math.max(1, time - lastTime)) : 16.667;
      lastTime = time;
      target = clamp(target, 0, getLimit());
      if (Math.abs(el.scrollTop - current) > 2) {
        current = target = el.scrollTop;
        raf = 0;
        lastTime = 0;
        emit();
        return;
      }
      current += (target - current) * (1 - Math.pow(1 - ease, dt / 16.667));
      if (Math.abs(target - current) < 0.35) current = target;
      el.scrollTop = current;
      emit();
      if (current === target) {
        raf = 0;
        lastTime = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
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
      if ((dy < 0 && target <= 0) || (dy > 0 && target >= limit - 0.5)) return;
      event.preventDefault();
      target = clamp(target + dy, 0, limit);
      if (!raf) {
        lastTime = 0;
        raf = requestAnimationFrame(tick);
      }
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

export interface ScrollPathDrawProps {
  /** Milestone labels placed along the route, in order */
  milestones?: string[];
  /** Heading shown above the route */
  title?: string;
  /** Gradient start color of the drawn path */
  color1?: string;
  /** Gradient end color of the drawn path */
  color2?: string;
  /** Stroke width of the route in SVG units (viewBox is 1000 wide) */
  strokeWidth?: number;
  /** Scroll distance as a multiple of the viewport height (more = slower drawing) */
  scrollLength?: number;
  /** Glow around the drawn path and head dot */
  glow?: boolean;
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

const DEFAULT_MILESTONES = ["Kickoff", "Prototype", "Private beta", "Public launch", "Series A"];

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

interface Point {
  x: number;
  y: number;
}

/** Builds a monotonic-in-x winding route through the milestone anchors. */
function buildRoute(count: number): { d: string; anchors: Point[] } {
  const n = Math.max(1, count);
  const anchors: Point[] = Array.from({ length: n }, (_, i) => ({
    x: n === 1 ? 500 : 110 + (i * 780) / (n - 1),
    y: (i % 2 === 0 ? 268 : 112) + (rand(i + 3) - 0.5) * 36,
  }));
  const pts: Point[] = [{ x: 18, y: 330 }, ...anchors, { x: 982, y: n % 2 === 0 ? 300 : 70 }];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const h = (b.x - a.x) / 2;
    d += ` C ${(a.x + h).toFixed(1)} ${a.y.toFixed(1)} ${(b.x - h).toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return { d, anchors };
}

export function ScrollPathDraw({
  milestones = DEFAULT_MILESTONES,
  title = "The road so far",
  color1 = "#a78bfa",
  color2 = "#22d3ee",
  strokeWidth = 5,
  scrollLength = 3,
  glow = true,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ScrollPathDrawProps) {
  const reduced = usePrefersReducedMotion();
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const headRef = React.useRef<SVGGElement>(null);
  const percentRef = React.useRef<HTMLSpanElement>(null);
  const markerRefs = React.useRef<(SVGGElement | null)[]>([]);
  const fractionsRef = React.useRef<number[]>([]);
  const progressRef = React.useRef(0);

  const { d, anchors } = React.useMemo(() => buildRoute(milestones.length), [milestones.length]);

  const apply = React.useCallback(() => {
    const path = pathRef.current;
    if (!path) return;
    const p = reduced ? 1 : clamp(progressRef.current / 0.94, 0, 1);
    const total = path.getTotalLength();
    path.style.strokeDashoffset = String(1 - p);
    const pt = path.getPointAtLength(total * p);
    headRef.current?.setAttribute("transform", `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
    markerRefs.current.forEach((m, i) => {
      if (m) m.dataset.active = String(p >= (fractionsRef.current[i] ?? 1) - 0.004);
    });
    if (percentRef.current) percentRef.current.textContent = `${Math.round(p * 100)}%`;
    rootRef.current?.style.setProperty("--mf-spd-p", p.toFixed(4));
  }, [reduced]);

  React.useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    fractionsRef.current = anchors.map((a) => {
      let lo = 0;
      let hi = total;
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (path.getPointAtLength(mid).x < a.x) lo = mid;
        else hi = mid;
      }
      return total > 0 ? hi / total : 0;
    });
    apply();
  }, [anchors, d, apply]);

  const handleScroll = React.useCallback(
    (state: SmoothScrollState) => {
      progressRef.current = state.progress;
      apply();
    },
    [apply],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  const vars = {
    "--mf-spd-h": `${height}px`,
    "--mf-spd-r": `${borderRadius}px`,
    "--mf-spd-c1": color1,
    "--mf-spd-c2": color2,
    "--mf-spd-len": Math.max(1.2, scrollLength),
    ...style,
  } as React.CSSProperties;
  const filter = glow ? `url(#${uid}-glow)` : undefined;

  return (
    <div ref={rootRef} style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title}>
        <div className={styles.track}>
          <div className={styles.stage}>
            <header className={styles.header}>
              <h3 className={styles.title}>{title}</h3>
              <span className={styles.percent} ref={percentRef} aria-hidden="true">
                0%
              </span>
            </header>
            <svg className={styles.svg} viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet" role="img"
              aria-label={`Route through ${milestones.join(", ")}`}>
              <defs>
                <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor={color1} />
                  <stop offset="1" stopColor={color2} />
                </linearGradient>
                <filter id={`${uid}-glow`} x="-20%" y="-60%" width="140%" height="220%">
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d={d} className={styles.base} strokeWidth={Math.max(1, strokeWidth * 0.5)} />
              <path ref={pathRef} d={d} className={styles.line} pathLength={1} stroke={`url(#${uid}-grad)`}
                strokeWidth={strokeWidth} filter={filter} />
              {anchors.map((a, i) => {
                const above = a.y > 200;
                return (
                  <g key={`${milestones[i]}-${i}`} ref={(node) => { markerRefs.current[i] = node; }}
                    className={styles.marker} data-active="false" transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`}>
                    <circle r={strokeWidth + 5} className={styles.ring} />
                    <circle r={Math.max(3, strokeWidth * 0.6)} className={styles.pin} />
                    <g className={styles.label} style={{ "--mf-spd-dy": above ? "8px" : "-8px" } as React.CSSProperties}>
                      <text y={above ? -30 : 44} textAnchor="middle" className={styles.step}>
                        {`0${i + 1}`.slice(-2)}
                      </text>
                      <text y={above ? -54 : 70} textAnchor="middle" className={styles.name}>
                        {milestones[i]}
                      </text>
                    </g>
                  </g>
                );
              })}
              <g ref={headRef} className={styles.head} aria-hidden="true" transform="translate(18 330)">
                <circle r={strokeWidth + 9} className={styles.halo} filter={filter} />
                <circle r={strokeWidth + 2} className={styles.dot} />
              </g>
            </svg>
            <p className={styles.hint} aria-hidden="true">Scroll to trace the route</p>
          </div>
        </div>
      </div>
    </div>
  );
}
