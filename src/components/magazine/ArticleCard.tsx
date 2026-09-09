import Image from "next/image";
import Link from "next/link";

import { urlForImage } from "@/sanity/lib/image";
import type { MagazineArticleListItem } from "@/sanity/lib/queries";

export function ArticleCard({
  article,
  href,
}: {
  article: MagazineArticleListItem;
  href: string;
}) {
  const image = urlForImage(article.coverImage ?? undefined);

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-neutral-100">
        {image && (
          <Image
            src={image.width(1000).height(750).url()}
            alt={article.coverImage?.alt || article.title}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="mt-4 space-y-1">
        {article.kind && (
          <p className="text-xs tracking-wide text-muted uppercase">
            {article.kind}
          </p>
        )}
        <h2 className="font-display text-xl">{article.title}</h2>
        {article.dek && <p className="text-sm text-muted">{article.dek}</p>}
      </div>
    </Link>
  );
}
