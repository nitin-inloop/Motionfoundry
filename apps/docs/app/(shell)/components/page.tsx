import { redirect } from "next/navigation";
import { getListedComponents } from "../../../lib/registry";

/**
 * There is no catalog grid: /components opens the first component's playground directly
 * (Scroll first), where it can be previewed, customized, and copied.
 */
export default function ComponentsIndexPage() {
  const first = getListedComponents()[0];
  redirect(first ? `/components/${first.slug}` : "/docs/getting-started");
}
