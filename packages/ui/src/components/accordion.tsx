"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/accordion.module.css";

export interface AccordionItem {
  /** Unique value of the item */
  value: string;
  /** Header text */
  title: string;
  /** Panel content */
  content?: React.ReactNode;
  /** Disable this item */
  disabled?: boolean;
}

export interface AccordionProps {
  /** Items to render; defaults to an FAQ */
  items?: AccordionItem[];
  /** Allow one or several items open at once */
  type?: "single" | "multiple";
  /** In single mode, allow closing the open item */
  collapsible?: boolean;
  /** Controlled open item values */
  value?: string[];
  /** Initially open item values when uncontrolled */
  defaultValue?: string[];
  /** Called with the open item values */
  onValueChange?: (value: string[]) => void;
  /** Visual style */
  variant?: "separated" | "bordered" | "ghost";
  /** Indicator icon */
  icon?: "chevron" | "plus";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Accent color of the open indicator and focus highlights */
  accentColor?: string;
  /** Heading level used for item headers */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Disable every item */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS: AccordionItem[] = [
  {
    value: "install",
    title: "How do I install a component?",
    content: "Run the CLI with the component slug. It copies a single self-contained file and its CSS module into your project, so you own the code.",
  },
  {
    value: "styling",
    title: "Can I restyle everything?",
    content: "Yes. Every surface reads the --mf-* theme variables, and props such as accentColor, size and variant cover the most common tweaks.",
  },
  {
    value: "a11y",
    title: "Is it accessible?",
    content: "Headers are real buttons with aria-expanded, panels are labelled regions, and arrow keys move between headers following the WAI-ARIA pattern.",
  },
  {
    value: "motion",
    title: "What about reduced motion?",
    content: "When the user prefers reduced motion, panels open instantly and the indicator stops rotating.",
  },
];

export function Accordion({
  items = DEFAULT_ITEMS,
  type = "single",
  collapsible = true,
  value: valueProp,
  defaultValue = ["install"],
  onValueChange,
  variant = "separated",
  icon = "chevron",
  size = "md",
  accentColor = "#6366f1",
  headingLevel = 3,
  disabled = false,
  className = "",
  style,
}: AccordionProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = React.useState<string[]>(defaultValue);
  const controlled = valueProp !== undefined;
  const open = controlled ? valueProp : inner;
  const baseId = React.useId();
  const headerRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const Heading = `h${headingLevel}` as "h3";

  const toggle = (v: string) => {
    const isOpen = open.includes(v);
    let next: string[];
    if (type === "multiple") next = isOpen ? open.filter((x) => x !== v) : [...open, v];
    else if (isOpen) {
      if (!collapsible) return;
      next = [];
    } else next = [v];
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const nodes = headerRefs.current;
    const enabled = nodes.map((n, idx) => (n && !n.disabled ? idx : -1)).filter((idx) => idx >= 0);
    const pos = enabled.indexOf(i);
    let next = -1;
    if (e.key === "ArrowDown") next = enabled[(pos + 1) % enabled.length];
    else if (e.key === "ArrowUp") next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    if (next === undefined || next < 0) return;
    e.preventDefault();
    nodes[next]?.focus();
  };

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      style={{ "--mf-acc-accent": accentColor, ...style } as React.CSSProperties}
    >
      {items.map((item, i) => {
        const isOpen = open.includes(item.value);
        const itemDisabled = disabled || !!item.disabled;
        const headerId = `${baseId}-h-${i}`;
        const panelId = `${baseId}-p-${i}`;
        return (
          <div key={item.value} className={styles.item} data-open={isOpen ? "" : undefined}>
            <Heading className={styles.heading}>
              <button
                ref={(el) => {
                  headerRefs.current[i] = el;
                }}
                id={headerId}
                type="button"
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-disabled={type === "single" && isOpen && !collapsible ? true : undefined}
                disabled={itemDisabled}
                onClick={() => toggle(item.value)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <span>{item.title}</span>
                <motion.span
                  aria-hidden="true"
                  className={styles.icon}
                  initial={false}
                  animate={{ rotate: isOpen ? (icon === "plus" ? 45 : 180) : 0 }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon === "plus" ? "M12 5v14M5 12h14" : "m6 9 6 6 6-6"} />
                  </svg>
                </motion.span>
              </button>
            </Heading>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className={styles.panel}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { height: { duration: 0.28, ease }, opacity: { duration: 0.2 } }}
                >
                  <motion.div
                    className={styles.content}
                    initial={{ y: reduce ? 0 : -6 }}
                    animate={{ y: 0 }}
                    exit={{ y: reduce ? 0 : -6 }}
                    transition={{ duration: reduce ? 0 : 0.25, ease }}
                  >
                    {item.content}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
