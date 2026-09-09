import { useCallback, useMemo, useState } from 'react'
import { useClient } from 'sanity'

import { apiVersion } from '@/sanity/env'

type Client = ReturnType<typeof useClient>

interface AuditItem {
  id: string
  docId: string
  title: string
  explanation: string
  fixDescription: string
  applyFix: (client: Client) => Promise<unknown>
}

interface Check {
  id: string
  prompt: string
  run: (client: Client) => Promise<AuditItem[]>
}

const CHECKS: Check[] = [
  {
    id: 'missing-alt',
    prompt: 'Find articles missing alt text',
    run: async (client) => {
      const docs = await client.fetch<{ _id: string; title: string }[]>(
        `*[_type == "editorialArticle" && defined(coverImage.asset) && !defined(coverImage.alt)]{_id, title}`,
      )
      return docs.map((doc) => {
        const placeholder = `${doc.title} — cover photo`
        return {
          id: `${doc._id}:alt`,
          docId: doc._id,
          title: doc.title,
          explanation: 'Cover image has no alt text.',
          fixDescription: `Set alt text to "${placeholder}"`,
          applyFix: (client: Client) =>
            client.patch(doc._id).set({ 'coverImage.alt': placeholder }).commit(),
        }
      })
    },
  },
  {
    id: 'broken-product-link',
    prompt: "Find product links that don't match a live SKU",
    run: async (client) => {
      const docs = await client.fetch<
        { _id: string; title: string; refId: string; resolvedId: string | null }[]
      >(
        `*[_type == "editorialArticle" && defined(relatedProduct._ref)]{
          _id, title, "refId": relatedProduct._ref, "resolvedId": relatedProduct->_id
        }`,
      )
      return docs
        .filter((doc) => !doc.resolvedId)
        .map((doc) => ({
          id: `${doc._id}:product-link`,
          docId: doc._id,
          title: doc.title,
          explanation: `References product "${doc.refId}", which no longer resolves to a live SKU.`,
          fixDescription: 'Flag for editor review',
          applyFix: (client: Client) => client.patch(doc._id).set({ needsReview: true }).commit(),
        }))
    },
  },
  {
    id: 'stale-promo-copy',
    prompt: 'Find capsule drops with stale promo copy',
    run: async (client) => {
      const docs = await client.fetch<{ _id: string; title: string; promoCopy: string }[]>(
        `*[_type == "editorialArticle" && defined(promoCopy) && lower(promoCopy) match "*coming soon*"]{_id, title, promoCopy}`,
      )
      return docs.map((doc) => ({
        id: `${doc._id}:promo-copy`,
        docId: doc._id,
        title: doc.title,
        explanation: `Promo copy still reads "${doc.promoCopy}".`,
        fixDescription: 'Rewrite to "Now live — shop the drop."',
        applyFix: (client: Client) =>
          client.patch(doc._id).set({ promoCopy: 'Now live — shop the drop.' }).commit(),
      }))
    },
  },
  {
    id: 'bulk-add-promo-copy',
    prompt: 'Bulk-add promo copy to articles missing one',
    run: async (client) => {
      const docs = await client.fetch<{ _id: string; title: string }[]>(
        `*[_type == "editorialArticle" && !defined(promoCopy)]{_id, title}`,
      )
      return docs.map((doc) => ({
        id: `${doc._id}:add-promo-copy`,
        docId: doc._id,
        title: doc.title,
        explanation: 'No promo copy set — nothing to show wherever this article gets a badge or teaser.',
        fixDescription: 'Set promo copy to "Read the story."',
        applyFix: (client: Client) =>
          client.patch(doc._id).set({ promoCopy: 'Read the story.' }).commit(),
      }))
    },
  },
  {
    id: 'high-traffic-missing-product',
    prompt: 'Find high-traffic articles missing a related product',
    run: async (client) => {
      const docs = await client.fetch<{ _id: string; title: string; weeklyViews: number }[]>(
        `*[_type == "editorialArticle" && defined(weeklyViews) && weeklyViews > 2000 && !defined(relatedProduct)]{_id, title, weeklyViews}`,
      )
      return docs.map((doc) => ({
        id: `${doc._id}:high-traffic-no-product`,
        docId: doc._id,
        title: doc.title,
        explanation: `${doc.weeklyViews.toLocaleString()} views this week, but no product link for readers to shop.`,
        fixDescription: 'Flag for editor review',
        applyFix: (client: Client) => client.patch(doc._id).set({ needsReview: true }).commit(),
      }))
    },
  },
]

const cardStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 6,
  border: '1px solid var(--card-border-color, #e4ddd2)',
  background: 'var(--card-bg-color, #fff)',
}

