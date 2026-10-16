"use client";

import { useRouter } from "next/navigation";
import { MagneticButton, ShinyBorderButton } from "@motionfoundry/ui";

/** Animated buttons that navigate — avoids nesting <button> inside <a>. */
export function HeroActions({ componentCount }: { componentCount: number }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <MagneticButton label={`Explore ${componentCount} Components`} onClick={() => router.push("/components")} />
      <ShinyBorderButton label="Browse Studio Kit" onClick={() => router.push("/collections/studio-kit")} />
    </div>
  );
}
