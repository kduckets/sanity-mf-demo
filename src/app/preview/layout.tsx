import { VisualEditing } from "next-sanity/visual-editing";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex items-center justify-center gap-3 bg-amber-300 px-4 py-2 text-center text-xs font-medium tracking-wide text-amber-950 uppercase">
        <span>Preview — showing unpublished changes, not the live site</span>
        <Link
          href="/"
          className="rounded-full border border-amber-950/40 px-2 py-0.5 normal-case hover:bg-amber-950/10"
        >
          Go to live site
        </Link>
      </div>
      <SiteHeader dropsHref="/preview/drops" magazineHref="/preview/magazine" />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
      <VisualEditing />
    </div>
  );
}
