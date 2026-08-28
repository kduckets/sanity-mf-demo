import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale",
};

export default function WholesalePage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-20">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">Wholesale</p>
      <h1 className="font-display mt-3 text-4xl sm:text-5xl">
        Carry Marlowe &amp; Finch labels.
      </h1>
      <div className="mt-10 space-y-6 leading-relaxed text-foreground/90">
        <p>
          We work with a growing list of independent boutiques and department
          stores to bring our labels to their customers, with the same
          launch-day product data and imagery used on our own site — no
          separate feed, no lag between what we announce and what you can
          sell.
        </p>
        <p>
          Buyers get access to look-ahead editorial on upcoming capsule drops,
          along with linked, always-current product data — pricing and
          availability — well ahead of launch day.
        </p>
      </div>
      <a
        href="mailto:wholesale@marloweandfinch.com"
        className="mt-10 inline-flex items-center rounded-full bg-foreground px-6 py-3 text-sm font-medium tracking-wide text-background uppercase transition hover:opacity-90"
      >
        Enquire about wholesale
      </a>
    </main>
  );
}
