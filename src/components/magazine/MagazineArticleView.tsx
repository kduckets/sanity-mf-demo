import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";

import { urlForImage } from "@/sanity/lib/image";
import type { MagazineArticleDetail } from "@/sanity/lib/queries";

const articleComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="font-display mt-8 text-2xl">{children}</h2>,
    h3: ({ children }) => <h3 className="font-display mt-6 text-xl">{children}</h3>,
    normal: ({ children }) => (
      <p className="mt-4 leading-relaxed text-foreground/85">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-2 border-accent/40 pl-4 italic text-muted">
        {children}
      </blockquote>
    ),
  },
};

export function MagazineArticleView({
  article,
  backHref,
  dropHref,
}: {
  article: MagazineArticleDetail;
  backHref: string;
  /** Link to the related capsule drop, already resolved to the right (preview or public) route. */
  dropHref?: string | null;
}) {
  const coverImage = urlForImage(article.coverImage ?? undefined);

  return (
    <main className="flex-1">
      <div className="relative h-[52vh] min-h-[320px] w-full bg-neutral-900">
        {coverImage && (
          <Image
            src={coverImage.width(1920).height(1080).url()}
            alt={article.coverImage?.alt || article.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-6 pb-12 text-white">
          <Link
            href={backHref}
            className="mb-6 w-fit text-xs tracking-[0.15em] text-white/70 uppercase hover:text-white"
          >
            ← Magazine
          </Link>
          {article.kind && (
            <p className="text-xs tracking-[0.25em] text-white/70 uppercase">
              {article.kind}
            </p>
          )}
          <h1 className="font-display mt-3 max-w-3xl text-4xl leading-[1.05] sm:text-5xl">
            {article.title}
          </h1>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-16">
        {article.promoCopy && (
          <p className="mb-6 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase">
            {article.promoCopy}
          </p>
        )}
        {article.dek && (
          <p className="text-lg leading-relaxed text-muted">{article.dek}</p>
        )}
        {article.body && <PortableText value={article.body} components={articleComponents} />}

        {dropHref && article.relatedDrop && (
          <div className="mt-12 border-t border-border/80 pt-6">
            <p className="text-xs tracking-[0.15em] text-muted uppercase">
              Shop the drop
            </p>
            <Link
              href={dropHref}
              className="font-display mt-1 inline-block text-xl hover:text-accent"
            >
              {article.relatedDrop.title} →
            </Link>
          </div>
        )}
      </article>
    </main>
  );
}
