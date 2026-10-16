"use client";

import * as React from "react";
import styles from "../styles/velocity-marquee.module.css";

interface SmoothScrollState {
  /** Current scrollTop of the viewport in px */
  scroll: number;
  /** Maximum scrollTop in px */
  limit: number;
  /** scroll / limit, 0..1 */
  progress: number;
  /** Signed scroll velocity in px per 60fps frame */
  velocity: number;
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
      const overflowY = window.getComputedStyle(el).overflowY;
      if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        const canMove = dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        if (canMove) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Self-contained smooth scroller for an overflow container. Wheel input updates a target
 * position; a rAF loop eases the real scrollTop toward it (frame-rate independent lerp) and
 * stops once settled. Touch, keyboard and scrollbar drags stay native. At the top/bottom edge
 * wheel events are released so the page keeps scrolling.
 */
function useSmoothScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  { lerp, wheelMultiplier, smooth, onScroll }: SmoothScrollOptions,
): React.RefObject<SmoothScrollState> {
  const stateRef = React.useRef<SmoothScrollState>({ scroll: 0, limit: 0, progress: 0, velocity: 0 });
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
    let lastNative = el.scrollTop;
    let lastNativeTime = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const getLimit = () => Math.max(0, el.scrollHeight - el.clientHeight);

    const emit = (velocity: number) => {
      const limit = getLimit();
      const scroll = clamp(el.scrollTop, 0, limit);
      lastNative = el.scrollTop;
      const s = stateRef.current;
      s.scroll = scroll;
      s.limit = limit;
      s.progress = limit > 0 ? scroll / limit : 0;
      s.velocity = velocity;
      callbackRef.current?.(s);
    };

    const tick = (time: number) => {
      const dt = lastTime ? Math.min(64, Math.max(1, time - lastTime)) : 16.667;
      lastTime = time;
      const limit = getLimit();
      target = clamp(target, 0, limit);
      if (Math.abs(el.scrollTop - current) > 2) {
        // Something else moved the viewport (scrollbar drag, keyboard, touch): hand control back.
        current = target = el.scrollTop;
        raf = 0;
        lastTime = 0;
        emit(0);
        return;
      }
      const prev = current;
      const frames = dt / 16.667;
      current += (target - current) * (1 - Math.pow(1 - ease, frames));
      if (Math.abs(target - current) < 0.35) current = target;
      el.scrollTop = current;
      emit((current - prev) / frames);
      if (current === target) {
        raf = 0;
        lastTime = 0;
        emit(0);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
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
      if (!raf) {
        lastTime = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const onNativeScroll = () => {
      if (raf) return;
      const top = el.scrollTop;
      const delta = top - lastNative;
      if (delta === 0) return;
      const now = performance.now();
      const dt = lastNativeTime ? clamp(now - lastNativeTime, 8, 100) : 16.667;
      lastNativeTime = now;
      current = target = top;
      emit(delta / (dt / 16.667));
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        lastNativeTime = 0;
        emit(0);
      }, 90);
    };

    if (smooth) el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onNativeScroll, { passive: true });
    const ro = new ResizeObserver(() => emit(stateRef.current.velocity));
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    emit(0);

    return () => {
      if (smooth) el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onNativeScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [containerRef, lerp, wheelMultiplier, smooth]);

  return stateRef;
}

