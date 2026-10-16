"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, RotateCcw, RefreshCw } from "lucide-react";
import type { ControlDef, PropValue, RegistryComponent } from "../lib/registry";
import type { DesignPreset } from "../lib/designs";
import { BRAND_CONFIG } from "../lib/brand";
import { buildUsage } from "../lib/component-doc";
import { themeColorFor, themeStyle } from "../lib/theme-style";
import { CodeBlock } from "./code-block";
import { ComponentPreview } from "./component-preview";
import { SectionHeading } from "./docs-page";

function ControlField({ control, value, onChange }: { control: ControlDef; value: PropValue; onChange: (v: PropValue) => void }) {
  const id = `ctrl-${control.prop}`;
  const input = "h-8 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground outline-none transition focus:border-ring";
  const label = (extra?: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-[13px] font-medium text-foreground/90">
        {control.label}
      </label>
      {extra}
    </div>
  );

  switch (control.type) {
    case "range":
      return (
        <div className="space-y-2">
          {label(<span className="font-mono text-xs text-muted-foreground">{String(value)}</span>)}
          <input id={id} type="range" min={control.min} max={control.max} step={control.step} value={Number(value)} onChange={(e) => onChange(Number(e.target.value))} className="mf-range w-full" />
        </div>
      );
    case "select":
      return (
        <div className="space-y-2">
          {label()}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={control.label}>
            {control.options.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={value === option}
                onClick={() => onChange(option)}
                className={`h-7 rounded-md px-2.5 font-mono text-xs transition ${value === option ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    case "boolean":
      return (
        <div className="flex h-full items-center justify-between gap-3">
          <label htmlFor={id} className="text-[13px] font-medium text-foreground/90">
            {control.label}
          </label>
          <button id={id} type="button" role="switch" aria-checked={Boolean(value)} onClick={() => onChange(!value)} className={`relative h-5 w-9 shrink-0 rounded-full transition ${value ? "bg-foreground" : "bg-muted"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${value ? "left-[18px] bg-background" : "left-0.5 bg-neutral-400"}`} />
          </button>
        </div>
      );
    case "color":
      return (
        <div className="space-y-2">
          {label()}
          <div className="flex items-center gap-2">
            <input id={id} type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent" />
            <input type="text" aria-label={`${control.label} hex`} value={String(value)} onChange={(e) => onChange(e.target.value)} className={`${input} font-mono`} />
          </div>
        </div>
      );
    case "list":
      return (
        <div className="space-y-2 sm:col-span-2">
          {label()}
          <input
            id={id}
            type="text"
            value={Array.isArray(value) ? value.join(", ") : String(value)}
            onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            className={input}
          />
        </div>
      );
    default:
      return (
        <div className="space-y-2">
          {label()}
          <input id={id} type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} className={input} />
        </div>
      );
  }
}

function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg bg-card p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition ${value === t.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ComponentPlayground({ component, presets }: { component: RegistryComponent; presets: DesignPreset[] }) {
  const defaults = component.defaultProps;
  const controls = component.controls;
  const [props, setProps] = React.useState<Record<string, PropValue>>(defaults);
  const [replayKey, setReplayKey] = React.useState(0);
  const [presetId, setPresetId] = React.useState("");
  const [install, setInstall] = React.useState<"cli" | "package" | "manual">("cli");
  const [source, setSource] = React.useState<"tsx" | "css" | "tailwind">("tsx");

  const preset = presets.find((p) => p.id === presetId);
  const tsx = component.files.find((f) => f.path.endsWith(".tsx"));
  const css = component.files.find((f) => f.path.endsWith(".css"));
  const cli = `npx ${BRAND_CONFIG.cliName} add ${component.slug}`;
  const peerDeps = component.dependencies.filter((d) => d !== "react");

  const applyPreset = (id: string) => {
    setPresetId(id);
    const next = presets.find((p) => p.id === id);
    if (!next) {
      setProps(defaults);
      return;
    }
    // Recolor every color control with the design's palette so the preview matches the brand.
    const colorControls = controls.filter((c) => c.type === "color");
    setProps((prev) => ({ ...prev, ...Object.fromEntries(colorControls.map((c, i) => [c.prop, themeColorFor(c.prop, i, next.theme)])) }));
  };

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <SectionHeading id="preview">Preview</SectionHeading>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/60 px-3 py-2">
            <label className="relative flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Design</span>
              <span className="relative">
                <select
                  value={presetId}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="h-8 appearance-none rounded-md bg-muted py-0 pl-2.5 pr-8 text-sm font-medium text-foreground outline-none"
                >
                  <option value="">MotionFoundry (default)</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
              </span>
              {preset && (
                <Link href={`/designs/${preset.id}`} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  About {preset.brand}
                </Link>
              )}
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setProps(defaults);
                  setPresetId("");
                }}
                className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button type="button" onClick={() => setReplayKey((k) => k + 1)} className="flex h-8 items-center gap-1.5 rounded-md bg-muted px-2.5 text-sm font-medium hover:bg-[#333]">
                <RefreshCw className="h-3.5 w-3.5" /> Replay
              </button>
            </div>
          </div>
          <div className={`${preset ? "" : "mf-stage"} flex min-h-[400px] items-center justify-center overflow-hidden p-8 transition-colors`} style={preset ? themeStyle(preset.theme) : undefined}>
            {/* Remount on every prop change so mount-triggered animations replay with the new values. */}
            <div className="flex w-full items-center justify-center" key={`${replayKey}-${presetId}-${JSON.stringify(props)}`}>
              <ComponentPreview name={component.name} props={props} />
            </div>
          </div>
          {controls.length > 0 && (
            <div className="border-t border-border bg-card/40 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Customize</h3>
                <span className="font-mono text-xs text-muted-foreground">{controls.length} props</span>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                {controls.map((control) => (
                  <ControlField
                    key={control.prop}
                    control={control}
                    value={props[control.prop] ?? defaults[control.prop]}
                    onChange={(value) => setProps((prev) => ({ ...prev, [control.prop]: value }))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading id="installation">Installation</SectionHeading>
        <Tabs
          label="Installation method"
          value={install}
          onChange={setInstall}
          tabs={[
            { id: "cli", label: "CLI" },
            { id: "package", label: "Package" },
            { id: "manual", label: "Manual" },
          ]}
        />
        {install === "cli" && (
          <>
            <p className="text-muted-foreground">Copies the component source and its CSS Module into your project.</p>
            <CodeBlock code={cli} language="bash" />
            <p className="text-sm text-muted-foreground">
              Writes <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">components/ui/{component.slug}.tsx</code> and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">components/styles/{component.slug}.module.css</code>.
            </p>
          </>
        )}
        {install === "package" && (
          <>
            <CodeBlock code={`pnpm add ${BRAND_CONFIG.packageScope} ${peerDeps.join(" ")}`.trim()} language="bash" />
            <CodeBlock code={`// app/layout.tsx — import once\nimport "${BRAND_CONFIG.packageScope}/styles.css";`} language="tsx" filename="app/layout.tsx" />
          </>
        )}
        {install === "manual" && (
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>
              Install peer dependencies: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">{component.dependencies.join(" ")}</code>.
            </li>
            <li>Copy the Component and CSS Module from the Source section below.</li>
            <li>
              Keep the stylesheet at <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">../styles/{component.slug}.module.css</code> relative to the component.
            </li>
          </ol>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading id="usage">Usage</SectionHeading>
        <p className="text-muted-foreground">Updates live as you change the controls — only props that differ from the defaults are included.</p>
        <CodeBlock code={buildUsage(component, props, defaults)} language="tsx" filename="example.tsx" />
      </section>

      <section className="space-y-4">
        <SectionHeading id="props">Props</SectionHeading>
        <div className="mf-scrollbar overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Prop</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {component.propsApi.map((p) => (
                <tr key={p.name} className="align-top">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">{p.name}</code>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">{p.description}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-sky-300/90">{p.type}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{p.default}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading id="accessibility">Accessibility</SectionHeading>
        <p className="leading-relaxed text-foreground/90">{component.a11yNotes}</p>
        <p className="text-sm text-muted-foreground">
          Toggle <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">prefers-reduced-motion</code> in your OS or browser devtools (Rendering → Emulate CSS media feature) to verify the reduced-motion state.
        </p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="source">Source</SectionHeading>
        <Tabs
          label="Source file"
          value={source}
          onChange={setSource}
          tabs={[
            { id: "tsx", label: "Component" },
            { id: "css", label: "CSS Module" },
            { id: "tailwind", label: "Tailwind" },
          ]}
        />
        {source === "tsx" && tsx && <CodeBlock code={tsx.content} filename={tsx.path} maxHeight="36rem" />}
        {source === "css" && css && <CodeBlock code={css.content} language="css" filename={css.path} maxHeight="36rem" />}
        {source === "tailwind" && <CodeBlock code={component.tailwindExample} filename={`${component.slug}-tailwind.tsx`} maxHeight="36rem" />}
      </section>
    </div>
  );
}

