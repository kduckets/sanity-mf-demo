import Image from "next/image";

import { urlForImage } from "@/sanity/lib/image";
import type { SpotlightProduct } from "@/sanity/lib/queries";

const STATUS_LABEL: Record<string, string> = {
  in_stock: "In stock",
  sold_out: "Sold out",
  pending: "Pending",
  draft: "Draft",
};

const STATUS_STYLE: Record<string, string> = {
  in_stock: "bg-emerald-100 text-emerald-800",
  sold_out: "bg-neutral-200 text-neutral-700",
  pending: "bg-amber-100 text-amber-800",
  draft: "bg-red-100 text-red-800",
};

export function ProductRow({ product }: { product: SpotlightProduct }) {
  const productImage = urlForImage(product.image ?? undefined);
  const status = product.availabilityStatus ?? "pending";

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-surface p-3">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
        {productImage && (
          <Image
            src={productImage.width(160).height(160).url()}
            alt={product.name ?? ""}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{product.name}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? STATUS_STYLE.pending}`}
          >
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
        <p className="text-xs text-muted">{product.sku}</p>
        <p className="text-sm">
          {product.price === undefined || product.price === null ? (
            <span className="font-medium text-red-600">Price unavailable</span>
          ) : (
            <>
              <span className="font-medium">${product.price.toFixed(2)}</span>
              {product.previousPrice != null &&
                product.previousPrice !== product.price && (
                  <span className="ml-2 text-neutral-400 line-through">
                    ${product.previousPrice.toFixed(2)}
                  </span>
                )}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
