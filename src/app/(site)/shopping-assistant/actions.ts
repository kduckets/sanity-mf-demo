"use server";

import { extractSearchFilters, runFilteredSearch, type SearchFilters } from "@/sanity/lib/agentSearch";
import { sanityFetch } from "@/sanity/lib/live";
import { SHOPPING_ASSISTANT_EXAMPLE_QUERY, type ShoppingProduct } from "@/sanity/lib/queries";

export interface AssistantTurn {
  query: string;
  products: ShoppingProduct[];
  filters: SearchFilters;
  // True when the real Content Agent call failed (network, plan not
  // AI-enabled, timeout, malformed output) and this fell back to the
  // canonical example instead — never silently pretend the AI ran.
  usedFallback: boolean;
  // True when extraction succeeded but recognized no catalog constraints in
  // the request — a legitimate outcome, not a failure, so it's kept distinct
  // from usedFallback.
  noFiltersRecognized: boolean;
}

async function fallbackTurn(query: string): Promise<AssistantTurn> {
  const { data } = await sanityFetch({
    query: SHOPPING_ASSISTANT_EXAMPLE_QUERY,
    perspective: "published",
    stega: false,
  });
  return {
    query,
    products: data as ShoppingProduct[],
    filters: { category: "sweater", color: "blue", materials: ["wool"], maxPrice: 100, size: "M" },
    usedFallback: true,
    noFiltersRecognized: false,
  };
}

export async function askShoppingAssistant(query: string): Promise<AssistantTurn> {
  const trimmed = query.trim();
  if (!trimmed) return fallbackTurn(query);

  try {
    const filters = await extractSearchFilters(trimmed);

    if (Object.keys(filters).length === 0) {
      return { query, products: [], filters, usedFallback: false, noFiltersRecognized: true };
    }

    const products = await runFilteredSearch(filters);
    return { query, products, filters, usedFallback: false, noFiltersRecognized: false };
  } catch (err) {
    console.error("Shopping assistant extraction failed, falling back:", err);
    return fallbackTurn(query);
  }
}
