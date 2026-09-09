import { notFound } from "next/navigation";

import { MagazineArticleView } from "@/components/magazine/MagazineArticleView";
import { sanityFetch } from "@/sanity/lib/live";
import { MAGAZINE_ARTICLE_QUERY, type MagazineArticleDetail } from "@/sanity/lib/queries";

export default async function MagazineArticlePage(
  props: PageProps<"/magazine/[slug]">,
) {
  const { slug } = await props.params;
  const { data } = await sanityFetch({
    query: MAGAZINE_ARTICLE_QUERY,
    params: { slug },
    perspective: "published",
    stega: false,
  });
  const article = data as MagazineArticleDetail | null;

  if (!article) {
    notFound();
  }

  return (
    <MagazineArticleView
      article={article}
      backHref="/magazine"
      dropHref={article.relatedDrop ? `/drops/${article.relatedDrop.slug}` : null}
    />
  );
}
