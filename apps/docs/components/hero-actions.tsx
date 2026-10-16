"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RollingText } from "@motionfoundry/ui";

type Action = { label: string; href: string };

/** Hero CTAs — plain links (client-side navigation, no nested <button> in <a>). */
export function HeroActions({
  primary = { label: "Get started", href: "/docs/getting-started" },
  secondary = { label: "Explore Scroll", href: "/collections/scroll" },
  className = "",
}: {
  primary?: Action;
  secondary?: Action;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
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

/** Closing CTA: a RollingText pill that navigates on click. */
export function RollingCta({ label, href }: { label: string; href: string }) {
  const router = useRouter();
  return (
    <RollingText
      text={label}
      onClick={() => router.push(href)}
      fontSize={15}
      color="#0a0a0a"
      hoverColor="#0a0a0a"
      className="!rounded-full !bg-foreground !px-6 !py-3 !font-medium !tracking-tight transition hover:!bg-foreground/90"
    />
  );
}
