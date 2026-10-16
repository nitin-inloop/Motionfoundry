import * as React from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { BRAND_CONFIG } from "../lib/brand";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { getNavIndex } from "../lib/nav";

export const metadata = {
  title: `${BRAND_CONFIG.name} — ${BRAND_CONFIG.tagline}`,
  description: "Open-source animated React component library built with Motion, TypeScript, and scoped CSS Modules — plus 11 brand design systems as theme presets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <SiteHeader nav={getNavIndex()} />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
