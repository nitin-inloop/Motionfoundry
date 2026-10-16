"use client";

import * as React from "react";
import styles from "../styles/smooth-scroll.module.css";

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

export interface SmoothScrollProps {
  /** Scrollable content (defaults to a set of editorial demo sections) */
  children?: React.ReactNode;
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
  /** Show a scroll progress bar along the top edge */
  showProgress?: boolean;
  /** Progress bar and accent color */
  progressColor?: string;
  /** Show a live velocity readout badge */
  showVelocity?: boolean;
  /** Accessible label for the scroll region */
  ariaLabel?: string;
  /** Called on every scroll frame with scroll, limit, progress (0..1) and velocity (px/frame) */
  onScroll?: (state: { scroll: number; limit: number; progress: number; velocity: number }) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Inline styles merged onto the root */
  style?: React.CSSProperties;
}

const SECTIONS = [
  {
    eyebrow: "01 / Inertia",
    title: "Scrolling that glides.",
    body: "Every wheel tick moves a target, not the page. Each frame the viewport eases a fraction of the remaining distance toward it, so motion starts crisp and settles softly.",
  },
  {
    eyebrow: "02 / Interpolation",
    title: "One number, endless feel.",
    body: "Lerp controls the personality. Small values float like a magazine on ice; larger values feel tight and precise. Velocity and progress fall out of the same loop for free.",
  },
  {
    eyebrow: "03 / Respect",
    title: "Native where it matters.",
    body: "Touch keeps its own physics, keyboard and scrollbar stay instant, and at the edges the wheel is released so the surrounding page carries on scrolling.",
  },
  {
    eyebrow: "04 / Restraint",
    title: "Idle when settled.",
    body: "The animation loop only runs while there is distance left to cover. Once the viewport arrives, nothing ticks until the next gesture.",
  },
];

export function SmoothScroll({
  children,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  showProgress = true,
  progressColor = "#a78bfa",
  showVelocity = true,
  ariaLabel = "Smooth scrolling content",
  onScroll,
  className = "",
  style,
}: SmoothScrollProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const readoutRef = React.useRef<HTMLSpanElement>(null);

  const handleScroll = React.useCallback(
    (state: SmoothScrollState) => {
      const root = rootRef.current;
      if (root) {
        root.style.setProperty("--mf-ss-p", state.progress.toFixed(4));
        root.style.setProperty("--mf-ss-v", Math.min(1, Math.abs(state.velocity) / 40).toFixed(3));
      }
      const readout = readoutRef.current;
      if (readout) {
        const v = Math.abs(state.velocity);
        const arrow = v < 0.05 ? "·" : state.velocity > 0 ? "↓" : "↑";
        readout.textContent = `${arrow} ${v.toFixed(1)} px/f`;
      }
      onScroll?.({ scroll: state.scroll, limit: state.limit, progress: state.progress, velocity: state.velocity });
    },
    [onScroll],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  const vars = {
    "--mf-ss-h": `${height}px`,
    "--mf-ss-r": `${borderRadius}px`,
    "--mf-ss-accent": progressColor,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={ariaLabel}>
        <div className={styles.content}>
          {children ?? (
            <>
              <header className={styles.hero}>
                <span className={styles.kicker}>Smooth Scroll</span>
                <h3 className={styles.heroTitle}>Weightless, not floaty.</h3>
                <p className={styles.heroText}>Scroll inside this panel with a wheel or trackpad.</p>
              </header>
              {SECTIONS.map((section, i) => (
                <section key={section.title} className={styles.section}>
                  <div className={styles.sectionText}>
                    <span className={styles.eyebrow}>{section.eyebrow}</span>
                    <h4 className={styles.sectionTitle}>{section.title}</h4>
                    <p className={styles.sectionBody}>{section.body}</p>
                  </div>
                  <div
                    aria-hidden="true"
                    className={styles.art}
                    style={{ "--mf-ss-i": i } as React.CSSProperties}
                  />
                </section>
              ))}
              <footer className={styles.footer}>
                <span className={styles.footerLine} aria-hidden="true" />
                <p>End of the line. Keep scrolling to hand off to the page.</p>
              </footer>
            </>
          )}
        </div>
      </div>
      {showProgress && (
        <div aria-hidden="true" className={styles.progress}>
          <span className={styles.progressFill} />
        </div>
      )}
      {showVelocity && (
        <div aria-hidden="true" className={styles.badge}>
          <span className={styles.badgeLabel}>Velocity</span>
          <span ref={readoutRef} className={styles.badgeValue}>
            {"· 0.0 px/f"}
          </span>
          <span className={styles.meter}>
            <span className={styles.meterFill} />
          </span>
        </div>
      )}
    </div>
  );
}
