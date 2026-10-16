"use client";

import * as React from "react";
import { Check, Copy, FileCode2, Terminal } from "lucide-react";

export type CodeLanguage = "tsx" | "css" | "bash" | "json" | "text" | "yaml";

const TOKEN_PATTERN =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*(?=\n|$)|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`|<\/?[A-Za-z][\w.]*|\b(?:import|from|export|default|function|return|const|let|var|if|else|for|of|in|type|interface|extends|as|new|async|await|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;

function tokenClass(token: string, language: CodeLanguage): string {
  if (token.startsWith("/*") || token.startsWith("//")) return "text-neutral-500 italic";
  if (token.startsWith("#")) return language === "bash" || language === "yaml" ? "text-neutral-500 italic" : "";
  if (/^["'`]/.test(token)) return "text-emerald-300";
  if (token.startsWith("<")) return "text-sky-300";
  if (/^\d/.test(token)) return "text-amber-200";
  return "text-violet-300";
}

function highlight(code: string, language: CodeLanguage): React.ReactNode[] {
  if (language === "text" || language === "css") return [code];
  const nodes: React.ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(code.slice(last, index));
    const cls = tokenClass(match[0], language);
    nodes.push(cls ? <span key={index} className={cls}>{match[0]}</span> : match[0]);
    last = index + match[0].length;
  }
  if (last < code.length) nodes.push(code.slice(last));
  return nodes;
}

export function CopyButton({ value, label, className = "" }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : label ?? "Copy to clipboard"}
      onClick={() => navigator.clipboard?.writeText(value).then(() => setCopied(true), () => setCopied(false))}
      className={`inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}

export function CodeBlock({
  code,
  language = "tsx",
  filename,
  showLineNumbers,
  maxHeight = "32rem",
}: {
  code: string;
  language?: CodeLanguage;
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}) {
  const trimmed = code.replace(/\n+$/, "");
  const lines = React.useMemo(() => highlightLines(trimmed, language), [trimmed, language]);
  const numbered = showLineNumbers ?? (Boolean(filename) && language !== "bash");
  const Icon = language === "bash" ? Terminal : FileCode2;

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card">
      {filename ? (
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
          <span className="flex items-center gap-2 font-mono text-[13px] text-muted-foreground">
            <Icon className="h-4 w-4" />
            {filename}
          </span>
          <CopyButton value={trimmed} />
        </div>
      ) : (
        <CopyButton value={trimmed} className="absolute right-3 top-3 z-10 bg-card" />
      )}
      <pre className="mf-scrollbar overflow-auto py-4 font-mono text-[13.5px] leading-[1.7] text-neutral-200" style={{ maxHeight }}>
        <code className="grid">
          {lines.map((line, i) => (
            <span key={i} className={`flex ${filename ? "" : "pr-12"}`}>
              {numbered && <span className="w-10 shrink-0 select-none pr-4 text-right text-neutral-600">{i + 1}</span>}
              <span className={numbered ? "pr-4" : "px-4"}>{line.length ? line : " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/** Highlights the whole snippet, then splits the token stream back into lines. */
function highlightLines(code: string, language: CodeLanguage): React.ReactNode[][] {
  const lines: React.ReactNode[][] = [[]];
  highlight(code, language).forEach((node, nodeIdx) => {
    if (typeof node === "string") {
      node.split("\n").forEach((part, partIdx) => {
        if (partIdx > 0) lines.push([]);
        if (part) lines[lines.length - 1].push(part);
      });
    } else if (React.isValidElement<{ className?: string; children?: string }>(node)) {
      const text = String(node.props.children ?? "");
      text.split("\n").forEach((part, partIdx) => {
        if (partIdx > 0) lines.push([]);
        if (part) lines[lines.length - 1].push(<span key={`${nodeIdx}-${partIdx}`} className={node.props.className}>{part}</span>);
      });
    }
  });
  return lines;
}
