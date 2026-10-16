"use client";

import * as React from "react";
import styles from "../styles/image-compare.module.css";

export interface ImageCompareProps {
  /** URL of the "before" image (defaults to a muted gradient scene) */
  beforeSrc?: string;
  /** URL of the "after" image (defaults to a vivid gradient scene) */
  afterSrc?: string;
  /** Label and alt text of the before side */
  beforeLabel?: string;
  /** Label and alt text of the after side */
  afterLabel?: string;
  /** Controlled divider position in percent (0–100) */
  value?: number;
  /** Initial divider position in percent when uncontrolled */
  defaultValue?: number;
  /** Called with the new position while dragging or using the keyboard */
  onValueChange?: (value: number) => void;
  /** Divider direction: horizontal splits left/right, vertical splits top/bottom */
  orientation?: "horizontal" | "vertical";
  /** Show the Before/After corner labels */
  showLabels?: boolean;
  /** Play a short hint sweep on mount */
  intro?: boolean;
  /** Divider and handle color */
  handleColor?: string;
  /** Color of the handle arrows and focus glow */
  accentColor?: string;
  /** Keyboard step in percent */
  step?: number;
  /** Height in px */
  height?: number;
  /** Corner radius in px */
  borderRadius?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

function Scene({ src, alt, vivid }: { src?: string; alt: string; vivid: boolean }) {
  if (src) return <img className={styles.img} src={src} alt={alt} draggable={false} />;
  return (
    <div className={styles.scene} data-vivid={vivid ? "" : undefined} role="img" aria-label={alt}>
      <span className={styles.sun} />
      <span className={`${styles.ridge} ${styles.ridgeBack}`} />
      <span className={`${styles.ridge} ${styles.ridgeMid}`} />
      <span className={`${styles.ridge} ${styles.ridgeFront}`} />
      <span className={styles.water} />
    </div>
  );
}

export function ImageCompare({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
  value: valueProp,
  defaultValue = 50,
  onValueChange,
  orientation = "horizontal",
  showLabels = true,
  intro = true,
  handleColor = "#ffffff",
  accentColor = "#6366f1",
  step = 2,
  height = 360,
  borderRadius = 12,
  className = "",
  style,
}: ImageCompareProps) {
  const [inner, setInner] = React.useState(clamp(defaultValue));
  const controlled = valueProp !== undefined;
  const pos = clamp(controlled ? valueProp : inner);
  const [wiggle, setWiggle] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef(0);
  const vertical = orientation === "vertical";

  React.useEffect(() => {
    if (!intro || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1600);
      setWiggle(t >= 1 ? 0 : 16 * Math.sin(t * Math.PI * 3) * (1 - t) * (1 - t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [intro]);

  const set = (n: number) => {
    const next = Math.round(clamp(n) * 10) / 10;
    cancelAnimationFrame(rafRef.current);
    setWiggle(0);
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  const fromPointer = (e: React.PointerEvent) => {
    const r = rootRef.current?.getBoundingClientRect();
    if (!r) return;
    set(vertical ? ((e.clientY - r.top) / r.height) * 100 : ((e.clientX - r.left) / r.width) * 100);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: vertical ? step : -step,
      ArrowRight: step,
      ArrowUp: vertical ? -step : step,
      PageDown: -10,
      PageUp: 10,
    };
    if (e.key === "Home") set(0);
    else if (e.key === "End") set(100);
    else if (e.key in map) set(pos + map[e.key]);
    else return;
    e.preventDefault();
  };

  const shown = clamp(pos + wiggle);
  const valueText = `${Math.round(shown)}% ${beforeLabel}, ${Math.round(100 - shown)}% ${afterLabel}`;

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${className}`.trim()}
      data-orientation={orientation}
      data-dragging={dragging ? "" : undefined}
      style={
        {
          "--mf-ic-pos": `${shown}%`,
          "--mf-ic-handle": handleColor,
          "--mf-ic-accent": accentColor,
          height,
          borderRadius,
          ...style,
        } as React.CSSProperties
      }
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        fromPointer(e);
      }}
      onPointerMove={(e) => dragging && fromPointer(e)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <div className={styles.layer}>
        <Scene src={afterSrc} alt={afterLabel} vivid />
      </div>
      <div className={`${styles.layer} ${styles.before}`}>
        <Scene src={beforeSrc} alt={beforeLabel} vivid={false} />
      </div>
      {showLabels && (
        <>
          <span className={`${styles.tag} ${styles.tagBefore}`} data-hidden={shown < 14 ? "" : undefined} aria-hidden="true">
            {beforeLabel}
          </span>
          <span className={`${styles.tag} ${styles.tagAfter}`} data-hidden={shown > 86 ? "" : undefined} aria-hidden="true">
            {afterLabel}
          </span>
        </>
      )}
      <div className={styles.divider} aria-hidden="true" />
      <div
        role="slider"
        tabIndex={0}
        aria-label={`${beforeLabel} / ${afterLabel} comparison`}
        aria-orientation={orientation}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shown)}
        aria-valuetext={valueText}
        className={styles.handle}
        onKeyDown={onKeyDown}
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
        </svg>
      </div>
    </div>
  );
}
