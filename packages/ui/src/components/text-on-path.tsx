"use client";

import * as React from "react";
import styles from "../styles/text-on-path.module.css";

export type TextOnPathPreset = "wave" | "circle" | "arc";

export interface TextOnPathProps {
  /** Text that flows along the path (repeated to fill it) */
  text?: string;
  /** Separator inserted between repeats */
  separator?: string;
  /** Path shape preset */
  path?: TextOnPathPreset;
  /** Flow speed multiplier (0 = static) */
  speed?: number;
  /** Flow direction along the path */
  direction?: "forward" | "reverse";
  /** Draw the guide path underneath the text */
  showPath?: boolean;
  /** Fill the text with a gradient from the text color to the accent color */
  gradient?: boolean;
  /** Text color (defaults to the theme foreground) */
  color?: string;
  /** Accent color used for the gradient end */
  accentColor?: string;
  /** Guide path stroke color (defaults to the theme strong border) */
  pathColor?: string;
  /** Font size in SVG user units */
  fontSize?: number;
  /** Height of the drawing in pixels */
  height?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const PRESETS: Record<TextOnPathPreset, { w: number; h: number; d: string; fontScale: number }> = {
  wave: {
    w: 1000,
    h: 320,
    d: "M 0 160 C 83 50, 167 50, 250 160 S 417 270, 500 160 S 667 50, 750 160 S 917 270, 1000 160",
    fontScale: 1,
  },
  circle: {
    w: 600,
    h: 600,
    d: "M 300 85 A 215 215 0 1 1 300 515 A 215 215 0 1 1 300 85",
    fontScale: 1.25,
  },
  arc: {
    w: 1000,
    h: 420,
    d: "M 90 370 Q 500 -50 910 370",
    fontScale: 1.1,
  },
};

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

interface Fit {
  copies: number;
  unit: number;
}

export function TextOnPath({
  text = "MOTION FOUNDRY",
  separator = " • ",
  path = "wave",
  speed = 1,
  direction = "forward",
  showPath = true,
  gradient = true,
  color,
  accentColor = "#a78bfa",
  pathColor,
  fontSize = 40,
  height = 340,
  className = "",
  style,
}: TextOnPathProps) {
  const rawId = React.useId();
  const uid = `mf-tp-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const preset = PRESETS[path] ?? PRESETS.wave;
  const size = fontSize * preset.fontScale;
  const unitText = `${text}${separator}`;

  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const pathRef = React.useRef<SVGPathElement | null>(null);
  const measureRef = React.useRef<SVGTextElement | null>(null);
  const textPathRef = React.useRef<SVGTextPathElement | null>(null);
  const [fit, setFit] = React.useState<Fit | null>(null);

  useIsoLayoutEffect(() => {
    const measure = () => {
      const p = pathRef.current;
      const m = measureRef.current;
      if (!p || !m) return;
      const total = p.getTotalLength();
      const raw = m.getComputedTextLength();
      if (!(total > 0) || !(raw > 0)) return;
      const k = Math.max(1, Math.round(total / raw));
      setFit({ copies: k + 1, unit: total / k });
    };
    measure();
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [unitText, size, path]);

  React.useEffect(() => {
    const tp = textPathRef.current;
    const svg = svgRef.current;
    if (!tp || !svg || !fit) return;
    const unit = fit.unit;
    const place = (phase: number) => {
      const m = ((phase % unit) + unit) % unit;
      const offset = direction === "reverse" ? -m : m - unit;
      tp.setAttribute("startOffset", offset.toFixed(2));
    };
    place(0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || speed === 0) return;

    let raf = 0;
    let visible = true;
    let phase = 0;
    let last = performance.now();
    const pxPerSec = 60 * speed;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      phase += pxPerSec * dt;
      place(phase);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    raf = requestAnimationFrame(tick);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      });
      io.observe(svg);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [fit, speed, direction]);

  const copies = fit ? fit.copies : 6;
  const flowing = Array.from({ length: copies }, () => unitText).join("");
  const vars = {
    "--mf-tp-height": `${height}px`,
    "--mf-tp-accent": accentColor,
    ...(color ? { "--mf-tp-color": color } : {}),
    ...(pathColor ? { "--mf-tp-path": pathColor } : {}),
    ...style,
  } as React.CSSProperties;

  return (
    <div className={`${styles.root} ${className}`.trim()} style={vars}>
      <span className={styles.srOnly}>{text}</span>
      <svg
        ref={svgRef}
        aria-hidden="true"
        className={styles.svg}
        viewBox={`0 0 ${preset.w} ${preset.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <path id={`${uid}-path`} ref={pathRef} d={preset.d} />
          <linearGradient id={`${uid}-grad`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={preset.w} y2="0">
            <stop offset="0%" className={styles.stopA} />
            <stop offset="100%" className={styles.stopB} />
          </linearGradient>
        </defs>
        {showPath ? <use href={`#${uid}-path`} className={styles.guide} /> : null}
        <text ref={measureRef} className={styles.measure} fontSize={size}>
          {unitText}
        </text>
        <text
          className={styles.text}
          fontSize={size}
          style={gradient ? { fill: `url(#${uid}-grad)` } : undefined}
          dominantBaseline="central"
        >
          <textPath
            ref={textPathRef}
            href={`#${uid}-path`}
            textLength={fit ? (fit.unit * fit.copies).toFixed(2) : undefined}
            lengthAdjust="spacing"
          >
            {flowing}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
