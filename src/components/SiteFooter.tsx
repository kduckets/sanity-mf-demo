import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm space-y-3">
          <p className="font-display text-lg tracking-[0.12em] uppercase">
            Marlowe &amp; Finch
          </p>
          <p className="text-sm leading-relaxed text-muted">
            A portfolio of design-led fashion labels, sold direct-to-consumer
            and through a growing wholesale network of independent boutiques
            and department stores.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
            Shop
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/drops" className="hover:text-accent">
                All drops
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-accent">
                Latest launch
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
            Company
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-accent">
                About
              </Link>
            </li>
            <li>
              <Link href="/wholesale" className="hover:text-accent">
                Wholesale
              </Link>
            </li>
            <li>
              <a
                href="mailto:press@marloweandfinch.com"
                className="hover:text-accent"
              >
                Press &amp; partnerships
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Marlowe &amp; Finch. Demo build —
            not a real retailer.
          </p>
          <Link href="/preview/drops" className="hover:text-accent">
            Preview draft edits →
          </Link>
        </div>
      </div>
    </footer>
  );
}
