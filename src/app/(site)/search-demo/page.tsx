import type { Metadata } from "next";

import { sanityFetch } from "@/sanity/lib/live";
import { SEARCH_DEMO_PRODUCTS_QUERY, type SearchDemoProduct } from "@/sanity/lib/queries";

import { type SearchResult } from "./actions";
import { SearchDemoClient } from "./SearchDemoClient";

export const metadata: Metadata = {
  title: "Search demo",
};

const EXAMPLE_QUERY = "blue wool sweaters under $100, size M";

export default async function SearchDemoPage() {
  // First paint is server-rendered from the same deterministic query this
  // page always ran — no round trip to Content Agent needed just to load.
  // Typing a new query in the box below is what triggers a real extraction.
  const { data } = await sanityFetch({
    query: SEARCH_DEMO_PRODUCTS_QUERY,
    perspective: "published",
    stega: false,
  });

  const initialResult: SearchResult = {
    query: EXAMPLE_QUERY,
    products: data as SearchDemoProduct[],
    filters: { category: "sweater", color: "blue", materials: ["wool"], maxPrice: 100, size: "M" },
    usedFallback: false,
    noFiltersRecognized: false,
  };

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
          One panel guesses by similarity. The other sends your words to a
          real Content Agent, which extracts exact filters and runs them as
          GROQ.
        </p>

        <SearchDemoClient initialResult={initialResult} />
      </section>
    </main>
  );
}
