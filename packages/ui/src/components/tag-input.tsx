"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/tag-input.module.css";

export interface TagInputProps {
  /** Controlled list of tags */
  value?: string[];
  /** Initial tags when uncontrolled */
  defaultValue?: string[];
  /** Called with the next list whenever a tag is added or removed */
  onValueChange?: (tags: string[]) => void;
  /** Visible label (also the accessible name of the text box) */
  label?: string;
  /** Placeholder shown in the text box */
  placeholder?: string;
  /** Maximum number of tags (0 = unlimited) */
  maxTags?: number;
  /** Allow the same tag more than once (case-insensitive check) */
  allowDuplicates?: boolean;
  /** Chip style */
  variant?: "soft" | "outline" | "solid";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Chip and focus accent color */
  accentColor?: string;
  /** Disable the field */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_TAGS = ["React", "TypeScript", "Motion"];

export function TagInput({
  value: valueProp,
  defaultValue = DEFAULT_TAGS,
  onValueChange,
  label = "Skills",
  placeholder = "Add a skill…",
  maxTags = 8,
  allowDuplicates = false,
  variant = "soft",
  size = "md",
  accentColor = "#6366f1",
  disabled = false,
  className = "",
  style,
}: TagInputProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = React.useState<string[]>(defaultValue);
  const tags = valueProp ?? inner;
  const [draft, setDraft] = React.useState("");
  const [armed, setArmed] = React.useState(false);
  const [flash, setFlash] = React.useState<{ index: number; n: number } | null>(null);
  const [announce, setAnnounce] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();
  const full = maxTags > 0 && tags.length >= maxTags;

  React.useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 420);
    return () => window.clearTimeout(t);
  }, [flash]);

  const seen = new Map<string, number>();
  const keys = tags.map((tag) => {
    const n = seen.get(tag) ?? 0;
    seen.set(tag, n + 1);
    return `${tag}#${n}`;
  });

  const update = (next: string[]) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...tags];
    const added: string[] = [];
    for (const part of parts) {
      if (maxTags > 0 && next.length >= maxTags) break;
      const dup = next.findIndex((t) => t.toLowerCase() === part.toLowerCase());
      if (dup !== -1 && !allowDuplicates) {
        setFlash((f) => ({ index: dup, n: (f?.n ?? 0) + 1 }));
        continue;
      }
      next.push(part);
      added.push(part);
    }
    if (added.length) {
      update(next);
      setAnnounce(`Added ${added.join(", ")}`);
    }
    setDraft("");
  };

  const remove = (index: number, refocus = true) => {
    const tag = tags[index];
    if (tag === undefined) return;
    update(tags.filter((_, i) => i !== index));
    setAnnounce(`Removed ${tag}`);
    setArmed(false);
    if (refocus) inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      if (draft.trim() || e.key === ",") e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      e.preventDefault();
      if (armed) remove(tags.length - 1);
      else setArmed(true);
    } else if (e.key === "Escape") {
      setArmed(false);
      setDraft("");
    } else {
      setArmed(false);
    }
  };

  const spring = reduce ? { duration: 0.1 } : { type: "spring" as const, stiffness: 520, damping: 32 };

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      style={{ "--mf-tag-accent": accentColor, ...style } as React.CSSProperties}
    >
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.box} onPointerDown={(e) => {
          if (disabled || (e.target instanceof Element && e.target.closest("button, input"))) return;
          e.preventDefault();
          inputRef.current?.focus();
        }}>
        <ul role="list" className={styles.list} aria-label={`${label}: ${tags.length} selected`}>
          <AnimatePresence initial={false} mode="popLayout">
            {tags.map((tag, i) => (
              <motion.li
                key={keys[i]}
                layout={!reduce}
                className={styles.chip}
                data-armed={armed && i === tags.length - 1 ? "" : undefined}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                animate={flash?.index === i && !reduce ? { opacity: 1, scale: 1, x: [0, -4, 4, -2, 0] } : { opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.6, transition: { duration: 0.14 } }}
                transition={spring}
              >
                <span className={styles.text}>{tag}</span>
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Remove ${tag}`}
                  disabled={disabled}
                  onClick={() => remove(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" || e.key === "Delete") {
                      e.preventDefault();
                      remove(i);
                    }
                  }}
                >
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          value={draft}
          disabled={disabled || full}
          placeholder={full ? `Limit of ${maxTags} reached` : placeholder}
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) add(v);
            else setDraft(v);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setArmed(false);
            if (draft.trim()) add(draft);
          }}
        />
      </div>
      <span id={`${id}-hint`} className={styles.hint}>
        Press Enter or comma to add, Backspace to remove.
        {maxTags > 0 ? ` ${tags.length}/${maxTags}` : ""}
      </span>
      <span className={styles.srOnly} aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
