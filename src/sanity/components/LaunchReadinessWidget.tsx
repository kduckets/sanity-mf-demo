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

// This client's default perspective returns literal documents, not one
// deduplicated logical drop — so a drop with both a published copy and a
// draft (which happens the moment anyone so much as opens it in Studio,
// since the readinessStatus/publishedState fields autosave to the draft on
// view) would otherwise show up here twice. The first filter clause keeps
// only one row per drop, preferring the draft when both exist.
//
// That surviving row's `_id` can still be the literal `drafts.<id>` form
// (for a draft-only drop, or a published one with a newer draft) — but a
// reference always stores the base id, never that prefix. The `select(...)`
// in the correlated articles subquery strips it before comparing, so that
// match still lands.
//
// Correlated subquery (`^._id`) pulls in every editorialArticle that links
// back to this drop, without a second round trip — this is the same
// "which editorials exist for this launch" answer a merchandiser would
// otherwise have to cross-reference by hand across two document lists.
const OVERVIEW_QUERY = `*[
  _type == "capsuleDrop" &&
  defined(slug.current) &&
  (_id in path("drafts.**") || !defined(*[_id == "drafts." + ^._id][0]))
] | order(launchDate asc){
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
const READY = {
  border: '#bfe3cd',
  bg: 'linear-gradient(160deg, #f6fbf8 0%, #e9f6ef 100%)',
  badgeFg: '#1f6f43',
  badgeBg: '#e2f3e8',
  accent: '#3aa76d',
}
const NOT_READY = {
  border: '#f0c9c3',
  bg: 'linear-gradient(160deg, #fef6f5 0%, #fbe6e3 100%)',
  badgeFg: '#8a2620',
  badgeBg: '#fbe2df',
  accent: '#d1453b',
}
const INK = '#1c1a17'
const MUTED = '#6b6459'

// Inline styles can't express :hover or transitions, and this widget
// intentionally skips Studio's theme system (see above) — so the one bit
// of real CSS it needs (a smooth lift on hover, and a smooth color morph
// when a card flips from not-ready to ready live) gets a scoped <style>
// tag instead of a CSS module, to keep this a single drop-in component.
const CARD_TRANSITIONS = `
  .mf-lrw-card {
    transition: background 500ms ease, border-color 500ms ease, box-shadow 200ms ease, transform 200ms ease;
  }
  .mf-lrw-card:hover {
    box-shadow: 0 8px 20px rgba(28, 26, 23, 0.1);
    transform: translateY(-1px);
  }
`

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

  const readyPct = drops.length === 0 ? 0 : (readyCount / drops.length) * 360

  return (
    <DashboardWidgetContainer header="Launch readiness">
      <style>{CARD_TRANSITIONS}</style>
      <div style={{ padding: '4px 16px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 18,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #faf8f4 0%, #f2ede3 100%)',
            border: '1px solid #e7ded0',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `conic-gradient(${READY.accent} ${readyPct}deg, #f0d9d5 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 0 1px rgba(28, 26, 23, 0.06)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#fffdfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: INK,
              }}
            >
              {readyCount}/{drops.length}
            </div>
          </div>

          <div style={{ fontSize: 13, color: MUTED }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>
              {readyCount} of {drops.length} drops ready to publish
            </div>
            {reviewCount > 0 && (
              <div style={{ marginTop: 2 }}>
                <strong style={{ color: NOT_READY.badgeFg }}>{reviewCount}</strong> article
                {reviewCount === 1 ? '' : 's'} flagged for review
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(({ drop, readiness }) => {
            const tone = readiness.ready ? READY : NOT_READY
            return (
              <div
                key={drop._id}
                className="mf-lrw-card"
                style={{
                  position: 'relative',
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  borderRadius: 12,
                  padding: '14px 16px 14px 20px',
                  boxShadow: '0 1px 2px rgba(28, 26, 23, 0.04)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 4,
                    background: tone.accent,
                    transition: 'background 500ms ease',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <IntentLink intent="edit" params={{ id: drop._id, type: 'capsuleDrop' }} style={linkStyle}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{drop.title}</span>
                  </IntentLink>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 999,
                      color: tone.badgeFg,
                      background: tone.badgeBg,
                      boxShadow: `inset 0 0 0 1px ${tone.border}`,
                      whiteSpace: 'nowrap',
                      transition: 'background 500ms ease, color 500ms ease',
                    }}
                  >
                    {readiness.ready ? '✓ READY' : `⚠ ${readiness.issues.length} ISSUE${readiness.issues.length === 1 ? '' : 'S'}`}
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
                        <li key={`${issue.productId}-${issue.field}-${i}`}>
                          <IntentLink
                            intent="edit"
                            params={{ id: issue.productId, type: 'product' }}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            <span style={{ textDecoration: 'underline' }}>&quot;{issue.productName}&quot;</span>
                          </IntentLink>{' '}
                          {issue.detail}
                        </li>
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
