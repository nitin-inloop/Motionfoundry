import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { plainHeading, slugify } from "../lib/slug";
import { CodeBlock, type CodeLanguage } from "./code-block";

const LANGUAGES: Record<string, CodeLanguage> = {
  tsx: "tsx", ts: "tsx", jsx: "tsx", js: "tsx", javascript: "tsx", typescript: "tsx",
  css: "css", bash: "bash", sh: "bash", shell: "bash", json: "json", yaml: "yaml", yml: "yaml",
};

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function heading(Tag: "h2" | "h3" | "h4", idPrefix: string) {
  return function Heading({ children }: { children?: React.ReactNode }) {
    return (
      <Tag id={idPrefix + slugify(plainHeading(textOf(children)))} className="scroll-mt-24">
        {children}
      </Tag>
    );
  };
}

const baseComponents: Components = {
  pre: ({ children }) => {
    const child = React.Children.only(children) as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
    const lang = child.props.className?.replace("language-", "") ?? "text";
    return <CodeBlock code={textOf(child.props.children)} language={LANGUAGES[lang] ?? "text"} />;
  },
  table: ({ children }) => (
    <div className="mf-scrollbar overflow-x-auto rounded-xl border border-border">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {children}
      </a>
    );
  },
};

/**
 * Renders Markdown (GFM) with heading anchors that match tocFromMarkdown().
 * `idPrefix` namespaces anchors when the Markdown is embedded under other sections.
 */
export function Prose({ markdown, idPrefix = "" }: { markdown: string; idPrefix?: string }) {
  const components: Components = {
    ...baseComponents,
    h1: heading("h2", idPrefix),
    h2: heading("h2", idPrefix),
    h3: heading("h3", idPrefix),
    h4: heading("h4", idPrefix),
  };
  return (
    <div className="mf-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
