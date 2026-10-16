"use client";

import * as React from "react";
import styles from "../styles/parallax-layers.module.css";

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

export interface ParallaxLayersProps {
  /** Headline shown on the first screen */
  title?: string;
  /** Supporting line under the headline */
  subtitle?: string;
  /** Number of depth layers (2–5) */
  layers?: number;
  /** Multiplier for the speed difference between layers */
  depth?: number;
  /** Primary layer color */
  color1?: string;
  /** Secondary layer color */
  color2?: string;
  /** Tertiary layer color */
  color3?: string;
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

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

type LayerKind = "orb" | "ring" | "card" | "dot" | "spark";

/** Back-to-front layer recipes; speed is the fraction of the scroll distance a layer travels. */
const LAYERS: { kind: LayerKind; speed: number; count: number }[] = [
  { kind: "orb", speed: 0.12, count: 4 },
  { kind: "ring", speed: 0.32, count: 6 },
  { kind: "card", speed: 0.58, count: 6 },
  { kind: "dot", speed: 0.85, count: 14 },
  { kind: "spark", speed: 1.4, count: 9 },
];

const SCREENS = 3;

export function ParallaxLayers({
  title = "Depth in motion",
  subtitle = "Five planes drift at five speeds. Scroll inside to feel the space open up.",
  layers = 5,
  depth = 1,
  color1 = "#a78bfa",
  color2 = "#38bdf8",
  color3 = "#f472b6",
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ParallaxLayersProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback((state: SmoothScrollState) => {
    rootRef.current?.style.setProperty("--mf-pl-s", state.scroll.toFixed(2));
  }, []);

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  const count = clamp(Math.round(layers), 2, 5);
  const picked = Array.from({ length: count }, (_, i) => Math.round((i * (LAYERS.length - 1)) / (count - 1)));
  const colors = [color1, color2, color3];
  const safeDepth = Math.max(0, depth);
  const travel = height * (SCREENS - 1);

  const vars = {
    "--mf-pl-h": `${height}px`,
    "--mf-pl-r": `${borderRadius}px`,
    "--mf-pl-c1": color1,
    "--mf-pl-c2": color2,
    "--mf-pl-c3": color3,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title}>
        <div className={styles.content}>
          <div aria-hidden="true" className={styles.stage}>
            {picked.map((layerIndex, order) => {
              const layer = LAYERS[layerIndex];
              const speed = layer.speed * safeDepth;
              const span = height + travel * speed;
              return (
                <div
                  key={layer.kind}
                  className={`${styles.layer} ${styles[layer.kind]}`}
                  style={{ "--mf-pl-f": speed.toFixed(3), zIndex: order } as React.CSSProperties}
                >
                  {Array.from({ length: layer.count }, (_, i) => {
                    const seed = layerIndex * 97 + i * 13;
                    const top = ((i + rand(seed)) / layer.count) * span - height * 0.08;
                    const left = rand(seed + 1) * 92;
                    const size = 0.6 + rand(seed + 2) * 0.8;
                    return (
                      <span
                        key={i}
                        className={styles.item}
                        style={
                          {
                            top: `${top.toFixed(1)}px`,
                            left: `${left.toFixed(2)}%`,
                            "--mf-pl-size": size.toFixed(3),
                            "--mf-pl-c": colors[(i + layerIndex) % 3],
                            "--mf-pl-rot": `${Math.round(rand(seed + 3) * 40 - 20)}deg`,
                          } as React.CSSProperties
                        }
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <section className={styles.screen}>
            <span className={styles.kicker}>Parallax Layers</span>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>{subtitle}</p>
          </section>
          <section className={styles.screen}>
            <p className={styles.statement}>
              Back layers crawl.
              <br />
              <span className={styles.accentText}>Front layers race.</span>
            </p>
          </section>
          <section className={styles.screen}>
            <p className={styles.statement}>
              Your eye reads the difference
              <br />
              as <span className={styles.accentText}>distance</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
