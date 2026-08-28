import { notFound } from "next/navigation";

import { CapsuleDropView } from "@/components/drops/CapsuleDropView";
import { getSiteOrigin } from "@/lib/site-origin";
import { dataset, projectId } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { CAPSULE_DROP_QUERY, type CapsuleDropDetail } from "@/sanity/lib/queries";
import { pickSpotlightProduct } from "@/sanity/lib/spotlight";

export default async function PreviewCapsuleDropPage(
  props: PageProps<"/preview/drops/[slug]">,
) {
  const { slug } = await props.params;
  const [{ data }, spotlightProduct, origin] = await Promise.all([
    sanityFetch({
      query: CAPSULE_DROP_QUERY,
      params: { slug },
      perspective: "drafts",
      stega: true,
    }),
    pickSpotlightProduct({ perspective: "drafts" }),
    getSiteOrigin(),
  ]);
  const drop = data as CapsuleDropDetail | null;

  if (!drop) {
    notFound();
  }

  return (
    <CapsuleDropView
      drop={drop}
      backHref="/preview/drops"
      visualEditing={{ projectId, dataset, baseUrl: `${origin}/studio` }}
      spotlightProduct={spotlightProduct}
    />
  );
}
