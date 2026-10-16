"use client";

import * as React from "react";
import styles from "../styles/sticky-stack-cards.module.css";

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

export interface StickyStackCardsProps {
  /** Card titles, one stacked card per item */
  items?: string[];
  /** Heading shown before the stack */
  title?: string;
  /** Vertical step in px between stacked cards */
  offset?: number;
  /** Scale reduction applied per card covering an earlier card */
  scaleStep?: number;
  /** Accent color for card glow and charts */
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

const DEFAULT_ITEMS = ["Research", "Wireframes", "Visual design", "Motion pass", "Launch"];

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const STICKY_TOP = 22;

export function StickyStackCards({
  items = DEFAULT_ITEMS,
  title = "Stacked, not stashed",
  offset = 14,
  scaleStep = 0.05,
  accentColor = "#f472b6",
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: StickyStackCardsProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLOListElement>(null);
  const cardRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const listTopRef = React.useRef(0);
  const lastScrollRef = React.useRef(0);

  const total = items.length;
  const cardHeight = Math.round(height * 0.6);
  const spacing = Math.round(height * 0.42);
  const slot = cardHeight + spacing;
  const distance = Math.max(1, slot - offset);

  const apply = React.useCallback(() => {
    const scroll = lastScrollRef.current;
    for (let i = 0; i < total; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      const stickAt = listTopRef.current + i * slot - (STICKY_TOP + i * offset);
      const covered = clamp((scroll - stickAt) / distance, 0, total - 1 - i);
      card.style.setProperty("--mf-ssc-c", covered.toFixed(4));
    }
  }, [total, slot, offset, distance]);

  const handleScroll = React.useCallback(
    (state: SmoothScrollState) => {
      lastScrollRef.current = state.scroll;
      apply();
    },
    [apply],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      listTopRef.current = list.offsetTop;
      apply();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [apply]);

  const vars = {
    "--mf-ssc-h": `${height}px`,
    "--mf-ssc-r": `${borderRadius}px`,
    "--mf-ssc-accent": accentColor,
    "--mf-ssc-step": scaleStep,
    "--mf-ssc-card-h": `${cardHeight}px`,
    "--mf-ssc-spacing": `${spacing}px`,
    "--mf-ssc-top": `${STICKY_TOP}px`,
    "--mf-ssc-offset": `${offset}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title}>
        <div className={styles.content}>
          <header className={styles.intro}>
            <span className={styles.kicker}>Sticky Stack</span>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>Scroll and each card settles on top of the last.</p>
          </header>
          <ol ref={listRef} className={styles.list}>
            {items.map((item, i) => (
              <li
                key={`${item}-${i}`}
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                className={styles.card}
                style={{ "--mf-ssc-i": i } as React.CSSProperties}
              >
                <span aria-hidden="true" className={styles.glow} />
                <div className={styles.cardHead}>
                  <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.chip}>{`Stage ${i + 1} of ${total}`}</span>
                </div>
                <span className={styles.cardTitle}>{item}</span>
                <span aria-hidden="true" className={styles.chart}>
                  {Array.from({ length: 12 }, (_, b) => (
                    <span
                      key={b}
                      className={styles.bar}
                      style={{ height: `${Math.round(22 + rand(i * 31 + b) * 78)}%` }}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ol>
          <p className={styles.outro}>That is the whole stack.</p>
        </div>
      </div>
    </div>
  );
}
