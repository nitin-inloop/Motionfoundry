"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/expandable-search.module.css";

export interface ExpandableSearchProps {
  /** Expanded width in pixels */
  width?: number;
  /** Input placeholder text */
  placeholder?: string;
  /** Called with the current query when Enter is pressed */
  onSearch?: (query: string) => void;
  /** Start in the expanded state */
  defaultOpen?: boolean;
  /** Optional className merged onto the root */
  className?: string;
}

const COLLAPSED = 44;

export function ExpandableSearch({
  width = 260,
  placeholder = "Search components…",
  onSearch,
  defaultOpen = false,
  className = "",
}: ExpandableSearchProps) {
  const prefersReducedMotion = useReducedMotion();
  const inputId = React.useId();
  const [open, setOpen] = React.useState(defaultOpen);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const userToggled = React.useRef(false);

  React.useEffect(() => {
    if (!userToggled.current) return;
    if (open) inputRef.current?.focus();
    else toggleRef.current?.focus();
  }, [open]);

  const toggle = (next: boolean) => {
    userToggled.current = true;
    setOpen(next);
  };

  return (
    <motion.form
      role="search"
      initial={false}
      animate={{ width: open ? Math.max(width, COLLAPSED) : COLLAPSED }}
      transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 28 }}
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSearch?.(query);
      }}
      className={`${styles.root} ${open ? styles.open : ""} ${className}`.trim()}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? "Close search" : "Open search"}
        aria-expanded={open}
        aria-controls={inputId}
        onClick={() => toggle(!open)}
        className={styles.toggle}
      >
        {open ? (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        )}
      </button>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        aria-label="Search"
        placeholder={placeholder}
        value={query}
        hidden={!open}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            toggle(false);
          }
        }}
        className={styles.input}
      />
    </motion.form>
  );
}