export interface VelocityMarqueeProps {
  /** Phrases repeated along both marquee rows */
  text?: string[];
  /** Idle drift speed in px per 60fps frame */
  baseSpeed?: number;
  /** How strongly scroll velocity boosts the marquee speed */
  velocityFactor?: number;
  /** Skew the rows in proportion to scroll velocity */
  skew?: boolean;
  /** Text color */
  color?: string;
  /** Render the second row as outlined text */
  outline?: boolean;
  /** Font size in px (shrinks on narrow containers) */
  fontSize?: number;
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

const DEFAULT_TEXT = ["Smooth scroll", "Built from scratch", "Velocity aware", "Motion Foundry"];
const COPIES = 4;

export function VelocityMarquee({
  text = DEFAULT_TEXT,
  baseSpeed = 1.2,
  velocityFactor = 0.5,
  skew = true,
  color = "#f4f4f6",
  outline = true,
  fontSize = 64,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: VelocityMarqueeProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const rowARef = React.useRef<HTMLDivElement>(null);
  const rowBRef = React.useRef<HTMLDivElement>(null);
  const velocityRef = React.useRef(0);

  const handleScroll = React.useCallback((state: SmoothScrollState) => {
    velocityRef.current = state.velocity;
  }, []);

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  React.useEffect(() => {
    const root = rootRef.current;
    const rowA = rowARef.current;
    const rowB = rowBRef.current;
    if (!root || !rowA || !rowB) return;
    if (reduced) {
      rowA.style.transform = "";
      rowB.style.transform = "";
      return;
    }
    let raf = 0;
    let last = 0;
    let visible = false;
    let smoothed = 0;
    let direction = 1;
    let posA = 0;
    let posB = 0;
    let periodA = rowA.scrollWidth / COPIES;
    let periodB = rowB.scrollWidth / COPIES;

    const wrap = (pos: number, period: number) => (period > 0 ? ((pos % period) + period) % period : 0);

    const frame = (time: number) => {
      const frames = last ? Math.min(4, (time - last) / 16.667) : 1;
      last = time;
      smoothed += (velocityRef.current - smoothed) * (1 - Math.pow(0.88, frames));
      if (smoothed > 0.25) direction = 1;
      else if (smoothed < -0.25) direction = -1;
      const speed = (Math.max(0, baseSpeed) + Math.abs(smoothed) * Math.max(0, velocityFactor)) * frames;
      posA += speed * direction;
      posB -= speed * direction;
      const skewDeg = skew ? clamp(smoothed * 0.7, -14, 14) : 0;
      rowA.style.transform = `translate3d(${(-wrap(posA, periodA)).toFixed(2)}px,0,0) skewX(${(-skewDeg).toFixed(2)}deg)`;
      rowB.style.transform = `translate3d(${(-wrap(posB, periodB)).toFixed(2)}px,0,0) skewX(${skewDeg.toFixed(2)}deg)`;
      root.style.setProperty("--mf-vm-v", Math.min(1, Math.abs(smoothed) / 30).toFixed(3));
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf && visible) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) start();
      else stop();
    });
    io.observe(root);
    const ro = new ResizeObserver(() => {
      periodA = rowA.scrollWidth / COPIES;
      periodB = rowB.scrollWidth / COPIES;
    });
    ro.observe(rowA);
    ro.observe(rowB);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
  }, [reduced, baseSpeed, velocityFactor, skew]);

  const phrases = text.length > 0 ? text : DEFAULT_TEXT;

  const vars = {
    "--mf-vm-h": `${height}px`,
    "--mf-vm-r": `${borderRadius}px`,
    "--mf-vm-color": color,
    "--mf-vm-fs": `${fontSize}px`,
    ...style,
  } as React.CSSProperties;

  const renderRow = (rowKey: string) =>
    Array.from({ length: COPIES }, (_, copy) => (
      <span key={`${rowKey}-${copy}`} className={styles.group}>
        {phrases.map((phrase, i) => (
          <React.Fragment key={i}>
            <span className={styles.phrase}>{phrase}</span>
            <span className={styles.sep} />
          </React.Fragment>
        ))}
      </span>
    ));

  return (
    <div ref={rootRef} style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={phrases.join(", ")}>
        <div className={styles.track} style={{ height: `${Math.round(height * 4)}px` }}>
          <div className={styles.stage}>
            <span aria-hidden="true" className={styles.hint}>
              Scroll faster
              <span className={styles.meter}>
                <span className={styles.meterFill} />
              </span>
            </span>
            <div aria-hidden="true" className={styles.rows}>
              <div className={styles.row}>
                <div ref={rowARef} className={styles.strip}>
                  {renderRow("a")}
                </div>
              </div>
              <div className={`${styles.row} ${outline ? styles.outlined : ""}`.trim()}>
                <div ref={rowBRef} className={styles.strip}>
                  {renderRow("b")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
