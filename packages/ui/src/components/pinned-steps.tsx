"use client";

import * as React from "react";
import styles from "../styles/pinned-steps.module.css";

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

export interface PinnedStepsProps {
  /** Step titles, one pinned step per item */
  steps?: string[];
  /** Heading shown above the step list (also the region label) */
  title?: string;
  /** Accent color for the active step, progress and visuals */
  accentColor?: string;
  /** How the right-hand visual changes between steps */
  transition?: "fade" | "slide" | "zoom";
  /** Duration in ms of the visual crossfade */
  transitionDuration?: number;
  /** Show the progress line inside the active step and the overall bar */
  showProgress?: boolean;
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

const DEFAULT_STEPS = ["Connect your sources", "Map the signals", "Watch it trend", "Ship the insight"];
const DESCRIPTIONS = [
  "Plug in databases, events and spreadsheets in a couple of clicks. Schemas sync automatically.",
  "Group raw events into the metrics your team actually talks about, with zero SQL.",
  "Live charts update as data lands, so changes surface the minute they happen.",
  "Share a link, schedule a digest or push alerts straight to the channel that cares.",
];
const NODES: [number, number][] = [
  [40, 60],
  [100, 30],
  [160, 60],
  [100, 90],
];

function StepArt({ kind }: { kind: number }) {
  if (kind === 0) {
    return (
      <svg viewBox="0 0 200 120" className={styles.art}>
        <path d="M40 60 L100 30 L160 60 L100 90 Z M40 60 L160 60 M100 30 L100 90" className={styles.stroke} />
        {NODES.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="11" className={styles.node} />
        ))}
        <circle cx="100" cy="60" r="16" className={styles.hub} />
      </svg>
    );
  }
  if (kind === 1) {
    return (
      <svg viewBox="0 0 200 120" className={styles.art}>
        {[48, 80, 36, 96, 64, 88, 56].map((h, b) => (
          <rect key={b} x={22 + b * 23} y={104 - h} width="15" height={h} rx="4" className={b === 3 ? styles.hub : styles.node} />
        ))}
      </svg>
    );
  }
  if (kind === 2) {
    return (
      <svg viewBox="0 0 200 120" className={styles.art}>
        <path d="M14 96 C 44 90, 54 60, 84 66 S 130 30, 186 20 L186 108 L14 108 Z" className={styles.area} />
        <path d="M14 96 C 44 90, 54 60, 84 66 S 130 30, 186 20" className={styles.stroke} />
        <circle cx="186" cy="20" r="6" className={styles.hub} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 120" className={styles.art}>
      <circle cx="100" cy="60" r="40" className={styles.area} />
      <circle cx="100" cy="60" r="40" className={styles.stroke} />
      <path d="M82 61 L95 74 L120 47" className={styles.check} />
    </svg>
  );
}

export function PinnedSteps({
  steps = DEFAULT_STEPS,
  title = "How it works",
  accentColor = "#34d399",
  transition = "slide",
  transitionDuration = 450,
  showProgress = true,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: PinnedStepsProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);
  const total = Math.max(1, steps.length);
  const perStep = Math.round(height * 0.8);

  const handleScroll = React.useCallback(
    ({ progress }: SmoothScrollState) => {
      const t = progress * total;
      const index = clamp(Math.floor(t), 0, total - 1);
      const stage = stageRef.current;
      if (stage) {
        stage.style.setProperty("--mf-pst-p", progress.toFixed(4));
        stage.style.setProperty("--mf-pst-l", clamp(t - index, 0, 1).toFixed(4));
      }
      setActive(index);
    },
    [total],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  const goTo = (i: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const limit = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: ((i + 0.04) / total) * limit, behavior: reduced ? "auto" : "smooth" });
  };

  const vars = {
    "--mf-pst-h": `${height}px`,
    "--mf-pst-r": `${borderRadius}px`,
    "--mf-pst-accent": accentColor,
    "--mf-pst-dur": `${Math.max(0, transitionDuration)}ms`,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()} data-transition={transition}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title}>
        <div style={{ height: height + total * perStep }}>
          <div ref={stageRef} className={styles.stage}>
            <div className={styles.left}>
              <span className={styles.kicker}>{`Step ${active + 1} of ${total}`}</span>
              <h3 className={styles.title}>{title}</h3>
              <ol className={styles.steps}>
                {steps.map((step, i) => (
                  <li key={`${step}-${i}`} className={styles.step} data-state={i === active ? "active" : i < active ? "done" : "todo"}>
                    <button
                      type="button"
                      className={styles.stepButton}
                      aria-current={i === active ? "step" : undefined}
                      onClick={() => goTo(i)}
                    >
                      <span className={styles.badge} aria-hidden="true">
                        {i < active ? "✓" : i + 1}
                      </span>
                      <span className={styles.stepTitle}>{step}</span>
                    </button>
                    <div className={styles.detail}>
                      <div className={styles.detailInner}>
                        {showProgress && (
                          <span className={styles.line} aria-hidden="true">
                            <span className={styles.lineFill} />
                          </span>
                        )}
                        <p className={styles.desc}>{DESCRIPTIONS[i % DESCRIPTIONS.length]}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className={styles.right} aria-hidden="true">
              <div className={styles.frame}>
                <div className={styles.chrome}>
                  <span className={styles.light} />
                  <span className={styles.light} />
                  <span className={styles.light} />
                  {showProgress && (
                    <span className={styles.bar}>
                      <span className={styles.barFill} />
                    </span>
                  )}
                </div>
                {steps.map((step, i) => (
                  <div
                    key={`${step}-v-${i}`}
                    className={styles.visual}
                    data-state={i === active ? "active" : i < active ? "before" : "after"}
                    style={{ "--mf-pst-hue": `${i * 38}deg` } as React.CSSProperties}
                  >
                    <StepArt kind={i % 4} />
                    <span className={styles.visualLabel}>{step}</span>
                  </div>
                ))}
              </div>
              <div className={styles.dots}>
                {steps.map((step, i) => (
                  <span key={`${step}-d-${i}`} className={styles.dot} data-active={i === active ? "" : undefined} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
