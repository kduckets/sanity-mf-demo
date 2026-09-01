import Link from "next/link";

export function SiteHeader({ dropsHref = "/drops" }: { dropsHref?: string }) {
  const navLinks = [
    { href: dropsHref, label: "Drops" },
    { href: "/about", label: "About" },
    { href: "/wholesale", label: "Wholesale" },
    { href: "/search-demo", label: "Search demo" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="font-display text-lg font-medium tracking-[0.12em] uppercase"
        >
          Marlowe &amp; Finch
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="tracking-wide text-foreground/80 uppercase transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
