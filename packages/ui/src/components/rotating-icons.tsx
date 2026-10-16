"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/rotating-icons.module.css";

export type RotatingIconName = "scroll" | "shader" | "interface" | "sparkles" | "cursor" | "layers" | "code" | "palette" | "zap" | "globe";

export interface RotatingIconsProps {
  /** Static text before the rotating icon (empty hides it) */
  prefix?: string;
  /** Icons to cycle through, in order */
  icons?: RotatingIconName[];
  /** Spoken label per icon, in the same order (defaults to the icon names) */
  labels?: string[];
  /** Milliseconds each icon stays visible */
  interval?: number;
  /** Flip duration in seconds */
  duration?: number;
  /** Direction the cube rolls */
  direction?: "up" | "down";
  /** Render each icon inside a rounded tile */
  tile?: boolean;
  /** Icon stroke color */
  iconColor?: string;
  /** Tile background color (when tile is on) */
  tileColor?: string;
  /** Prefix text color (defaults to the theme foreground) */
  color?: string;
  /** Font size of the prefix in px — the icon scales with it */
  fontSize?: number;
  /** Element rendered for the whole line */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const ICON_PATHS: Record<RotatingIconName, string[]> = {
  scroll: ["M12 2a6 6 0 0 1 6 6v8a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z", "M12 6v4", "M9 21l3 2 3-2"],
  shader: ["M12 3a9 9 0 1 0 9 9", "M12 3a9 9 0 0 1 9 9", "M7.5 12a4.5 4.5 0 0 1 9 0", "M12 7.5a4.5 4.5 0 0 0 0 9"],
  interface: ["M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M3 9h18", "M9 21V9"],
  sparkles: ["M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z", "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"],
  cursor: ["M4 3l7 17 2.5-7.5L21 10z", "M13.5 12.5L20 19"],
  layers: ["M12 3l9 5-9 5-9-5z", "M3 13l9 5 9-5", "M3 17.5l9 5 9-5"],
  code: ["M8 7l-5 5 5 5", "M16 7l5 5-5 5", "M14 4l-4 16"],
  palette: ["M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.7 0-1.5-1.2-1.8-1.2-3 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z", "M7.5 11.5h.01", "M10 7.5h.01", "M15 7.5h.01"],
  zap: ["M13 2L4 14h7l-1 8 9-12h-7z"],
  globe: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M3 12h18", "M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"],
};

const DEFAULT_ICONS: RotatingIconName[] = ["scroll", "shader", "interface"];
const DEFAULT_LABELS: Record<RotatingIconName, string> = {
  scroll: "scroll",
  shader: "shaders",
  interface: "interfaces",
  sparkles: "delight",
  cursor: "interaction",
  layers: "depth",
  code: "developers",
  palette: "design",
  zap: "speed",
  globe: "the web",
};

function Glyph({ name }: { name: RotatingIconName }) {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function RotatingIcons({
  prefix = "built for",
  icons = DEFAULT_ICONS,
  labels,
  interval = 2200,
  duration = 0.6,
  direction = "up",
  tile = true,
  iconColor = "#fafafa",
  tileColor = "#1c1c1f",
  color,
  fontSize = 56,
  as: Tag = "p",
  className = "",
  style,
}: RotatingIconsProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = React.useRef<HTMLElement>(null);
  const list = icons.length > 0 ? icons : DEFAULT_ICONS;
  const spoken = list.map((icon, i) => labels?.[i] ?? DEFAULT_LABELS[icon] ?? icon);
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  // Pause the loop when off-screen or when the tab is hidden.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && document.visibilityState === "visible"));
    io.observe(el);
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  React.useEffect(() => {
    if (reduceMotion || !visible || list.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), Math.max(600, interval));
    return () => window.clearInterval(id);
  }, [reduceMotion, visible, list.length, interval]);

  const current = list[index % list.length];
  const sign = direction === "up" ? 1 : -1;
  const sentence = `${prefix ? `${prefix} ` : ""}${spoken.join(", ")}`;
  const ElementTag = Tag as React.ElementType;

  return (
    <ElementTag
      ref={rootRef}
      className={`${styles.root} ${className}`.trim()}
      style={
        {
          "--mf-ri-size": `${fontSize}px`,
          "--mf-ri-icon": iconColor,
          "--mf-ri-tile": tileColor,
          ...(color ? { color } : null),
          ...style,
        } as React.CSSProperties
      }
    >
      <span className={styles.srOnly}>{sentence}</span>
      <span className={styles.visual} aria-hidden="true">
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <span className={`${styles.slot} ${tile ? styles.tile : ""}`.trim()}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={`${index}-${current}`}
              className={styles.face}
              initial={reduceMotion ? false : { rotateX: -90 * sign, y: `${45 * sign}%`, opacity: 0 }}
              animate={{ rotateX: 0, y: "0%", opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { rotateX: 90 * sign, y: `${-45 * sign}%`, opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration, ease: [0.22, 1, 0.36, 1] }}
            >
              <Glyph name={current} />
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </ElementTag>
  );
}
