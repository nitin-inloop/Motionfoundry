"use client";

import * as React from "react";
import styles from "../styles/scroll-word-swap.module.css";

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

export interface ScrollWordSwapProps {
  /** Text before the swapping word */
  prefix?: string;
  /** Words swapped in one per scroll section */
  words?: string[];
  /** Text after the swapping word */
  suffix?: string;
  /** Tint colors per word (word color and background wash), cycled */
  colors?: string[];
  /** Transition used when the word swaps */
  effect?: "slide" | "blur" | "flip";
  /** Swap transition duration in ms */
  duration?: number;
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

const DEFAULT_WORDS = ["fast", "alive", "honest", "effortless", "yours"];
const DEFAULT_COLORS = ["#38bdf8", "#f472b6", "#fbbf24", "#34d399", "#a78bfa"];

export function ScrollWordSwap({
  prefix = "Interfaces that feel",
  words = DEFAULT_WORDS,
  suffix = ".",
  colors = DEFAULT_COLORS,
  effect = "slide",
  duration = 600,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ScrollWordSwapProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const headlineRef = React.useRef<HTMLSpanElement>(null);
  const wordRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = React.useState(0);
  const [widths, setWidths] = React.useState<number[] | null>(null);
  const list = words.length > 0 ? words : DEFAULT_WORDS;
  const tints = colors.length > 0 ? colors : DEFAULT_COLORS;
  const total = list.length;

  const handleScroll = React.useCallback(
    ({ progress }: SmoothScrollState) => {
      const t = progress * total;
      stageRef.current?.style.setProperty("--mf-sws-t", t.toFixed(4));
      setActive(clamp(Math.floor(t), 0, total - 1));
    },
    [total],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  React.useEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;
    const measure = () => setWidths(wordRefs.current.slice(0, total).map((w) => (w ? Math.ceil(w.scrollWidth) : 0)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(headline);
    return () => ro.disconnect();
  }, [total, list.join("|")]);

  const tint = tints[active % tints.length];
  const slotWidth = widths && widths[active] ? `${widths[active]}px` : `${Math.max(2, list[active].length * 0.56)}em`;

  const vars = {
    "--mf-sws-h": `${height}px`,
    "--mf-sws-r": `${borderRadius}px`,
    "--mf-sws-dur": `${Math.max(0, duration)}ms`,
    "--mf-sws-tint": tint,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()} data-effect={effect}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={`${prefix} ${list.join(", ")}${suffix}`}>
        <div style={{ height: height + total * Math.round(height * 0.7) }}>
          <div ref={stageRef} className={styles.stage}>
            {list.map((word, i) => (
              <span
                key={`${word}-bg-${i}`}
                aria-hidden="true"
                className={styles.wash}
                data-active={i === active ? "" : undefined}
                style={{ "--mf-sws-c": tints[i % tints.length] } as React.CSSProperties}
              />
            ))}
            <span className={styles.kicker}>{`${String(active + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}</span>
            <h3 className={styles.headline}>
              <span className={styles.srOnly}>{`${prefix} ${list.join(", ")}${suffix}`}</span>
              <span ref={headlineRef} aria-hidden="true" className={styles.visual}>
                {prefix}{" "}
                <span className={styles.slot} style={{ width: slotWidth }}>
                  {list.map((word, i) => (
                    <span
                      key={`${word}-${i}`}
                      ref={(node) => {
                        wordRefs.current[i] = node;
                      }}
                      className={styles.word}
                      data-state={i === active ? "active" : i < active ? "before" : "after"}
                      style={{ "--mf-sws-c": tints[i % tints.length] } as React.CSSProperties}
                    >
                      {word}
                    </span>
                  ))}
                </span>
                {suffix}
              </span>
            </h3>
            <div className={styles.progress} aria-hidden="true">
              {list.map((word, i) => (
                <span key={`${word}-p-${i}`} className={styles.segment} data-active={i === active ? "" : undefined}>
                  <span className={styles.track}>
                    <span className={styles.fill} style={{ "--mf-sws-i": i } as React.CSSProperties} />
                  </span>
                  <span className={styles.segmentLabel}>{word}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
