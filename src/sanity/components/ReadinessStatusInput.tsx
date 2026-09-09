'use client'

import { useEffect } from 'react'
import { set, type StringInputProps, useFormValue } from 'sanity'
import { IntentLink } from 'sanity/router'

import { useLiveReadiness } from './useLiveReadiness'

interface ProductRef {
  _ref?: string
}

export function ReadinessStatusInput(props: StringInputProps) {
  const { onChange, value } = props
  const productRefs = useFormValue(['products']) as ProductRef[] | undefined
  const { ready, issues, loading } = useLiveReadiness(productRefs)

  useEffect(() => {
    if (loading) return
    const next = ready ? 'ready' : 'not_ready'
    if (value !== next) {
      // This field is display-only (readinessStatus doesn't gate anything —
      // the actual publish block is the document-level validation rule), so
      // if the document happens to be read-only in the current context (e.g.
      // Presentation Tool showing a read-only perspective), it's safe to just
      // skip the write rather than let an uncaught patch error take down the
      // whole pane.
      try {
        onChange(set(next))
      } catch {
        // ignore — see comment above
      }
    }
  }, [ready, loading, value, onChange])

  if (loading) {
    return (
      <div style={{ padding: '10px 14px', color: 'var(--card-muted-fg-color, #666)' }}>
        Checking product readiness…
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 6,
        border: `1px solid ${ready ? '#3aa76d' : '#c53b3b'}`,
        background: ready ? '#e9f7ef' : '#fdecea',
        color: ready ? '#1f6f43' : '#8a2620',
      }}
    >
      <strong>{ready ? '✓ Ready to publish' : '✕ Not ready to publish'}</strong>
      {!ready && (
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {issues.map((issue, i) => (
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
  )
}
