import * as React from "react";
import { DocsSidebar } from "../../components/docs-sidebar";
import { getNavIndex } from "../../lib/nav";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1600px] gap-0 px-4 md:px-8 lg:gap-10">
      <DocsSidebar nav={getNavIndex()} />
      {children}
    </div>
  );
}
