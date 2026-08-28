import { ProductRow } from "@/components/drops/ProductRow";
import type { SpotlightProduct } from "@/sanity/lib/queries";

export function ProductSpotlight({
  heading,
  product,
}: {
  heading?: string;
  product: SpotlightProduct | null;
}) {
  if (!product) return null;

  return (
    <div className="my-8 rounded-lg border border-accent/30 bg-surface p-4">
      <p className="text-xs font-medium tracking-[0.15em] text-accent uppercase">
        {heading || "Just for you"}
      </p>
      <div className="mt-3">
        <ProductRow product={product} />
      </div>
    </div>
  );
}
