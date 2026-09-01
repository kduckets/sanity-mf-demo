import type { Metadata } from "next";
import Image from "next/image";

import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import {
  SEARCH_DEMO_PRODUCTS_QUERY,
  type SearchDemoProduct,
} from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Search demo",
};

const EXAMPLE_QUERY = "blue wool sweaters under $100, size M";

// Deliberately hardcoded and never queried against real data — this panel
// illustrates a failure mode (surface-level similarity), not a real search.
// It must never accidentally become correct.
const SIMILARITY_RESULTS = [
  { name: "Alpine Cashmere Overcoat", note: "related: wool-adjacent fiber, $640" },
  { name: "Sea-Glass Cotton Tee", note: "related: blue, $42" },
  { name: "Harborline Wool Scarf", note: "related: wool, $96" },
  { name: "Amber Merino Sweater", note: "related: sweater, wool, $118" },
];

export default async function SearchDemoPage() {
  const { data } = await sanityFetch({
    query: SEARCH_DEMO_PRODUCTS_QUERY,
    perspective: "published",
    stega: false,
  });
  const matches = data as SearchDemoProduct[];

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">
          For merchandising &amp; product search
        </p>
        <h1 className="font-display mt-3 text-4xl sm:text-5xl">
          Structured search, not a guess.
        </h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-foreground/90">
          Same query, two approaches. One treats every field as a fuzzy
          similarity signal. The other filters on the actual structured
          fields in the catalog — category, color, material, price, size —
          and returns only what genuinely matches.
        </p>

        <div className="mt-10 max-w-xl">
          <label className="mb-2 block text-xs tracking-wide text-muted uppercase">
            Search
          </label>
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground/90">
            {EXAMPLE_QUERY}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl">Similarity search</h2>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                All related. None matching.
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Ranked by surface-level resemblance — shares a word or a vibe,
              not the actual constraints.
            </p>
            <ul className="mt-5 space-y-3">
              {SIMILARITY_RESULTS.map((item) => (
                <li
                  key={item.name}
                  className="rounded-lg border border-border/70 bg-background px-4 py-3"
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted">{item.note}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl">GROQ, constraint-based</h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                {matches.length} exact match{matches.length === 1 ? "" : "es"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              category == &quot;sweater&quot; &amp;&amp; color == &quot;blue&quot;
              &amp;&amp; &quot;wool&quot; in materials &amp;&amp; price &lt; 100
              &amp;&amp; &quot;M&quot; in availableSizes
            </p>
            <ul className="mt-5 space-y-3">
              {matches.length === 0 && (
                <li className="rounded-lg border border-border/70 bg-background px-4 py-3 text-sm text-muted">
                  No matches — run the search-demo seed to populate the catalog.
                </li>
              )}
              {matches.map((product) => {
                const image = urlForImage(product.image ?? undefined);
                return (
                  <li
                    key={product._id}
                    className="flex gap-3 rounded-lg border border-border/70 bg-background px-4 py-3"
                  >
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                      {image && (
                        <Image
                          src={image.width(112).height(112).url()}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted">
                        ${product.price?.toFixed(2)} · sizes{" "}
                        {product.availableSizes?.join(", ")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-sm text-muted">
          Every result on the right matches every constraint — because it&apos;s
          a filter, not a guess.
        </p>
      </section>
    </main>
  );
}
