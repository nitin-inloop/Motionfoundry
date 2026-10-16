"use client";

import * as React from "react";
import styles from "../styles/scroll-color-shift.module.css";

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

type RGB = [number, number, number];

function parseHex(hex: string, fallback: RGB): RGB {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const DARK_TEXT: RGB = [12, 12, 18];
const LIGHT_TEXT: RGB = [248, 248, 250];

function textFor(bg: RGB, mode: "auto" | "light" | "dark"): RGB {
  if (mode === "light") return LIGHT_TEXT;
  if (mode === "dark") return DARK_TEXT;
  const lum = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
  return lum > 0.55 ? DARK_TEXT : LIGHT_TEXT;
}

const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ")})`;

export interface ScrollColorShiftProps {
  /** Section titles; the background shifts color between consecutive sections */
  sections?: string[];
  /** Background of section 1 (repeats every 4 sections) */
  color1?: string;
  /** Background of section 2 */
  color2?: string;
  /** Background of section 3 */
  color3?: string;
  /** Background of section 4 */
  color4?: string;
  /** Text color: "auto" picks light or dark per background for contrast */
  textMode?: "auto" | "light" | "dark";
  /** Portion of the scroll between sections spent blending (0.1 = quick swap, 1 = continuous) */
  blend?: number;
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

const DEFAULT_SECTIONS = ["Midnight", "Ember", "Daylight", "Ultraviolet"];
const BLURBS = [
  "Start somewhere quiet, deep and focused.",
  "Then turn up the heat as momentum builds.",
  "Bright, open and impossible to miss.",
  "And finish with something a little electric.",
];

export function ScrollColorShift({
  sections = DEFAULT_SECTIONS,
  color1 = "#0f172a",
  color2 = "#ea580c",
  color3 = "#fde68a",
  color4 = "#6d28d9",
  textMode = "auto",
  blend = 0.6,
  height = 380,
  borderRadius = 20,
  lerp = 0.1,
  wheelMultiplier = 1,
  smooth = true,
  className = "",
  style,
}: ScrollColorShiftProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const counterRef = React.useRef<HTMLSpanElement>(null);
  const sectionRefs = React.useRef<(HTMLElement | null)[]>([]);
  const scrollRef = React.useRef(0);
  const count = sections.length;

  const palette = React.useMemo(() => {
    const bgs = [color1, color2, color3, color4].map((c, i) => parseHex(c, i % 2 ? LIGHT_TEXT : DARK_TEXT));
    return bgs.map((bg) => ({ bg, fg: textFor(bg, textMode) }));
  }, [color1, color2, color3, color4, textMode]);

  const apply = React.useCallback(() => {
    const vp = viewportRef.current;
    const root = rootRef.current;
    if (!vp || !root || count === 0) return;
    const center = scrollRef.current + vp.clientHeight / 2;
    const mids = sectionRefs.current.slice(0, count).map((s) => (s ? s.offsetTop + s.offsetHeight / 2 : 0));
    let i = 0;
    while (i < count - 2 && center > mids[i + 1]) i++;
    const span = Math.max(1, (mids[i + 1] ?? mids[i]) - mids[i]);
    const raw = count > 1 ? clamp((center - mids[i]) / span, 0, 1) : 0;
    const b = clamp(blend, 0.05, 1);
    let t = clamp((raw - (1 - b) / 2) / b, 0, 1);
    t = reduced ? Math.round(t) : t * t * (3 - 2 * t);
    const a = palette[i % 4];
    const z = palette[Math.min(i + 1, count - 1) % 4];
    root.style.setProperty("--mf-scs-bg", mix(a.bg, z.bg, t));
    root.style.setProperty("--mf-scs-fg", mix(a.fg, z.fg, t));
    const current = raw > 0.5 ? Math.min(i + 1, count - 1) : i;
    if (counterRef.current) {
      counterRef.current.textContent = `${String(current + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
    }
  }, [blend, count, palette, reduced]);

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
  }, [apply]);

  const vars = {
    "--mf-scs-h": `${height}px`,
    "--mf-scs-r": `${borderRadius}px`,
    "--mf-scs-bg": mix(palette[0].bg, palette[0].bg, 0),
    "--mf-scs-fg": mix(palette[0].fg, palette[0].fg, 0),
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={vars} className={`${styles.root} ${className}`.trim()}>
      <span ref={counterRef} className={styles.counter} aria-hidden="true">
        {`01 / ${String(count).padStart(2, "0")}`}
      </span>
      <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label="Color sections">
        <div className={styles.content}>
          {sections.map((title, i) => (
            <section
              key={`${title}-${i}`}
              ref={(node) => {
                sectionRefs.current[i] = node;
              }}
              className={styles.section}
              style={{ "--mf-scs-i": i } as React.CSSProperties}
            >
              <svg aria-hidden="true" className={styles.rings} viewBox="0 0 200 200">
                {[90, 68, 46, 24].map((r, k) => (
                  <circle key={r} cx="100" cy="100" r={r} strokeDasharray={k % 2 ? "3 7" : undefined} />
                ))}
              </svg>
              <span className={styles.kicker}>{`Chapter ${String(i + 1).padStart(2, "0")}`}</span>
              <h3 className={styles.title}>{title}</h3>
              <p className={styles.text}>{BLURBS[i % BLURBS.length]}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
