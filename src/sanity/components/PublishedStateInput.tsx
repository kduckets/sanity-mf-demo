'use client'

import { useEffect } from 'react'
import { getPublishedId, set, type StringInputProps, useEditState, useFormValue } from 'sanity'

import { useLiveReadiness } from './useLiveReadiness'

interface ProductRef {
  _ref?: string
}

const LABELS: Record<string, string> = {
  draft: 'Draft — blocked from publishing',
  ready: 'Ready to publish',
  published: 'Published',
}

export function PublishedStateInput(props: StringInputProps) {
  const { onChange, value } = props
  const rawId = useFormValue(['_id']) as string
  // useFormValue's `_id` is already published-form in the Structure tool, but
  // Presentation Tool has been observed to pass the raw drafts.-prefixed id
  // through instead — useEditState throws if given that, so normalize here
  // rather than assume the caller already did.
  const documentId = getPublishedId(rawId)
  const documentType = useFormValue(['_type']) as string
  const productRefs = useFormValue(['products']) as ProductRef[] | undefined
  const { ready, loading } = useLiveReadiness(productRefs)
  const editState = useEditState(documentId, documentType)

  const next = loading ? undefined : !ready ? 'draft' : editState.draft ? 'ready' : 'published'

  useEffect(() => {
    if (!next) return
    if (value !== next) {
      // Display-only field — see the matching comment in ReadinessStatusInput.
      try {
        onChange(set(next))
      } catch {
        // ignore — the document may be read-only in the current context
        // (e.g. Presentation Tool showing a read-only perspective)
      }
    }
  }, [next, value, onChange])

  return (
    <div style={{ padding: '8px 2px', fontWeight: 600 }}>
      {loading ? 'Computing…' : LABELS[next ?? 'draft']}
    </div>
  )
}
