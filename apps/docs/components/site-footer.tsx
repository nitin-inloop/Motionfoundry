import Link from "next/link";
import { BRAND_CONFIG } from "../lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 md:px-8">
        <p>
          Built by the {BRAND_CONFIG.name} contributors. The source code is available on{" "}
          <a href={BRAND_CONFIG.repoUrl} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4 hover:text-foreground">
            GitHub
          </a>
          . v{BRAND_CONFIG.version} · {BRAND_CONFIG.license} License.
        </p>
        <div className="flex gap-5">
          <Link href="/docs/getting-started" className="hover:text-foreground">Docs</Link>
          <Link href="/designs" className="hover:text-foreground">Designs</Link>
          <Link href="/docs/contributing" className="hover:text-foreground">Contributing</Link>
          <Link href="/docs/changelog" className="hover:text-foreground">Changelog</Link>
        </div>
      </div>
    </footer>
  );
}
