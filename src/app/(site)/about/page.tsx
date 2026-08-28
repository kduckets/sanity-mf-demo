import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

const STATS = [
  { label: "Founded", value: "2014" },
  { label: "Net revenue", value: "$650M" },
  { label: "Owned labels", value: "6" },
  { label: "Wholesale doors", value: "1,200+" },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">About</p>
        <h1 className="font-display mt-3 text-4xl sm:text-5xl">
          A house of labels, not a single brand.
        </h1>
        <div className="mt-10 space-y-6 leading-relaxed text-foreground/90">
          <p>
            Marlowe &amp; Finch started as a single studio label and has grown
            into a portfolio of design-led fashion brands, each with its own
            point of view — united by the same standard for material,
            construction, and pace.
          </p>
          <p>
            We sell direct-to-consumer through our own sites and, over the
            last several years, through a fast-growing wholesale channel of
            independent boutiques and department stores. That dual channel is
            the reason editorial and product have to move together: a launch
            story goes out once, everywhere, and the product behind it needs
            to be right the first time — not caught up to later.
          </p>
          <p>
            Every capsule drop on this site pairs a label&apos;s editorial
            story with the exact product data — pricing, availability — that
            powers it, in one place.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs tracking-wide text-muted uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
