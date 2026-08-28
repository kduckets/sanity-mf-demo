"use client";

import { createDataAttribute, useOptimistic } from "@sanity/visual-editing/react";
import type { SanityDocument } from "@sanity/client";

import { ProductRow } from "@/components/drops/ProductRow";
import type { DropProduct } from "@/sanity/lib/queries";

interface RawCapsuleDrop {
  products?: { _key: string }[];
}

export function PreviewProductList({
  documentId,
  documentType,
  products: initialProducts,
  attributeConfig,
}: {
  documentId: string;
  documentType: string;
  products: DropProduct[];
  attributeConfig: { projectId: string; dataset: string; baseUrl: string };
}) {
  // The raw document's `products` field is an array of references
  // ({_key, _ref}) — Presentation Tool's drag reorder only ever changes the
  // order of those. Re-derive our already-dereferenced rows (name, price,
  // image, ...) by that new _key order rather than using the raw document
  // as the new state directly, which would only give us bare references.
  const products = useOptimistic<DropProduct[], SanityDocument<RawCapsuleDrop>>(
    initialProducts,
    (current, action) => {
      if (action.id !== documentId || !action.document.products) return current;
      const byKey = new Map(current.map((product) => [product._key, product]));
      const reordered = action.document.products
        .map((item) => byKey.get(item._key))
        .filter((product): product is DropProduct => Boolean(product));
      return reordered.length === current.length ? reordered : current;
    },
  );

  const attr = createDataAttribute({ ...attributeConfig, id: documentId, type: documentType });

  if (products.length === 0) return null;

  return (
    <ul className="space-y-4" data-sanity={attr.combine({ path: "products" }).toString()}>
      {products.map((product) => (
        <li
          key={product._key}
          data-sanity={attr
            .combine({ path: `products[_key=="${product._key}"]` })
            .toString()}
        >
          <ProductRow product={product} />
        </li>
      ))}
    </ul>
  );
}
