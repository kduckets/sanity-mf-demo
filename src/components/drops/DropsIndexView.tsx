import Image from "next/image";
import Link from "next/link";

import { urlForImage } from "@/sanity/lib/image";
import type { CapsuleDropListItem } from "@/sanity/lib/queries";

export function DropsIndexView({
  drops,
  linkPrefix,
  emptyMessage,
}: {
  drops: CapsuleDropListItem[];
  linkPrefix: string;
  emptyMessage: string;
}) {
  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
      <header className="max-w-2xl space-y-3">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">
          Marlowe &amp; Finch
        </p>
        <h1 className="font-display text-4xl">Drops</h1>
        <p className="text-muted">
          Capsule collaborations from across our labels — editorial and
          product, launched together.
        </p>
      </header>

      {drops.length === 0 ? (
        <p className="text-muted">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2">
          {drops.map((drop) => {
            const image = urlForImage(drop.heroImage ?? undefined);
            const launchDate = drop.launchDate
              ? new Date(drop.launchDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : null;
            return (
              <li key={drop._id}>
                <Link href={`${linkPrefix}/${drop.slug}`} className="group block">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-neutral-100">
                    {image && (
                      <Image
                        src={image.width(1000).height(750).url()}
                        alt={drop.title ?? ""}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="mt-4 space-y-1">
                    {launchDate && (
                      <p className="text-xs tracking-wide text-muted uppercase">
                        {launchDate}
                      </p>
                    )}
                    <h2 className="font-display text-2xl">{drop.title}</h2>
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
      )}
    </main>
  );
}
