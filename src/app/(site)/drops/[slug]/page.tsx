import { notFound } from "next/navigation";

import { CapsuleDropView } from "@/components/drops/CapsuleDropView";
import { sanityFetch } from "@/sanity/lib/live";
import { CAPSULE_DROP_QUERY, type CapsuleDropDetail } from "@/sanity/lib/queries";
import { pickSpotlightProduct } from "@/sanity/lib/spotlight";

export default async function CapsuleDropPage(
  props: PageProps<"/drops/[slug]">,
) {
  const { slug } = await props.params;
  const [{ data }, spotlightProduct] = await Promise.all([
    sanityFetch({
      query: CAPSULE_DROP_QUERY,
      params: { slug },
      perspective: "published",
      stega: false,
    }),
    pickSpotlightProduct({ perspective: "published" }),
  ]);
  const drop = data as CapsuleDropDetail | null;

  if (!drop) {
    notFound();
  }

  return (
    <CapsuleDropView
      drop={drop}
      backHref="/drops"
      spotlightProduct={spotlightProduct}
    />
  );
}
