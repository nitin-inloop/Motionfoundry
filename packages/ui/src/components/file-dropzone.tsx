"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/file-dropzone.module.css";

export interface DropzoneFile {
  /** Stable id */
  id: string;
  /** File name */
  name: string;
  /** Size in bytes */
  size: number;
  /** Upload progress 0-1 */
  progress: number;
  /** Upload state */
  status: "uploading" | "done" | "error";
  /** Error message when status is "error" */
  error?: string;
  /** The underlying File (absent for sample entries) */
  file?: File;
}

export interface FileDropzoneProps {
  /** Main prompt inside the drop area */
  title?: string;
  /** Hint line under the prompt (accepted types, limits) */
  hint?: string;
  /** Label of the browse button */
  buttonLabel?: string;
  /** Value for the file input's accept attribute */
  accept?: string;
  /** Allow selecting several files at once */
  multiple?: boolean;
  /** Maximum number of files kept in the list */
  maxFiles?: number;
  /** Maximum file size in megabytes (larger files are rejected) */
  maxSizeMB?: number;
  /** Simulated upload duration in seconds */
  uploadDuration?: number;
  /** Pre-fill the list with two sample files so the demo is not empty */
  showSampleFiles?: boolean;
  /** Accent color for the hover state and progress bars */
  accentColor?: string;
  /** Disable the dropzone */
  disabled?: boolean;
  /** Called whenever the list of real files changes */
  onFilesChange?: (files: File[]) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const SAMPLES: DropzoneFile[] = [
  { id: "sample-1", name: "brand-guidelines.pdf", size: 2_480_000, progress: 1, status: "done" },
  { id: "sample-2", name: "hero-shot@2x.png", size: 4_120_000, progress: 0.18, status: "uploading" },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Deterministic 0-1 hash so each file gets its own upload pace. */
function seeded(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export function FileDropzone({
  title = "Drag & drop files here",
  hint = "PNG, JPG, PDF or ZIP up to 10 MB",
  buttonLabel = "Browse files",
  accept = "",
  multiple = true,
  maxFiles = 6,
  maxSizeMB = 10,
  uploadDuration = 2.4,
  showSampleFiles = true,
  accentColor = "#6366f1",
  disabled = false,
  onFilesChange,
  className = "",
  style,
}: FileDropzoneProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const [items, setItems] = React.useState<DropzoneFile[]>(() => (showSampleFiles ? SAMPLES : []));
  const [dragging, setDragging] = React.useState(false);
  const [announce, setAnnounce] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const depth = React.useRef(0);
  const counter = React.useRef(0);
  const uploading = items.some((f) => f.status === "uploading");

  // Simulated upload: advance progress on a single rAF loop while anything is uploading.
  React.useEffect(() => {
    if (!uploading) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setItems((list) =>
        list.map((f) => {
          if (f.status !== "uploading") return f;
          const pace = 0.7 + seeded(f.id) * 0.6;
          const p = Math.min(1, f.progress + (dt / Math.max(0.2, uploadDuration)) * pace);
          if (p >= 1) setAnnounce(`${f.name} uploaded`);
          return { ...f, progress: p, status: p >= 1 ? "done" : "uploading" };
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [uploading, uploadDuration]);

  const report = (list: DropzoneFile[]) => onFilesChange?.(list.flatMap((f) => (f.file && f.status !== "error" ? [f.file] : [])));

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || disabled) return;
    const picked = Array.from(incoming).slice(0, multiple ? undefined : 1);
    const added = picked.map<DropzoneFile>((file) => {
      counter.current += 1;
      const tooBig = file.size > maxSizeMB * 1024 * 1024;
      return {
        id: `${id}-${counter.current}-${file.name}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: tooBig ? "error" : "uploading",
        error: tooBig ? `Larger than ${maxSizeMB} MB` : undefined,
        file,
      };
    });
    const next = (multiple ? [...items, ...added] : added).slice(-Math.max(1, maxFiles));
    setItems(next);
    report(next);
    setAnnounce(`${added.length} file${added.length === 1 ? "" : "s"} added`);
  };

  const remove = (f: DropzoneFile) => {
    const next = items.filter((x) => x.id !== f.id);
    setItems(next);
    report(next);
    setAnnounce(`${f.name} removed`);
  };

  const onDrag = (e: React.DragEvent<HTMLDivElement>, kind: "enter" | "over" | "leave" | "drop") => {
    e.preventDefault();
    if (disabled) return;
    if (kind === "enter") depth.current += 1;
    if (kind === "leave") depth.current = Math.max(0, depth.current - 1);
    if (kind === "drop") {
      depth.current = 0;
      addFiles(e.dataTransfer.files);
    }
    setDragging(depth.current > 0);
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 32 };

  return (
    <div className={`${styles.root} ${className}`.trim()} style={{ "--mf-fd-accent": accentColor, ...style } as React.CSSProperties}>
      <motion.div
        className={styles.zone}
        data-dragging={dragging ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        animate={{ scale: dragging && !reduce ? 1.015 : 1 }}
        transition={spring}
        onDragEnter={(e) => onDrag(e, "enter")}
        onDragOver={(e) => onDrag(e, "over")}
        onDragLeave={(e) => onDrag(e, "leave")}
        onDrop={(e) => onDrag(e, "drop")}
        onClick={(e) => {
          if (e.target === e.currentTarget) inputRef.current?.click();
        }}
      >
        <motion.span className={styles.iconWrap} aria-hidden="true" animate={reduce ? undefined : { y: dragging ? -6 : 0 }} transition={spring}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M7 9l5-5 5 5" />
            <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
        </motion.span>
        <p className={styles.title}>{dragging ? "Release to upload" : title}</p>
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
        <button type="button" className={styles.browse} disabled={disabled} aria-describedby={`${id}-hint`} onClick={() => inputRef.current?.click()}>
          {buttonLabel}
        </button>
        <input
          ref={inputRef}
          type="file"
          tabIndex={-1}
          aria-hidden="true"
          className={styles.input}
          accept={accept || undefined}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </motion.div>
      <ul className={styles.list} aria-label="Files">
        <AnimatePresence initial={false}>
          {items.map((f) => (
            <motion.li
              key={f.id}
              layout={!reduce}
              className={styles.item}
              data-status={f.status}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, transition: { duration: 0.18 } }}
              transition={spring}
            >
              <span className={styles.fileIcon} aria-hidden="true">
                {f.name.split(".").pop()?.slice(0, 4).toUpperCase()}
              </span>
              <span className={styles.meta}>
                <span className={styles.nameRow}>
                  <span className={styles.name}>{f.name}</span>
                  <span className={styles.size}>
                    {f.status === "error" ? f.error : f.status === "done" ? formatBytes(f.size) : `${Math.round(f.progress * 100)}%`}
                  </span>
                </span>
                <span
                  className={styles.bar}
                  role="progressbar"
                  aria-label={`Upload progress for ${f.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(f.progress * 100)}
                >
                  <span className={styles.fill} style={{ transform: `scaleX(${f.status === "error" ? 1 : f.progress})` }} />
                </span>
              </span>
              <button type="button" className={styles.remove} aria-label={`Remove ${f.name}`} onClick={() => remove(f)}>
                {f.status === "done" ? (
                  <svg aria-hidden="true" className={styles.done} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                  </svg>
                ) : null}
                <svg aria-hidden="true" className={styles.x} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