export function EditorialAuditPane() {
  const client = useClient({ apiVersion })
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [ranPrompt, setRanPrompt] = useState<string | null>(null)
  const [items, setItems] = useState<AuditItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const promptToCheck = useMemo(() => {
    const map = new Map<string, Check>()
    for (const check of CHECKS) map.set(check.prompt.trim().toLowerCase(), check)
    return map
  }, [])

  const runCheck = useCallback(
    async (check: Check) => {
      setLoading(true)
      setNotice(null)
      setStatus(null)
      setRanPrompt(check.prompt)
      setInputValue(check.prompt)
      try {
        const found = await check.run(client)
        setItems(found)
        setSelected(new Set(found.map((item) => item.id)))
      } finally {
        setLoading(false)
      }
    },
    [client],
  )

  const handleSubmit = useCallback(() => {
    const match = promptToCheck.get(inputValue.trim().toLowerCase())
    if (!match) {
      setNotice(
        "Free-text parsing isn't wired to a live model in this demo — try one of the example prompts below.",
      )
      setStatus(null)
      setItems([])
      setRanPrompt(null)
      return
    }
    void runCheck(match)
  }, [inputValue, promptToCheck, runCheck])

  const toggleItem = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const applySelected = useCallback(async () => {
    const toApply = items.filter((item) => selected.has(item.id))
    if (toApply.length === 0) return
    setApplying(true)
    setStatus(null)
    try {
      await Promise.all(toApply.map((item) => item.applyFix(client)))
      setStatus(`Applied ${toApply.length} fix${toApply.length === 1 ? '' : 'es'}.`)
      const check = CHECKS.find((c) => c.prompt === ranPrompt)
      if (check) {
        const refreshed = await check.run(client)
        setItems(refreshed)
        setSelected(new Set(refreshed.map((item) => item.id)))
      }
    } catch (err) {
      setStatus(`Could not apply fixes: ${err instanceof Error ? err.message : 'unknown error'}`)
    } finally {
      setApplying(false)
    }
  }, [client, items, ranPrompt, selected])

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>The Tailor</h2>
      <p style={{ marginTop: 8, color: 'var(--card-muted-fg-color, #666)' }}>
        Marlowe &amp; Finch&apos;s editorial ops agent — bulk edits, content audits, and gap analysis,
        in one conversation.
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <input
          type="text"
          value={inputValue}
          placeholder="What would you like to check?"
          onChange={(event) => setInputValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSubmit()
          }}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid var(--card-border-color, #e4ddd2)',
            font: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '0 18px',
            borderRadius: 6,
            border: 'none',
            background: '#9a4a2a',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          Run
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {CHECKS.map((check) => (
          <button
            key={check.id}
            type="button"
            onClick={() => runCheck(check)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid var(--card-border-color, #e4ddd2)',
              background: 'transparent',
              fontSize: 13,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {check.prompt}
          </button>
        ))}
      </div>

      {notice && (
        <div style={{ ...cardStyle, marginTop: 16, background: '#fff8e6', borderColor: '#e8c869' }}>
          {notice}
        </div>
      )}

      {status && (
        <div style={{ ...cardStyle, marginTop: 16, background: '#e9f7ef', borderColor: '#3aa76d', color: '#1f6f43' }}>
          {status}
        </div>
      )}

      {loading && (
        <p style={{ marginTop: 16, color: 'var(--card-muted-fg-color, #666)' }}>Checking…</p>
      )}

      {!loading && ranPrompt && (
        <div style={{ marginTop: 20 }}>
          <p style={{ color: 'var(--card-muted-fg-color, #666)', fontSize: 13 }}>
            {items.length === 0
              ? 'No issues found — everything checked out.'
              : `Found ${items.length} issue${items.length === 1 ? '' : 's'}, staged for review:`}
          </p>

          {items.length > 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {items.map((item) => (
                  <label
                    key={item.id}
                    style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      style={{ marginTop: 4 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--card-muted-fg-color, #666)', marginTop: 2 }}>
                        {item.explanation}
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          marginTop: 6,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#9a4a2a',
                          border: '1px solid #9a4a2a',
                        }}
                      >
                        Proposed fix: {item.fixDescription}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={applySelected}
                disabled={applying || selected.size === 0}
                style={{
                  marginTop: 16,
                  padding: '10px 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#3aa76d',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: applying || selected.size === 0 ? 'default' : 'pointer',
                  opacity: applying || selected.size === 0 ? 0.6 : 1,
                }}
              >
                {applying ? 'Applying…' : `Apply selected (${selected.size})`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
