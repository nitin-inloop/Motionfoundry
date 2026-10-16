"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/scroll-narrative.module.css";

export interface ScrollNarrativeChapter {
  id: string;
  step: string;
  title: string;
  summary: string;
  metric: string;
}

export interface ScrollNarrativeProps {
  /** Narrative chapters */
  chapters?: ScrollNarrativeChapter[];
  /** Active chapter index (0 to chapters.length - 1) */
  activeChapter?: number;
  /** Progress percentage (0 to 100) */
  progress?: number;
  /** Pin visual telemetry card */
  pinStage?: boolean;
  /** Optional className */
  className?: string;
}

const DEFAULT_CHAPTERS: ScrollNarrativeChapter[] = [
  {
    id: "discover",
    step: "01 // DISCOVER",
    title: "Inspect Live Motion Primitives",
    summary: "Test real spring physics, SVG morphs, and canvas constellations directly in the browser.",
    metric: "24 Verified Primitives",
  },
  {
    id: "customize",
    step: "02 // CUSTOMIZE",
    title: "Tune Physics & Tokens",
    summary: "Adjust stiffness, damping, blur, and speed while watching the JSX usage code update live.",
    metric: "Zero Lock-In Source",
  },
  {
    id: "ship",
    step: "03 // DEPLOY",
    title: "Install via CLI or Package",
    summary: "Run npx motionfoundry add or import named primitives from @motionfoundry/ui.",
    metric: "100% TypeScript Typed",
  },
];

export function ScrollNarrative({
  chapters = DEFAULT_CHAPTERS,
  activeChapter = 0,
  progress = 35,
  pinStage = true,
  className = "",
}: ScrollNarrativeProps) {
  const [currentIdx, setCurrentIdx] = React.useState(activeChapter);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    setCurrentIdx(Math.min(Math.max(activeChapter, 0), chapters.length - 1));
  }, [activeChapter, chapters.length]);

  const current = chapters[currentIdx] ?? chapters[0];

  return (
    <div className={`${styles.container} ${className}`.trim()}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>Narrative Progress</span>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <span className={styles.progressValue}>{progress}%</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.chapterList} role="tablist" aria-label="Storytelling chapters">
          {chapters.map((ch, idx) => {
            const active = idx === currentIdx;
            return (
              <button
                key={ch.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCurrentIdx(idx)}
                className={`${styles.chapterItem} ${active ? styles.chapterActive : ""}`.trim()}
              >
                <span className={styles.stepTag}>{ch.step}</span>
                <span className={styles.chapterTitle}>{ch.title}</span>
              </button>
            );
          })}
        </div>

        {pinStage && current && (
          <motion.div
            key={current.id}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className={styles.visualStage}
          >
            <span className={styles.metricPill}>{current.metric}</span>
            <h4 className={styles.stageHeadline}>{current.title}</h4>
            <p className={styles.stageSummary}>{current.summary}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
