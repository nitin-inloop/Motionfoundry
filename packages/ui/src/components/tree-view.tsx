"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/tree-view.module.css";

export interface TreeNode {
  /** Unique id (defaults to the slash-joined label path) */
  id?: string;
  /** Visible label */
  label: string;
  /** Child nodes; a node with a children array is a folder */
  children?: TreeNode[];
}

export interface TreeViewProps {
  /** Tree data (defaults to a small project file explorer) */
  items?: TreeNode[];
  /** Accessible name of the tree (also the visible header when showHeader is true) */
  label?: string;
  /** Show the label as a header above the tree */
  showHeader?: boolean;
  /** Controlled selected node id */
  value?: string;
  /** Initially selected node id when uncontrolled */
  defaultValue?: string;
  /** Called with the id of the newly selected node */
  onValueChange?: (id: string) => void;
  /** Controlled list of expanded folder ids */
  expanded?: string[];
  /** Initially expanded folder ids when uncontrolled */
  defaultExpanded?: string[];
  /** Called with the next list of expanded folder ids */
  onExpandedChange?: (ids: string[]) => void;
  /** Start with every folder expanded (uncontrolled only) */
  expandAll?: boolean;
  /** Color of the selection highlight and focus tint */
  accentColor?: string;
  /** Row density */
  size?: "sm" | "md";
  /** Show folder/file icons */
  showIcons?: boolean;
  /** Draw vertical indent guides */
  showGuides?: boolean;
  /** Indentation per level in px */
  indent?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const f = (label: string): TreeNode => ({ label });
const DEFAULT_ITEMS: TreeNode[] = [
  {
    label: "src",
    children: [
      { label: "app", children: [f("layout.tsx"), f("page.tsx"), f("globals.css")] },
      { label: "components", children: [f("button.tsx"), f("dialog.tsx"), f("tree-view.tsx")] },
      { label: "hooks", children: [f("use-media-query.ts"), f("use-theme.ts")] },
      { label: "lib", children: [f("utils.ts")] },
    ],
  },
  { label: "public", children: [f("favicon.ico"), f("og-image.png")] },
  f("package.json"),
  f("README.md"),
  f("tsconfig.json"),
];

interface Flat {
  id: string;
  label: string;
  parent: string | null;
  folder: boolean;
}

const idOf = (n: TreeNode, prefix: string) => n.id ?? (prefix ? `${prefix}/${n.label}` : n.label);

function flatten(nodes: TreeNode[], open: Set<string> | null, prefix = "", parent: string | null = null, out: Flat[] = []) {
  for (const n of nodes) {
    const id = idOf(n, prefix);
    out.push({ id, label: n.label, parent, folder: Array.isArray(n.children) });
    if (n.children && (!open || open.has(id))) flatten(n.children, open, id, id, out);
  }
  return out;
}

const EXT_COLORS: Record<string, string> = { tsx: "#3b82f6", ts: "#3b82f6", css: "#ec4899", json: "#eab308", md: "#a1a1aa", png: "#22c55e", ico: "#f97316" };

function Icon({ folder, open, label }: { folder: boolean; open: boolean; label: string }) {
  if (folder)
    return (
      <svg aria-hidden="true" className={styles.icon} data-folder="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        {open ? <path d="M3 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1H8.5a2 2 0 0 0-1.9 1.4L4 19H5a2 2 0 0 1-2-2zM6.6 11.4A2 2 0 0 1 8.5 10H21l-2.6 7.6a2 2 0 0 1-1.9 1.4H4z" /> : <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />}
      </svg>
    );
  const ext = label.split(".").pop() ?? "";
  return (
    <svg aria-hidden="true" className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <circle cx="12" cy="15" r="2.2" fill={EXT_COLORS[ext] ?? "currentColor"} stroke="none" />
    </svg>
  );
}

export function TreeView({
  items = DEFAULT_ITEMS,
  label = "Project files",
  showHeader = true,
  value: valueProp,
  defaultValue = "src/components/tree-view.tsx",
  onValueChange,
  expanded: expandedProp,
  defaultExpanded = ["src", "src/components"],
  onExpandedChange,
  expandAll = false,
  accentColor = "#6366f1",
  size = "md",
  showIcons = true,
  showGuides = true,
  indent = 16,
  className = "",
  style,
}: TreeViewProps) {
  const reduce = useReducedMotion();
  const all = React.useMemo(() => flatten(items, null), [items]);
  const [innerOpen, setInnerOpen] = React.useState<string[]>(() => (expandAll ? all.filter((n) => n.folder).map((n) => n.id) : defaultExpanded));
  const [innerSel, setInnerSel] = React.useState<string | undefined>(defaultValue);
  const openList = expandedProp ?? innerOpen;
  const selected = valueProp !== undefined ? valueProp : innerSel;
  const open = React.useMemo(() => new Set(openList), [openList]);
  const visible = React.useMemo(() => flatten(items, open), [items, open]);
  const byId = React.useMemo(() => new Map(all.map((n) => [n.id, n])), [all]);
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const refs = React.useRef(new Map<string, HTMLLIElement>());
  const headId = React.useId();

  const tabId = visible.some((n) => n.id === focusId) ? focusId : visible.some((n) => n.id === selected) ? selected : visible[0]?.id;

  const setOpen = (id: string, next: boolean) => {
    if (open.has(id) === next) return;
    const list = next ? [...openList, id] : openList.filter((x) => x !== id);
    if (expandedProp === undefined) setInnerOpen(list);
    onExpandedChange?.(list);
  };
  const select = (id: string) => {
    if (valueProp === undefined) setInnerSel(id);
    if (id !== selected) onValueChange?.(id);
  };
  const focus = (id: string | undefined) => {
    if (!id) return;
    setFocusId(id);
    refs.current.get(id)?.focus();
  };
  const activate = (n: Flat) => {
    select(n.id);
    if (n.folder) setOpen(n.id, !open.has(n.id));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const i = visible.findIndex((n) => n.id === tabId);
    const cur = visible[i];
    if (!cur) return;
    const k = e.key;
    if (k === "ArrowDown") focus(visible[i + 1]?.id);
    else if (k === "ArrowUp") focus(visible[i - 1]?.id);
    else if (k === "Home") focus(visible[0]?.id);
    else if (k === "End") focus(visible[visible.length - 1]?.id);
    else if (k === "ArrowRight") {
      if (cur.folder && !open.has(cur.id)) setOpen(cur.id, true);
      else if (cur.folder && visible[i + 1]?.parent === cur.id) focus(visible[i + 1].id);
    } else if (k === "ArrowLeft") {
      if (cur.folder && open.has(cur.id)) setOpen(cur.id, false);
      else if (cur.parent) focus(cur.parent);
    } else if (k === "Enter" || k === " ") activate(cur);
    else return;
    e.preventDefault();
  };

  const transition = reduce ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };

  const renderLevel = (nodes: TreeNode[], level: number, prefix: string): React.ReactNode =>
    nodes.map((node, idx) => {
      const id = idOf(node, prefix);
      const folder = Array.isArray(node.children);
      const isOpen = folder && open.has(id);
      const isSel = id === selected;
      const flat = byId.get(id) ?? { id, label: node.label, parent: prefix || null, folder };
      return (
        <li
          key={id}
          ref={(el) => {
            if (el) refs.current.set(id, el);
            else refs.current.delete(id);
          }}
          role="treeitem"
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={idx + 1}
          aria-expanded={folder ? isOpen : undefined}
          aria-selected={isSel}
          tabIndex={id === tabId ? 0 : -1}
          className={styles.item}
          onFocus={(e) => {
            e.stopPropagation();
            setFocusId(id);
          }}
        >
          <div
            className={styles.row}
            data-selected={isSel ? "" : undefined}
            style={{ paddingLeft: `calc(${(level - 1) * indent}px + 0.375rem)` }}
            onClick={() => {
              activate(flat);
              focus(id);
            }}
          >
            {showGuides &&
              Array.from({ length: level - 1 }, (_, g) => (
                <span key={g} aria-hidden="true" className={styles.guide} style={{ left: `calc(${g * indent + indent / 2}px + 0.375rem)` }} />
              ))}
            <span aria-hidden="true" className={styles.chevron} data-open={isOpen ? "" : undefined} data-hidden={folder ? undefined : ""}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </span>
            {showIcons && <Icon folder={folder} open={isOpen} label={node.label} />}
            <span className={styles.text}>{node.label}</span>
          </div>
          {folder && (
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.ul
                  role="group"
                  className={styles.group}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transition}
                >
                  {renderLevel(node.children ?? [], level + 1, id)}
                </motion.ul>
              )}
            </AnimatePresence>
          )}
        </li>
      );
    });

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-size={size}
      style={{ "--mf-tv-accent": accentColor, ...style } as React.CSSProperties}
    >
      {showHeader && label && (
        <div id={headId} className={styles.header}>
          {label}
        </div>
      )}
      <ul
        role="tree"
        aria-labelledby={showHeader && label ? headId : undefined}
        aria-label={showHeader && label ? undefined : label || "Tree"}
        className={styles.tree}
        onKeyDown={onKeyDown}
      >
        {renderLevel(items, 1, "")}
      </ul>
    </div>
  );
}
