"use client";

import { useRouter } from "next/navigation";
import { MagneticButton, ShinyBorderButton } from "@motionfoundry/ui";

/** Animated buttons that navigate — avoids nesting <button> inside <a>. */
export function HeroActions({
  componentCount,
  secondary = { label: "Browse Studio Kit", href: "/collections/studio-kit" },
}: {
  componentCount: number;
  secondary?: { label: string; href: string };
}) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <MagneticButton label={`Explore ${componentCount} Components`} onClick={() => router.push("/components")} />
      <ShinyBorderButton label={secondary.label} onClick={() => router.push(secondary.href)} />
    </div>
  );
}
