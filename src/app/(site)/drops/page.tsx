import type { Metadata } from "next";

import { DropsIndexView } from "@/components/drops/DropsIndexView";
import { sanityFetch } from "@/sanity/lib/live";
import { CAPSULE_DROPS_QUERY, type CapsuleDropListItem } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Drops",
};

export default async function DropsIndexPage() {
  const { data } = await sanityFetch({
    query: CAPSULE_DROPS_QUERY,
    perspective: "published",
    stega: false,
  });
  const drops = data as CapsuleDropListItem[];

  return (
    <DropsIndexView
      drops={drops}
      linkPrefix="/drops"
      emptyMessage="No drops published yet."
    />
  );
}
