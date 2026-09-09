'use client'

import { getPublishedId, useFormValue } from 'sanity'
import { IntentLink } from 'sanity/router'

import { useLiveArticleBacklinks } from './useLiveArticleBacklinks'

// Display-only — unlike ReadinessStatusInput/PublishedStateInput, this never
// calls onChange. The relationship it shows lives entirely on the article's
// side (editorialArticle.relatedDrop), so there's nothing to write back;
// this field exists purely to surface that reverse direction in the drop's
// own editing view, without a second stored reference list to keep in sync.
export function ArticlesBacklinkInput() {
  const rawId = useFormValue(['_id']) as string
  const documentId = getPublishedId(rawId)
  const { articles, loading } = useLiveArticleBacklinks(documentId)

  if (loading) {
    return (
      <div style={{ padding: '10px 14px', color: 'var(--card-muted-fg-color, #666)' }}>
        Checking for linked articles…
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div style={{ padding: '10px 14px', color: 'var(--card-muted-fg-color, #666)', fontStyle: 'italic' }}>
        No articles link to this drop yet — set this drop as the &quot;Related capsule
        drop&quot; on an Editorial Article to connect one.
      </div>
    )
  }

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {articles.map((article) => (
        <li key={article._id}>
          <IntentLink
            intent="edit"
            params={{ id: article._id, type: 'editorialArticle' }}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <span style={{ textDecoration: 'underline' }}>{article.title}</span>
            {article.needsReview && (
              <span style={{ color: '#8a2620', fontWeight: 600 }}> — needs review</span>
            )}
          </IntentLink>
        </li>
      ))}
    </ul>
  )
}
