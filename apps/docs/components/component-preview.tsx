"use client";

import * as React from "react";
import * as UI from "@motionfoundry/ui";
import type { PropValue } from "../lib/registry";

type AnyComponent = React.ComponentType<Record<string, PropValue>>;

const COMPONENTS = UI as unknown as Record<string, AnyComponent | undefined>;

export function hasPreview(name: string): boolean {
  return typeof COMPONENTS[name] === "function";
}

/** Renders a registry component by export name with the given props. */
export function ComponentPreview({ name, props }: { name: string; props?: Record<string, PropValue> }) {
  const Component = COMPONENTS[name];
  if (!Component) {
    return <p className="font-mono text-xs text-muted-foreground">No preview export named {name}.</p>;
  }
  return <Component {...(props ?? {})} />;
}

/**
 * Mounts its children only once scrolled near the viewport, so catalog pages with dozens of
 * live previews stay smooth. Children unmount again when far off-screen to stop animation loops.
 */
export function LazyMount({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? children : null}
    </div>
  );
}

/** Scales a full-size preview down into a fixed-height thumbnail frame. */
export function PreviewThumbnail({ name, props, scale = 0.62 }: { name: string; props?: Record<string, PropValue>; scale?: number }) {
  return (
    <LazyMount className="mf-stage relative flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border">
      <div
        className="pointer-events-auto flex w-full items-center justify-center"
        style={{ transform: `scale(${scale})`, width: `${100 / scale}%`, flexShrink: 0 }}
      >
        <ComponentPreview name={name} props={props} />
      </div>
    </LazyMount>
  );
}
