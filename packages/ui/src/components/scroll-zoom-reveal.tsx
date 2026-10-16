"use client";

import * as React from "react";
import styles from "../styles/scroll-zoom-reveal.module.css";

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

export interface ScrollZoomRevealProps {
  /** Headline revealed once the panel is full-bleed */
  title?: string;
  /** Supporting line under the headline */
  subtitle?: string;
  /** Caption shown before the zoom starts */
  caption?: string;
  /** First gradient color of the panel art */
  color1?: string;
  /** Second gradient color of the panel art */
  color2?: string;
  /** Initial panel size as a fraction of the viewport (0.2–0.9) */
  startScale?: number;
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

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function ScrollZoomReveal({
  title = "Step into the frame",
  subtitle = "A small window grows into the whole world as you scroll.",
  caption = "Scroll to zoom",
  color1 = "#7c3aed",
  color2 = "#fb7185",
  startScale = 0.42,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ScrollZoomRevealProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const s0 = clamp(startScale, 0.1, 1);

  const handleScroll = React.useCallback(
    (state: SmoothScrollState) => {
      const root = rootRef.current;
      if (!root) return;
      const p = state.progress;
      const expand = easeInOutCubic(clamp(p / 0.62, 0, 1));
      const k = s0 + (1 - s0) * expand;
      const reveal = easeOutCubic(clamp((p - 0.5) / 0.32, 0, 1));
      root.style.setProperty("--mf-szr-k", k.toFixed(4));
      root.style.setProperty("--mf-szr-e", expand.toFixed(4));
      root.style.setProperty("--mf-szr-t", reveal.toFixed(4));
      root.style.setProperty("--mf-szr-cap", clamp(1 - p / 0.22, 0, 1).toFixed(4));
    },
    [s0],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  const vars = {
    "--mf-szr-h": `${height}px`,
    "--mf-szr-r": `${borderRadius}px`,
    "--mf-szr-c1": color1,
    "--mf-szr-c2": color2,
    "--mf-szr-k": s0,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title}>
        <div className={styles.track} style={{ height: `${Math.round(height * 3.2)}px` }}>
          <div className={styles.stage}>
            <span aria-hidden="true" className={styles.caption}>
              {caption}
            </span>
            <div className={styles.panel}>
              <div aria-hidden="true" className={styles.art}>
                <span className={styles.sun} />
                <span className={styles.grid} />
                <span className={`${styles.ridge} ${styles.ridgeBack}`} />
                <span className={`${styles.ridge} ${styles.ridgeFront}`} />
              </div>
              <div className={styles.copy}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.subtitle}>{subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
