"use client";

import * as React from "react";
import styles from "../styles/scroll-focus-list.module.css";

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

export interface ScrollFocusListProps {
  /** List entries; the one nearest the viewport center is in focus */
  items?: string[];
  /** Small label pinned at the top (also the region label) */
  title?: string;
  /** Maximum blur in px applied to entries far from center */
  blur?: number;
  /** Opacity of entries far from center (0..1) */
  minOpacity?: number;
  /** Scale of the focused entry (1 = no scaling) */
  scale?: number;
  /** Accent color for the focused entry marker */
  accentColor?: string;
  /** Text alignment of the list */
  align?: "left" | "center";
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

const DEFAULT_ITEMS = [
  "Design in the browser",
  "Prototype with real data",
  "Review on any device",
  "Ship behind a flag",
  "Measure what changed",
  "Learn and iterate",
  "Repeat, faster",
];

export function ScrollFocusList({
  items = DEFAULT_ITEMS,
  title = "How we build",
  blur = 5,
  minOpacity = 0.22,
  scale = 1.08,
  accentColor = "#facc15",
  align = "left",
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ScrollFocusListProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const scrollRef = React.useRef(0);

  const apply = React.useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const center = scrollRef.current + vp.clientHeight / 2;
    const half = Math.max(1, vp.clientHeight * 0.5);
    let nearest = -1;
    let best = Infinity;
    itemRefs.current.forEach((item, i) => {
      if (!item) return;
      const dist = Math.abs(item.offsetTop + item.offsetHeight / 2 - center);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
      item.style.setProperty("--mf-sfl-d", clamp(dist / half, 0, 1).toFixed(4));
    });
    itemRefs.current.forEach((item, i) => {
      if (item) item.dataset.active = String(i === nearest);
    });
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
    "--mf-sfl-h": `${height}px`,
    "--mf-sfl-r": `${borderRadius}px`,
    "--mf-sfl-accent": accentColor,
    "--mf-sfl-blur": `${reduced ? 0 : Math.max(0, blur)}px`,
    "--mf-sfl-min": clamp(minOpacity, 0, 1),
    "--mf-sfl-scale": reduced ? 1 : scale,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()} data-align={align}>
      <span className={styles.kicker} aria-hidden="true">
        {title}
      </span>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title}>
        <ol className={styles.list}>
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
              className={styles.item}
              data-active={i === 0 ? "true" : "false"}
            >
              <span className={styles.index} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={styles.text}>{item}</span>
            </li>
          ))}
        </ol>
      </div>
      <span aria-hidden="true" className={styles.fadeTop} />
      <span aria-hidden="true" className={styles.fadeBottom} />
    </div>
  );
}
