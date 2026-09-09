import { ArticleCard } from "@/components/magazine/ArticleCard";
import type { MagazineArticleListItem } from "@/sanity/lib/queries";

export function MagazineIndexView({
  articles,
  linkPrefix,
  emptyMessage,
}: {
  articles: MagazineArticleListItem[];
  linkPrefix: string;
  emptyMessage: string;
}) {
  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
      <header className="max-w-2xl space-y-3">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">
          Marlowe &amp; Finch
        </p>
        <h1 className="font-display text-4xl">Magazine</h1>
        <p className="text-muted">
          Lookbooks, studio visits, and the stories behind our capsule drops.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="text-muted">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-3">
          {articles.map((article) => (
            <li key={article._id}>
              <ArticleCard
                article={article}
                href={`${linkPrefix}/${article.slug}`}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
