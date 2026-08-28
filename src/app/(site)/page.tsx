import Image from "next/image";
import Link from "next/link";

import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { CAPSULE_DROPS_QUERY, type CapsuleDropListItem } from "@/sanity/lib/queries";

export default async function Home() {
  const { data } = await sanityFetch({
    query: CAPSULE_DROPS_QUERY,
    perspective: "published",
    stega: false,
  });
  const drops = data as CapsuleDropListItem[];
  const [featured, ...rest] = drops;
  const featuredImage = urlForImage(featured?.heroImage ?? undefined);

  return (
    <main className="flex-1">
      <section className="relative flex h-[78vh] min-h-[520px] w-full items-end overflow-hidden bg-neutral-900 text-white">
        {featuredImage && (
          <Image
            src={featuredImage.width(2000).height(1200).url()}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16">
          <p className="text-xs tracking-[0.3em] text-white/70 uppercase">
            A portfolio of design-led labels
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-5xl leading-[1.05] font-medium sm:text-6xl">
            Clothes worth the wait, on a timeline that finally makes sense.
          </h1>
          {featured && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/drops/${featured.slug}`}
                className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-medium tracking-wide text-neutral-900 uppercase transition hover:bg-white/90"
              >
                Shop {featured.title}
              </Link>
              <span className="text-sm text-white/70">
                {featured.creatorCollaborator ? `x ${featured.creatorCollaborator}` : null}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="font-display text-2xl leading-relaxed sm:text-3xl">
          Marlowe &amp; Finch is home to a group of design-led fashion labels —
          sold direct-to-consumer and through a growing wholesale network of
          independent boutiques and department stores.
        </p>
        <Link
          href="/about"
          className="mt-6 inline-block text-sm tracking-wide text-accent uppercase hover:underline"
        >
          About the company →
        </Link>
      </section>

      {rest.length > 0 && (
        <section id="drops" className="border-t border-border bg-surface py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="font-display text-3xl">More from the studio</h2>
              <Link
                href="/drops"
                className="text-sm tracking-wide text-accent uppercase hover:underline"
              >
                View all drops →
              </Link>
            </div>
            <ul className="grid gap-8 sm:grid-cols-2">
              {rest.map((drop) => {
                const image = urlForImage(drop.heroImage ?? undefined);
                return (
                  <li key={drop._id}>
                    <Link href={`/drops/${drop.slug}`} className="group block">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-neutral-100">
                        {image && (
                          <Image
                            src={image.width(900).height(675).url()}
                            alt={drop.title ?? ""}
                            fill
                            sizes="(min-width: 640px) 50vw, 100vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="mt-4 space-y-1">
                        <h3 className="font-display text-xl">{drop.title}</h3>
                        {drop.creatorCollaborator && (
                          <p className="text-sm text-muted">
                            x {drop.creatorCollaborator}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
