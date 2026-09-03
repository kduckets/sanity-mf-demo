"use client";

import Image from "next/image";
import { useId, useState, useTransition, type FormEvent } from "react";

import { urlForImage } from "@/sanity/lib/image";

import { askShoppingAssistant, type AssistantTurn } from "./actions";

const SUGGESTED_PROMPTS = [
  "Show me blue wool sweaters under $100 in size M.",
  "Wool sweaters",
  "Amber wool crewneck, size M",
  "Something for a rainy weekend",
];

// Deliberately hardcoded and never queried against real data — this is the
// illustrative wrong answer, not a real search. It only ever appears once,
// attached to the opening example, and must never respond to anything typed.
const SIMILARITY_ANSWER = [
  { name: "Alpine Cashmere Overcoat", note: "related: wool-adjacent fiber, $640" },
  { name: "Sea-Glass Cotton Tee", note: "related: blue, $42" },
  { name: "Harborline Wool Scarf", note: "related: wool, $96" },
];

function filterChips(filters: AssistantTurn["filters"]) {
  const chips: string[] = [];
  if (filters.category) chips.push(`category: ${filters.category}`);
  if (filters.color) chips.push(`color: ${filters.color}`);
  if (filters.materials?.length) chips.push(`material: ${filters.materials.join(", ")}`);
  if (filters.maxPrice !== undefined) chips.push(`price < $${filters.maxPrice}`);
  if (filters.size) chips.push(`size: ${filters.size}`);
  return chips;
}

type LogEntry =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "similarity" }
  | { id: string; role: "assistant"; turn: AssistantTurn };

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-sm text-white">
        {text}
      </div>
    </div>
  );
}

function SimilarityBubble() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-4 py-3">
        <span className="text-xs font-semibold tracking-wide text-red-700 uppercase">
          Similarity search
        </span>
        <p className="mt-1 text-xs text-red-800/80">
          All related. None matching.
        </p>
        <ul className="mt-2 space-y-1.5">
          {SIMILARITY_ANSWER.map((item) => (
            <li key={item.name} className="text-sm text-red-900">
              <span className="font-medium">{item.name}</span>{" "}
              <span className="text-xs text-red-700/70">— {item.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AssistantBubble({ turn }: { turn: AssistantTurn }) {
  const chips = filterChips(turn.filters);
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3">
        <span className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
          Sanity Content Agent
        </span>

        {turn.usedFallback && (
          <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">
            Content Agent didn&apos;t respond — showing the example instead.
          </p>
        )}

        {turn.noFiltersRecognized ? (
          <p className="mt-1.5 text-xs text-muted">
            No catalog constraint recognized — try a category, color,
            material, price, or size.
          </p>
        ) : chips.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
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
        ) : null}

        {turn.products.length === 0 && !turn.noFiltersRecognized ? (
          <p className="mt-2 text-sm text-muted">
            No products in the catalog match those constraints.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {turn.products.map((product) => {
              const image = urlForImage(product.image ?? undefined);
              return (
                <li key={product._id} className="flex gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                    {image && (
                      <Image
                        src={image.width(96).height(96).url()}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
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
        )}
      </div>
    </div>
  );
}

export function ShoppingAssistantClient({ initialTurn }: { initialTurn: AssistantTurn }) {
  const inputId = useId();
  const [log, setLog] = useState<LogEntry[]>([
    { id: "seed-user", role: "user", text: initialTurn.query },
    { id: "seed-similarity", role: "similarity" },
    { id: "seed-assistant", role: "assistant", turn: initialTurn },
  ]);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const userId = `user-${Date.now()}`;
    setLog((prev) => [...prev, { id: userId, role: "user", text: trimmed }]);
    setQuery("");
    startTransition(async () => {
      const turn = await askShoppingAssistant(trimmed);
      setLog((prev) => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", turn }]);
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send(query);
  }

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4">
        {log.map((entry) => {
          if (entry.role === "user") return <UserBubble key={entry.id} text={entry.text} />;
          if (entry.role === "similarity") return <SimilarityBubble key={entry.id} />;
          return <AssistantBubble key={entry.id} turn={entry.turn} />;
        })}
        {pending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2.5 text-xs text-muted">
              Asking Content Agent…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <label htmlFor={inputId} className="mb-2 block text-xs tracking-wide text-muted uppercase">
          Ask the assistant
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. wool sweaters under $100"
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground/90 focus:ring-accent/40 focus:ring-2 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || !query.trim()}
            className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => send(prompt)}
            disabled={pending}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground/80 transition hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>

      <p className="mt-6 max-w-2xl text-sm text-muted">
        Every match above satisfies every constraint — because a real
        Content Agent call turned your words into filters, and GROQ ran
        them as a filter, not a guess.
      </p>
    </div>
  );
}
