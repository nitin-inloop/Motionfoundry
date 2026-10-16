"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/typewriter.module.css";

export interface TypewriterProps {
  /** Words typed and deleted in sequence */
  words?: string[];
  /** Static text rendered before the typed word */
  prefix?: string;
  /** Milliseconds per typed character (deleting runs at twice the speed) */
  speed?: number;
  /** Milliseconds to hold a completed word before deleting */
  pause?: number;
  /** Show the blinking cursor */
  cursor?: boolean;
  /** Color of the typed word and cursor */
  accentColor?: string;
  /** Optional className */
  className?: string;
}

const DEFAULT_WORDS = ["interfaces", "landing pages", "dashboards", "design systems"];

export function Typewriter({
  words = DEFAULT_WORDS,
  prefix = "Build",
  speed = 70,
  pause = 1400,
  cursor = true,
  accentColor = "#38bdf8",
  className = "",
}: TypewriterProps) {
  const prefersReducedMotion = useReducedMotion();
  const list = words.length > 0 ? words : DEFAULT_WORDS;
  const [index, setIndex] = React.useState(0);
  const [text, setText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const word = list[index % list.length] ?? "";

  React.useEffect(() => {
    if (prefersReducedMotion) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    if (!deleting && text === word) {
      t = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % list.length);
    } else {
      t = setTimeout(
        () => setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)),
        deleting ? speed / 2 : speed,
      );
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [text, deleting, word, list.length, speed, pause, prefersReducedMotion]);

  const shown = prefersReducedMotion ? list[0] : text;
  const label = `${prefix ? `${prefix} ` : ""}${list.join(", ")}`;

  return (
    <span
      style={{ "--mf-tw-accent": accentColor } as React.CSSProperties}
      className={`${styles.root} ${className}`.trim()}
    >
      <span className={styles.srOnly}>{label}</span>
      <span aria-hidden="true">
        {prefix ? <span className={styles.prefix}>{prefix} </span> : null}
        <span className={styles.typed}>{shown}</span>
        {cursor ? (
          <motion.span
            className={styles.cursor}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [1, 0] }}
            transition={
              prefersReducedMotion ? undefined : { duration: 0.6, repeat: Infinity, repeatType: "reverse" }
            }
          />
        ) : null}
      </span>
    </span>
  );
}
