import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";

import { PreviewProductList } from "@/components/drops/PreviewProductList";
import { PreviewStoryContent } from "@/components/drops/PreviewStoryContent";
import { ProductRow } from "@/components/drops/ProductRow";
import { createStoryComponents } from "@/components/drops/storyComponents";
import { urlForImage } from "@/sanity/lib/image";
import type { CapsuleDropDetail, DropProduct, SpotlightProduct } from "@/sanity/lib/queries";

export function CapsuleDropView({
  drop,
  backHref,
  visualEditing,
  spotlightProduct,
}: {
  drop: CapsuleDropDetail;
  backHref: string;
  /** When set, the product list and story become drag-reorderable via Presentation Tool. */
  visualEditing?: { projectId: string; dataset: string; baseUrl: string };
  /** The "Just for you" recommendation, if one was picked for this render. */
  spotlightProduct?: SpotlightProduct | null;
}) {
  const heroImage = urlForImage(drop.heroImage ?? undefined);
  const launchDate = drop.launchDate
    ? new Date(drop.launchDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const products = (drop.products ?? []).filter(
    (product): product is DropProduct => Boolean(product),
  );
  const resolvedSpotlight = spotlightProduct ?? null;

  return (
    <main className="flex-1">
      <div className="relative h-[62vh] min-h-[380px] w-full bg-neutral-900">
        {heroImage && (
          <Image
            src={heroImage.width(1920).height(1080).url()}
            alt={drop.title ?? ""}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12 text-white">
          <Link
            href={backHref}
            className="mb-6 w-fit text-xs tracking-[0.15em] text-white/70 uppercase hover:text-white"
          >
            ← All drops
          </Link>
          <p className="text-xs tracking-[0.25em] text-white/70 uppercase">
            {launchDate}
            {drop.creatorCollaborator ? ` · x ${drop.creatorCollaborator}` : ""}
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-4xl leading-[1.05] sm:text-5xl">
            {drop.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-16 md:grid-cols-[2fr_1fr]">
        <article className="max-w-none">
          {drop.editorialStory &&
            (visualEditing ? (
              <PreviewStoryContent
                documentId={drop._id}
                documentType="capsuleDrop"
                story={drop.editorialStory}
                spotlightProduct={resolvedSpotlight}
                attributeConfig={visualEditing}
              />
            ) : (
              <PortableText
                value={drop.editorialStory}
                components={createStoryComponents(resolvedSpotlight)}
              />
            ))}
        </article>

        <aside className="space-y-6">
          <h2 className="text-sm font-medium tracking-[0.15em] text-muted uppercase">
            Shop the drop
          </h2>
          {visualEditing ? (
            <PreviewProductList
              documentId={drop._id}
              documentType="capsuleDrop"
              products={products}
              attributeConfig={visualEditing}
            />
          ) : (
            <ul className="space-y-4">
              {products.map((product) => (
                <li key={product._key}>
                  <ProductRow product={product} />
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
