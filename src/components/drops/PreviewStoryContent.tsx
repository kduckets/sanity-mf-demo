"use client";

import { PortableText } from "@portabletext/react";
import { createDataAttribute, useOptimistic } from "@sanity/visual-editing/react";
import type { SanityDocument } from "@sanity/client";

import { ProductSpotlight } from "@/components/drops/ProductSpotlight";
import { createStoryComponents } from "@/components/drops/storyComponents";
import type {
  EditorialStoryNode,
  ProductSpotlightNode,
  SpotlightProduct,
} from "@/sanity/lib/queries";

interface RawCapsuleDrop {
  editorialStory?: { _key: string }[];
}

function isProductSpotlight(node: EditorialStoryNode): node is ProductSpotlightNode {
  return node._type === "productSpotlight";
}

export function PreviewStoryContent({
  documentId,
  documentType,
  story: initialStory,
  spotlightProduct,
  attributeConfig,
}: {
  documentId: string;
  documentType: string;
  story: EditorialStoryNode[];
  spotlightProduct: SpotlightProduct | null;
  attributeConfig: { projectId: string; dataset: string; baseUrl: string };
}) {
  // Same approach as PreviewProductList: re-derive the already-fetched (and
  // stega-encoded) items by the new _key order from the raw document, rather
  // than rendering the raw mutation payload directly, so click-to-edit
  // overlays keep working on blocks that didn't move.
  const story = useOptimistic<EditorialStoryNode[], SanityDocument<RawCapsuleDrop>>(
    initialStory,
    (current, action) => {
      if (action.id !== documentId || !action.document.editorialStory) return current;
      const byKey = new Map(current.map((node) => [node._key, node]));
      const reordered = action.document.editorialStory
        .map((item) => byKey.get(item._key))
        .filter((node): node is EditorialStoryNode => Boolean(node));
      return reordered.length === current.length ? reordered : current;
    },
  );

  const storyComponents = createStoryComponents(spotlightProduct);
  const attr = createDataAttribute({ ...attributeConfig, id: documentId, type: documentType });

  return (
    <div data-sanity={attr.combine({ path: "editorialStory" }).toString()}>
      {story.map((node) => (
        <div
          key={node._key}
          data-sanity={attr
            .combine({ path: `editorialStory[_key=="${node._key}"]` })
            .toString()}
        >
          {isProductSpotlight(node) ? (
            <ProductSpotlight heading={node.heading} product={spotlightProduct} />
          ) : (
            <PortableText value={[node]} components={storyComponents} />
          )}
        </div>
      ))}
    </div>
  );
}
