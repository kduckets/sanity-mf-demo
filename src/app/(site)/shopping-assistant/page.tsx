import type { Metadata } from "next";

import { sanityFetch } from "@/sanity/lib/live";
import { SHOPPING_ASSISTANT_EXAMPLE_QUERY, type ShoppingProduct } from "@/sanity/lib/queries";

import type { AssistantTurn } from "./actions";
import { ShoppingAssistantClient } from "./ShoppingAssistantClient";

export const metadata: Metadata = {
  title: "Shopping assistant",
};

const EXAMPLE_QUERY = "Show me blue wool sweaters under $100 in size M.";

export default async function ShoppingAssistantPage() {
  // First paint is server-rendered from the same deterministic query this
  // page always runs for the opening example — no round trip to Content
  // Agent needed just to load. Typing a new question is what triggers a
  // real extraction.
  const { data } = await sanityFetch({
    query: SHOPPING_ASSISTANT_EXAMPLE_QUERY,
    perspective: "published",
    stega: false,
  });

  const initialTurn: AssistantTurn = {
    query: EXAMPLE_QUERY,
    products: data as ShoppingProduct[],
    filters: { category: "sweater", color: "blue", materials: ["wool"], maxPrice: 100, size: "M" },
    usedFallback: false,
    noFiltersRecognized: false,
  };

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">For engineering</p>
        <h1 className="font-display mt-3 text-4xl sm:text-5xl">
          Shopping assistant
        </h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-foreground/90">
          A similarity-search bot guesses. This one sends your question to a
          real Content Agent, which turns it into exact filters and runs
          them as GROQ.
        </p>

        <ShoppingAssistantClient initialTurn={initialTurn} />
      </section>
    </main>
  );
}
