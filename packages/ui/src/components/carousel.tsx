"use client";

import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import styles from "../styles/carousel.module.css";

export interface CarouselItem {
  /** Slide heading */
  title: string;
  /** Supporting line */
  description?: string;
  /** Small label above the heading */
  eyebrow?: string;
  /** Any CSS background (color, gradient or url()) */
  background?: string;
}

export interface CarouselProps {
  /** Slides to show (defaults to five gradient feature slides) */
  items?: CarouselItem[];
  /** Accessible name of the carousel */
  label?: string;
  /** Controlled active slide index */
  value?: number;
  /** Initial slide index when uncontrolled */
  defaultValue?: number;
  /** Called with the new slide index */
  onValueChange?: (index: number) => void;
  /** Advance automatically (pauses on hover, focus and drag) */
  autoplay?: boolean;
  /** Autoplay interval in ms */
  interval?: number;
  /** Wrap from the last slide to the first and back */
  loop?: boolean;
  /** Show previous/next arrow buttons */
  showArrows?: boolean;
  /** Show the dot pagination */
  showDots?: boolean;
  /** Allow drag/swipe navigation */
  draggable?: boolean;
  /** Color of the active dot and its progress fill */
  accentColor?: string;
  /** Height in px */
  height?: number;
  /** Corner radius in px */
  borderRadius?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS: CarouselItem[] = [
  { eyebrow: "Motion", title: "Design at the speed of thought", description: "Compose interfaces from motion-first primitives.", background: "linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)" },
  { eyebrow: "Quality", title: "Ship with confidence", description: "Typed, tested, and tuned for every screen size.", background: "linear-gradient(135deg, #0369a1 0%, #0891b2 100%)" },
  { eyebrow: "Access", title: "Accessible by default", description: "Keyboard, screen reader and reduced-motion ready.", background: "linear-gradient(135deg, #be123c 0%, #ea580c 100%)" },
  { eyebrow: "Theming", title: "Themeable everywhere", description: "One set of tokens drives light and dark modes.", background: "linear-gradient(135deg, #047857 0%, #4d7c0f 100%)" },
  { eyebrow: "Platform", title: "Built for the web", description: "Zero heavy dependencies, server-render safe.", background: "linear-gradient(135deg, #b45309 0%, #b91c1c 100%)" },
];

export function Carousel({
  items = DEFAULT_ITEMS,
  label = "Product highlights",
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  autoplay = true,
  interval = 4500,
  loop = true,
  showArrows = true,
  showDots = true,
  draggable = true,
  accentColor = "#6366f1",
  height = 340,
  borderRadius = 14,
  className = "",
  style,
}: CarouselProps) {
  const reduce = useReducedMotion();
  const n = items.length;
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = valueProp !== undefined;
  const index = Math.max(0, Math.min(n - 1, controlled ? valueProp : inner));
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const x = useMotionValue(0);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [playing, setPlaying] = React.useState(autoplay);
  const id = React.useId();

  const go = React.useCallback(
    (i: number) => {
      const next = loop ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i));
      if (!controlled) setInner(next);
      if (next !== index) onValueChange?.(next);
    },
    [controlled, index, loop, n, onValueChange],
  );

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (!width) return;
    const target = -index * width;
    if (reduce) {
      x.set(target);
      return;
    }
    const ctrl = animate(x, target, { type: "spring", stiffness: 260, damping: 32, mass: 0.9 });
    return () => ctrl.stop();
  }, [index, width, reduce, x]);

  const paused = !playing || hovered || focused || dragging || Boolean(reduce) || n < 2;
  React.useEffect(() => {
    if (paused) return;
    if (!loop && index >= n - 1) return;
    const t = window.setTimeout(() => go(index + 1), Math.max(1000, interval));
    return () => window.clearTimeout(t);
  }, [paused, index, interval, loop, n, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false);
    const th = width * 0.18;
    if (info.offset.x < -th || info.velocity.x < -500) go(index + 1);
    else if (info.offset.x > th || info.velocity.x > 500) go(index - 1);
    else animate(x, -index * width, { type: "spring", stiffness: 320, damping: 34 });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
    else return;
    e.preventDefault();
  };

  const canPrev = loop || index > 0;
  const canNext = loop || index < n - 1;
  const chevron = (d: string) => (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );

  return (
    <section
      className={`${styles.root} ${className}`.trim()}
      aria-roledescription="carousel"
      aria-label={label}
      data-paused={paused ? "" : undefined}
      style={{ "--mf-cr-accent": accentColor, "--mf-cr-interval": `${Math.max(1000, interval)}ms`, "--mf-cr-radius": `${borderRadius}px`, ...style } as React.CSSProperties}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
    >
      <div ref={viewportRef} className={styles.viewport} style={{ height }}>
        <motion.div
          id={`${id}-track`}
          className={styles.track}
          aria-live={playing && autoplay && !reduce ? "off" : "polite"}
          style={{ x }}
          drag={draggable && n > 1 ? "x" : false}
          dragConstraints={{ left: -(n - 1) * width, right: 0 }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragStart={() => setDragging(true)}
          onDragEnd={onDragEnd}
        >
          {items.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              aria-hidden={i !== index}
              className={styles.slide}
              data-active={i === index ? "" : undefined}
              style={{ background: item.background ?? "var(--mf-surface-raised, #1b1b22)" }}
            >
              <div className={styles.content}>
                {item.eyebrow && <span className={styles.eyebrow}>{item.eyebrow}</span>}
                <h3 className={styles.title}>{item.title}</h3>
                {item.description && <p className={styles.desc}>{item.description}</p>}
              </div>
            </div>
          ))}
        </motion.div>
        {showArrows && n > 1 && (
          <>
            <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-controls={`${id}-track`} aria-label="Previous slide" disabled={!canPrev} onClick={() => go(index - 1)}>
              {chevron("m15 6-6 6 6 6")}
            </button>
            <button type="button" className={`${styles.arrow} ${styles.next}`} aria-controls={`${id}-track`} aria-label="Next slide" disabled={!canNext} onClick={() => go(index + 1)}>
              {chevron("m9 6 6 6-6 6")}
            </button>
          </>
        )}
      </div>
      <div className={styles.controls}>
        {autoplay && n > 1 && (
          <button type="button" className={styles.play} aria-label={playing ? "Stop automatic slide show" : "Start automatic slide show"} onClick={() => setPlaying((p) => !p)}>
            {playing ? (
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5z" /></svg>
            )}
          </button>
        )}
        {showDots && n > 1 && (
          <div className={styles.dots}>
            {items.map((item, i) => (
              <button
                key={`${item.title}-${i}`}
                type="button"
                className={styles.dot}
                aria-label={`Go to slide ${i + 1}: ${item.title}`}
                aria-current={i === index ? "true" : undefined}
                aria-controls={`${id}-track`}
                onClick={() => go(i)}
              >
                {i === index && <span key={`fill-${index}-${paused ? "p" : "r"}`} className={styles.fill} data-run={autoplay && !paused ? "" : undefined} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
