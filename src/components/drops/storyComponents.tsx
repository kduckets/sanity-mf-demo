import type { PortableTextComponents } from "@portabletext/react";

import { ProductSpotlight } from "@/components/drops/ProductSpotlight";
import type { ProductSpotlightNode, SpotlightProduct } from "@/sanity/lib/queries";

// Shared between the server-rendered public view and the client-side
// draggable preview view, so it's kept in its own module rather than
// defined inline — React function components can't be passed as props
// across the server/client boundary, but both sides can import the same
// factory and build their own instance locally.
export function createStoryComponents(
  spotlightProduct: SpotlightProduct | null,
): PortableTextComponents {
  return {
    block: {
      h2: ({ children }) => (
        <h2 className="font-display mt-8 text-2xl">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="font-display mt-6 text-xl">{children}</h3>
      ),
      normal: ({ children }) => (
        <p className="mt-4 leading-relaxed text-foreground/85">{children}</p>
      ),
      blockquote: ({ children }) => (
        <blockquote className="mt-4 border-l-2 border-accent/40 pl-4 italic text-muted">
          {children}
        </blockquote>
      ),
    },
    types: {
      productSpotlight: ({ value }: { value: ProductSpotlightNode }) => (
        <ProductSpotlight heading={value.heading} product={spotlightProduct} />
      ),
    },
  };
}
