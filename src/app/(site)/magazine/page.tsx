import type { Metadata } from "next";

import { MagazineIndexView } from "@/components/magazine/MagazineIndexView";
import { sanityFetch } from "@/sanity/lib/live";
import { MAGAZINE_ARTICLES_QUERY, type MagazineArticleListItem } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Magazine",
};

export default async function MagazineIndexPage() {
  const { data } = await sanityFetch({
    query: MAGAZINE_ARTICLES_QUERY,
    perspective: "published",
    stega: false,
  });
  const articles = data as MagazineArticleListItem[];

  return (
    <MagazineIndexView
      articles={articles}
      linkPrefix="/magazine"
      emptyMessage="No articles published yet."
    />
  );
}
