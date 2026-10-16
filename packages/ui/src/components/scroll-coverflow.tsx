"use client";

import * as React from "react";
import styles from "../styles/scroll-coverflow.module.css";

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

export interface ScrollCoverflowProps {
  /** Card titles, one card per item */
  items?: string[];
  /** Heading shown above the carousel (also the region label) */
  title?: string;
  /** Rotation in degrees of cards beside the center card */
  angle?: number;
  /** Horizontal distance in px between neighbouring cards */
  spacing?: number;
  /** How far in px side cards are pushed back in depth */
  depth?: number;
  /** Accent color for kicker, caption and progress dots */
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

const DEFAULT_ITEMS = ["Midnight Drive", "Neon Bloom", "Low Tide", "Paper Moons", "Afterglow", "Static Hearts", "Golden Hour"];
const META = ["Synthwave", "Dream pop", "Ambient", "Indie folk", "Chillwave", "Electronica", "Soul"];
const PALETTE = ["#f472b6", "#a78bfa", "#60a5fa", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];

export function ScrollCoverflow({
  items = DEFAULT_ITEMS,
  title = "Scroll through the collection",
  angle = 55,
  spacing = 120,
  depth = 180,
  accentColor = "#a78bfa",
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ScrollCoverflowProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = React.useState(0);
  const total = items.length;
  const perCard = Math.round(height * 0.5);

  const handleScroll = React.useCallback(
    ({ progress }: SmoothScrollState) => {
      const t = progress * Math.max(0, total - 1);
      for (let i = 0; i < total; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;
        const d = i - t;
        const a = Math.abs(d);
        const s = Math.sign(d);
        const near = Math.min(a, 1);
        const far = Math.max(0, a - 1);
        const x = s * (near * spacing * 1.25 + far * spacing * 0.62);
        card.style.setProperty("--mf-scf-x", `${x.toFixed(2)}px`);
        card.style.setProperty("--mf-scf-z", `${(-(near * depth + far * depth * 0.22)).toFixed(2)}px`);
        card.style.setProperty("--mf-scf-ry", `${(-s * near * angle).toFixed(2)}deg`);
        card.style.setProperty("--mf-scf-b", (1 - near * 0.3 - far * 0.08).toFixed(3));
        card.style.setProperty("--mf-scf-o", clamp(1 - Math.max(0, a - 2.6) * 0.8, 0, 1).toFixed(3));
        card.style.zIndex = String(1000 - Math.round(a * 10));
      }
      setActive(clamp(Math.round(t), 0, Math.max(0, total - 1)));
    },
    [total, spacing, depth, angle],
  );

  useSmoothScroll(viewportRef, { lerp, wheelMultiplier, smooth: smooth && !reduced, onScroll: handleScroll });

  const goTo = (i: number) => {
    const el = viewportRef.current;
    if (!el || total < 2) return;
    const limit = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: (i / (total - 1)) * limit, behavior: reduced ? "auto" : "smooth" });
  };

  const cardH = Math.round(height * 0.5);
  const vars = {
    "--mf-scf-h": `${height}px`,
    "--mf-scf-r": `${borderRadius}px`,
    "--mf-scf-accent": accentColor,
    "--mf-scf-card-h": `${cardH}px`,
    "--mf-scf-card-w": `${Math.round(cardH * 0.8)}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div style={vars} className={`${styles.root} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label={title}>
        <div className={styles.track} style={{ height: height + Math.max(0, total - 1) * perCard }}>
          <div className={styles.stage}>
            <header className={styles.header}>
              <span className={styles.kicker}>Coverflow</span>
              <h3 className={styles.title}>{title}</h3>
            </header>
            <ul className={styles.ring}>
              {items.map((item, i) => {
                const c1 = PALETTE[i % PALETTE.length];
                const c2 = PALETTE[(i + 2) % PALETTE.length];
                return (
                  <li
                    key={`${item}-${i}`}
                    ref={(node) => {
                      cardRefs.current[i] = node;
                    }}
                    className={styles.card}
                    aria-current={i === active ? "true" : undefined}
                    style={{ "--mf-scf-c1": c1, "--mf-scf-c2": c2 } as React.CSSProperties}
                  >
                    <svg aria-hidden="true" className={styles.art} viewBox="0 0 100 100" preserveAspectRatio="none">
                      <circle cx={30 + ((i * 23) % 45)} cy={32 + ((i * 17) % 30)} r={22 + (i % 3) * 6} fill="rgba(255,255,255,0.22)" />
                      <circle cx={70 - ((i * 13) % 40)} cy={70} r={14 + (i % 4) * 4} fill="rgba(0,0,0,0.18)" />
                      <path d={`M0 ${78 - (i % 3) * 6} Q 50 ${58 + (i % 4) * 5} 100 ${74 - (i % 2) * 8} L100 100 L0 100 Z`} fill="rgba(0,0,0,0.22)" />
                    </svg>
                    <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.cardText}>
                      <span className={styles.cardTitle}>{item}</span>
                      <span className={styles.cardMeta}>{META[i % META.length]}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className={styles.footer}>
              <span className={styles.caption} aria-live="polite">
                {items[active]}
                <span className={styles.count}>{` ${String(active + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}</span>
              </span>
              <div className={styles.dots}>
                {items.map((item, i) => (
                  <button
                    key={`${item}-dot-${i}`}
                    type="button"
                    className={styles.dot}
                    data-active={i === active ? "" : undefined}
                    aria-label={`Show ${item}`}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
