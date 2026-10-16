"use client";

import * as React from "react";
import styles from "../styles/scroll-tilt-cards.module.css";

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

export interface ScrollTiltCardsProps {
  /** Card titles, one tilting card per item */
  items?: string[];
  /** Heading shown above the cards */
  title?: string;
  /** Maximum rotation in degrees while a card enters or leaves */
  tiltAngle?: number;
  /** CSS perspective distance in px (smaller = more dramatic) */
  perspective?: number;
  /** Rotation axis: "x" tips cards forward/back, "y" swings them sideways */
  axis?: "x" | "y";
  /** Accent color for card glow and details */
  accentColor?: string;
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

const DEFAULT_ITEMS = ["Realtime sync", "Edge caching", "Typed APIs", "Audit trails", "Instant rollbacks", "Usage insights"];
const BLURBS = [
  "Every change lands on every device in under 80 ms.",
  "Static and dynamic responses served from 40+ regions.",
  "Schemas flow end to end, from database to UI.",
  "Know who changed what, and exactly when it happened.",
  "Ship boldly. Revert any deploy with a single click.",
  "Live dashboards that explain where the time goes.",
];

export function ScrollTiltCards({
  items = DEFAULT_ITEMS,
  title = "Tilted into view",
  tiltAngle = 38,
  perspective = 900,
  axis = "x",
  accentColor = "#38bdf8",
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ScrollTiltCardsProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const scrollRef = React.useRef(0);

  const apply = React.useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const center = scrollRef.current + vp.clientHeight / 2;
    for (const card of cardRefs.current) {
      if (!card) continue;
      const mid = card.offsetTop + card.offsetHeight / 2;
      const range = vp.clientHeight / 2 + card.offsetHeight / 2;
      const p = clamp((mid - center) / Math.max(1, range), -1, 1);
      card.style.setProperty("--mf-stc-p", p.toFixed(4));
      card.style.setProperty("--mf-stc-a", Math.abs(p).toFixed(4));
    }
  }, []);

  const handleScroll = React.useCallback(
    (state: SmoothScrollState) => {
      scrollRef.current = state.scroll;
      apply();
    },
    [apply],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  React.useEffect(() => {
    apply();
  }, [apply, items, height]);

  const vars = {
    "--mf-stc-h": `${height}px`,
    "--mf-stc-r": `${borderRadius}px`,
    "--mf-stc-accent": accentColor,
    "--mf-stc-tilt": reduced ? 0 : tiltAngle,
    "--mf-stc-persp": `${perspective}px`,
    "--mf-stc-card-h": `${Math.round(height * 0.5)}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()} data-axis={axis}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title}>
        <div className={styles.content}>
          <header className={styles.intro}>
            <span className={styles.kicker}>Scroll Tilt</span>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>Cards tip in, settle flat at center, then tilt away.</p>
          </header>
          <ul className={styles.list}>
            {items.map((item, i) => (
              <li
                key={`${item}-${i}`}
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                className={styles.card}
                style={{ "--mf-stc-i": i } as React.CSSProperties}
              >
                <div className={styles.face}>
                  <span aria-hidden="true" className={styles.glow} />
                  <span aria-hidden="true" className={styles.grid} />
                  <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.cardTitle}>{item}</span>
                  <span className={styles.blurb}>{BLURBS[i % BLURBS.length]}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className={styles.outro}>Flat when it matters, dimensional in between.</p>
        </div>
      </div>
    </div>
  );
}
