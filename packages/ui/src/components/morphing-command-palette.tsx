"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import styles from "../styles/morphing-command-palette.module.css";

export interface CommandPaletteAction {
  id: string;
  label: string;
  shortcut: string;
  group: string;
}

export interface MorphingCommandPaletteProps {
  /** Input placeholder */
  placeholder?: string;
  /** Initial search query */
  defaultQuery?: string;
  /** Result stagger interval in seconds */
  staggerResults?: number;
  /** Initial open state */
  isOpen?: boolean;
  /** Action items */
  actions?: CommandPaletteAction[];
  /** Selection callback */
  onSelectAction?: (action: CommandPaletteAction) => void;
  /** Optional className */
  className?: string;
}

const DEFAULT_ACTIONS: CommandPaletteAction[] = [
  { id: "add-kinetic", label: "npx motionfoundry add kinetic-type", shortcut: "⌘1", group: "CLI" },
  { id: "add-glass", label: "npx motionfoundry add liquid-glass-card", shortcut: "⌘2", group: "CLI" },
  { id: "add-dock", label: "npx motionfoundry add magnetic-dock", shortcut: "⌘3", group: "CLI" },
  { id: "docs-api", label: "Open Component API Reference", shortcut: "⌘D", group: "Docs" },
];

export function MorphingCommandPalette({
  placeholder = "Filter commands, components, or actions...",
  defaultQuery = "",
  staggerResults = 0.035,
  isOpen: isOpenProp = true,
  actions = DEFAULT_ACTIONS,
  onSelectAction,
  className = "",
}: MorphingCommandPaletteProps) {
  const [open, setOpen] = React.useState(isOpenProp);
  const [query, setQuery] = React.useState(defaultQuery);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lastExecuted, setLastExecuted] = React.useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const layoutId = React.useId();

  React.useEffect(() => {
    setOpen(isOpenProp);
  }, [isOpenProp]);

  React.useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.group.toLowerCase().includes(q)
    );
  }, [actions, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      const chosen = filtered[activeIndex];
      setLastExecuted(chosen.label);
      onSelectAction?.(chosen);
    }
  };

  return (
    <div className={`${styles.container} ${className}`.trim()}>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={styles.reopenBtn}
        >
          Reopen Command Palette (⌘K)
        </button>
      )}
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            role="dialog"
            aria-label="Command palette"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onKeyDown={handleKeyDown}
            className={styles.palette}
          >
            <div className={styles.inputRow}>
              <span className={styles.promptGlyph}>⌘</span>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder={placeholder}
                aria-label="Command search input"
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={styles.escBadge}
              >
                ESC
              </button>
            </div>

            <div role="listbox" aria-label="Command results" className={styles.list}>
              {filtered.map((item, idx) => {
                const selected = idx === activeIndex;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * staggerResults, duration: 0.22 }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      setLastExecuted(item.label);
                      onSelectAction?.(item);
                    }}
                    className={styles.row}
                  >
                    {selected && (
                      <motion.span
                        layoutId={`mf-cmd-pill-${layoutId}`}
                        className={styles.highlightPill}
                        transition={{ type: "spring", stiffness: 360, damping: 28 }}
                      />
                    )}
                    <span className={styles.rowText}>{item.label}</span>
                    <kbd className={styles.shortcut}>{item.shortcut}</kbd>
                  </motion.button>
                );
              })}
            </div>

            {lastExecuted && (
              <div className={styles.footer}>Executed: {lastExecuted}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
