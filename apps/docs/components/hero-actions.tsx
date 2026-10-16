"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Action = { label: string; href: string };

/** Hero CTAs — plain links (client-side navigation, no nested <button> in <a>). */
export function HeroActions({
  primary = { label: "Get started", href: "/docs/getting-started" },
  secondary = { label: "Explore Scroll", href: "/collections/scroll" },
  align = "center",
  className = "",
}: {
  primary?: Action;
  secondary?: Action;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${align === "start" ? "justify-start" : "justify-center"} ${className}`}>
      <Link
        href={primary.href}
        className="group inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {primary.label}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
      <Link
        href={secondary.href}
        className="inline-flex h-11 items-center rounded-full border border-border bg-background/60 px-5 text-sm font-medium text-foreground/90 backdrop-blur transition hover:border-neutral-600 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {secondary.label}
      </Link>
    </div>
  );
}
