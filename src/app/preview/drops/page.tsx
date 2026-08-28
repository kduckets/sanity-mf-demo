import type { Metadata } from "next";

import { DropsIndexView } from "@/components/drops/DropsIndexView";
import { sanityFetch } from "@/sanity/lib/live";
import { CAPSULE_DROPS_QUERY, type CapsuleDropListItem } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Drops (Preview)",
};

export default async function PreviewDropsIndexPage() {
  const { data } = await sanityFetch({
    query: CAPSULE_DROPS_QUERY,
    perspective: "drafts",
    stega: false,
  });
  const drops = data as CapsuleDropListItem[];

  return (
    <DropsIndexView
      drops={drops}
      linkPrefix="/preview/drops"
      emptyMessage="No drops yet — nothing to preview."
    />
  );
}
