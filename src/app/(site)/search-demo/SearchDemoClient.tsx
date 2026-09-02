"use client";

import Image from "next/image";
import { useState, useTransition, type FormEvent } from "react";

import { urlForImage } from "@/sanity/lib/image";

import { searchWithAgent, type SearchResult } from "./actions";

// Deliberately hardcoded and never queried against real data — this panel
// illustrates a failure mode (surface-level similarity), not a real search.
// It must never accidentally become correct, no matter what's typed above.
const SIMILARITY_RESULTS = [
  { name: "Alpine Cashmere Overcoat", note: "related: wool-adjacent fiber, $640" },
  { name: "Sea-Glass Cotton Tee", note: "related: blue, $42" },
  { name: "Harborline Wool Scarf", note: "related: wool, $96" },
  { name: "Amber Merino Sweater", note: "related: sweater, wool, $118" },
];

function filterChips(filters: SearchResult["filters"]) {
  const chips: string[] = [];
  if (filters.category) chips.push(`category: ${filters.category}`);
  if (filters.color) chips.push(`color: ${filters.color}`);
  if (filters.materials?.length) chips.push(`material: ${filters.materials.join(", ")}`);
  if (filters.maxPrice !== undefined) chips.push(`price < $${filters.maxPrice}`);
  if (filters.size) chips.push(`size: ${filters.size}`);
  return chips;
}

export function SearchDemoClient({ initialResult }: { initialResult: SearchResult }) {
  const [query, setQuery] = useState(initialResult.query);
  const [result, setResult] = useState(initialResult);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const next = await searchWithAgent(query);
      setResult(next);
    });
  }

  const chips = filterChips(result.filters);

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-10 max-w-xl">
        <label
          htmlFor="search-demo-input"
          className="mb-2 block text-xs tracking-wide text-muted uppercase"
        >
          Search — type your own, or use the example
        </label>
        <div className="flex gap-2">
          <input
            id="search-demo-input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground/90 focus:ring-accent/40 focus:ring-2 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || !query.trim()}
            className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Asking Content Agent…" : "Search"}
          </button>
        </div>
      </form>

      {result.usedFallback && (
        <p className="mt-3 max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Content Agent didn&apos;t respond — showing the built-in example query instead.
        </p>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl">Similarity search</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              All related. None matching.
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Ranked by surface-level resemblance — shares a word or a vibe, not
            the actual constraints. (Static — doesn&apos;t respond to the box
            above; that&apos;s the point.)
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
            <h2 className="font-display text-xl">Content Agent → GROQ</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {result.products.length} exact match
              {result.products.length === 1 ? "" : "es"}
            </span>
          </div>

          {result.noFiltersRecognized ? (
            <p className="mt-2 text-xs text-muted">
              Didn&apos;t recognize a catalog constraint in that request — try
              mentioning a category, color, material, price, or size.
            </p>
          ) : chips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted">Understood as:</span>
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">No constraints applied.</p>
          )}

          <ul className="mt-5 space-y-3">
            {result.products.length === 0 && !result.noFiltersRecognized && (
              <li className="rounded-lg border border-border/70 bg-background px-4 py-3 text-sm text-muted">
                No products in the catalog match those constraints.
              </li>
            )}
            {result.products.map((product) => {
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
                      {product.price !== undefined ? `$${product.price.toFixed(2)}` : ""}
                      {product.availableSizes?.length
                        ? ` · sizes ${product.availableSizes.join(", ")}`
                        : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="mt-8 max-w-2xl text-sm text-muted">
        Every result on the right matches every constraint — because a real
        Content Agent call turned the sentence above into filters, and GROQ
        ran them as a filter, not a guess.
      </p>
    </>
  );
}
