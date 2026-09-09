'use client'

import { DashboardWidgetContainer } from '@sanity/dashboard'
import { useEffect, useState } from 'react'
import { useClient } from 'sanity'
import { IntentLink } from 'sanity/router'

import { apiVersion } from '@/sanity/env'
import { computeReadiness, type ReadinessProduct } from '@/sanity/lib/readiness'

interface DropArticle {
  _id: string
  title: string
  needsReview?: boolean
}

interface DropOverview {
  _id: string
  title: string
  creatorCollaborator?: string
  launchDate?: string
  products: ReadinessProduct[]
  articles: DropArticle[]
}

// Correlated subquery (`^._id`) pulls in every editorialArticle that links
// back to this drop, without a second round trip — this is the same
// "which editorials exist for this launch" answer a merchandiser would
// otherwise have to cross-reference by hand across two document lists.
//
// For a draft-only drop (e.g. Autumn Reverie before it's published), this
// client's default perspective keeps `_id` as the literal `drafts.<id>`
// form — but a reference always stores the base id, never that prefix. The
// `select(...)` strips it before comparing, so the match still lands.
const OVERVIEW_QUERY = `*[_type == "capsuleDrop" && defined(slug.current)] | order(launchDate asc){
  _id,
  title,
  creatorCollaborator,
  launchDate,
  "products": products[]->{_id, name, sku, price, availabilityStatus},
  "articles": *[_type == "editorialArticle" && relatedDrop._ref == select(^._id in path("drafts.**") => string::split(^._id, "drafts.")[1], ^._id)]{_id, title, needsReview}
}`

// These cards deliberately opt out of Studio's ambient theme — they're
// always a light, paper-like surface with dark text, in both light and
// dark Studio. That's a choice, not an oversight: every color below is
// explicit for that reason. Reaching for a Studio CSS var (--card-fg-color
// and friends) here would be wrong, not just inconsistent — those resolve
// to a *light* color in dark Studio, meant to sit on a *dark* card, and
// would go near-invisible against this widget's light background.
const READY = { border: '#bfe3cd', bg: '#f3faf6', badgeFg: '#1f6f43', badgeBg: '#e2f3e8' }
const NOT_READY = { border: '#f0c9c3', bg: '#fdf3f2', badgeFg: '#8a2620', badgeBg: '#fbe2df' }
const INK = '#1c1a17'
const MUTED = '#6b6459'

const linkStyle: React.CSSProperties = {
  color: INK,
  textDecoration: 'none',
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 5,
}

function formatLaunchDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function LaunchReadinessWidget() {
  const client = useClient({ apiVersion })
  const [drops, setDrops] = useState<DropOverview[] | null>(null)

  useEffect(() => {
    let active = true
    const refetch = () => {
      client.fetch<DropOverview[]>(OVERVIEW_QUERY).then((result) => {
        if (active) setDrops(result)
      })
    }
    refetch()

    // Broad listens (no $params) so any capsuleDrop, product, or
    // editorialArticle mutation refreshes the whole board — same
    // client.listen() mechanism as the readiness panel, just aggregated
    // across every drop instead of one.
    const subscriptions = [
      client.listen(`*[_type == "capsuleDrop"]`, {}, { visibility: 'query' }).subscribe(refetch),
      client.listen(`*[_type == "product"]`, {}, { visibility: 'query' }).subscribe(refetch),
      client.listen(`*[_type == "editorialArticle"]`, {}, { visibility: 'query' }).subscribe(refetch),
    ]

    return () => {
      active = false
      subscriptions.forEach((sub) => sub.unsubscribe())
    }
  }, [client])

  if (!drops) {
    return (
      <DashboardWidgetContainer header="Launch readiness">
        <div style={{ padding: 16, color: 'var(--card-muted-fg-color, #666)' }}>Loading…</div>
      </DashboardWidgetContainer>
    )
  }

  const rows = drops.map((drop) => ({ drop, readiness: computeReadiness(drop.products) }))
  const readyCount = rows.filter((row) => row.readiness.ready).length
  const reviewCount = drops.reduce(
    (sum, drop) => sum + drop.articles.filter((article) => article.needsReview).length,
    0,
  )

  return (
    <DashboardWidgetContainer header="Launch readiness">
      <div style={{ padding: '4px 16px 16px' }}>
        <div
          style={{
            marginBottom: 14,
            fontSize: 13,
            color: 'var(--card-muted-fg-color, #666)',
          }}
        >
          <strong style={{ color: 'var(--card-fg-color, #1a1a1a)' }}>
            {readyCount} of {drops.length}
          </strong>{' '}
          drops ready to publish
          {reviewCount > 0 && (
            <>
              {' · '}
              <strong style={{ color: 'var(--card-fg-color, #1a1a1a)' }}>{reviewCount}</strong> article
              {reviewCount === 1 ? '' : 's'} flagged for review
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(({ drop, readiness }) => {
            const tone = readiness.ready ? READY : NOT_READY
            return (
              <div
                key={drop._id}
                style={{
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  borderRadius: 10,
                  padding: '14px 16px',
                  boxShadow: '0 1px 2px rgba(28, 26, 23, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <IntentLink intent="edit" params={{ id: drop._id, type: 'capsuleDrop' }} style={linkStyle}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{drop.title}</span>
                  </IntentLink>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 999,
                      color: tone.badgeFg,
                      background: tone.badgeBg,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {readiness.ready ? 'READY' : `${readiness.issues.length} ISSUE${readiness.issues.length === 1 ? '' : 'S'}`}
                  </span>
                </div>

                <div style={{ marginTop: 3, fontSize: 12.5, color: MUTED }}>
                  {drop.creatorCollaborator && <>x {drop.creatorCollaborator} · </>}
                  {formatLaunchDate(drop.launchDate)}
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={sectionLabelStyle}>
                    🏷️ Products · {drop.products.length}
                  </div>
                  {readiness.ready ? (
                    <div style={{ fontSize: 13, color: READY.badgeFg }}>
                      All {drop.products.length} confirmed ready — priced and in stock.
                    </div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: NOT_READY.badgeFg, lineHeight: 1.6 }}>
                      {readiness.issues.map((issue, i) => (
                        <li key={`${issue.productId}-${issue.field}-${i}`}>{issue.message}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: `1px solid ${tone.border}`,
                  }}
                >
                  <div style={sectionLabelStyle}>
                    📄 Editorial · {drop.articles.length}
                  </div>
                  {drop.articles.length === 0 ? (
                    <span style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>No editorial coverage yet</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                      {drop.articles.map((article) => (
                        <IntentLink
                          key={article._id}
                          intent="edit"
                          params={{ id: article._id, type: 'editorialArticle' }}
                          style={linkStyle}
                        >
                          {article.title}
                          {article.needsReview && (
                            <span style={{ color: NOT_READY.badgeFg, fontWeight: 600 }}> — needs review</span>
                          )}
                        </IntentLink>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardWidgetContainer>
  )
}
