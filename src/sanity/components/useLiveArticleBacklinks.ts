'use client'

import { useEffect, useState } from 'react'
import { useClient } from 'sanity'

import { apiVersion } from '@/sanity/env'

export interface ArticleBacklink {
  _id: string
  title: string
  slug?: string
  needsReview?: boolean
}

const BACKLINKS_QUERY = `*[_type == "editorialArticle" && relatedDrop._ref == $id]{
  _id, title, "slug": slug.current, needsReview
}`

// Mirrors useLiveReadiness's fetch-then-listen shape, but for the reverse
// side of the editorialArticle -> capsuleDrop reference: rather than storing
// a second, hand-maintained "articles" list on the drop (which could drift
// from what articles actually link here), this reads the live answer
// straight from the one place the relationship is stored.
export function useLiveArticleBacklinks(dropId: string | undefined) {
  const client = useClient({ apiVersion })
  const [articles, setArticles] = useState<ArticleBacklink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!dropId) return

    let active = true
    const params = { id: dropId }

    const refetch = () => {
      client.fetch<ArticleBacklink[]>(BACKLINKS_QUERY, params).then((result) => {
        if (!active) return
        setArticles(result)
        setLoading(false)
      })
    }

    refetch()

    const subscription = client
      .listen(BACKLINKS_QUERY, params, { visibility: 'query' })
      .subscribe(refetch)

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client, dropId])

  if (!dropId) {
    return { articles: [], loading: false }
  }

  return { articles, loading }
}
