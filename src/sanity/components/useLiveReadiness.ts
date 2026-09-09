'use client'

import { useEffect, useState } from 'react'
import { useClient } from 'sanity'

import { apiVersion } from '@/sanity/env'
import { computeReadiness, type ReadinessProduct, type ReadinessResult } from '@/sanity/lib/readiness'

interface ProductRef {
  _ref?: string
}

const READINESS_QUERY = `*[_id in $ids]{_id, name, sku, price, availabilityStatus}`

export function useLiveReadiness(productRefs: ProductRef[] | undefined) {
  // `perspective: 'drafts'` is load-bearing here, not cosmetic: a product
  // edit in Studio always lands on its draft first. Without this, a plain
  // client only ever sees the published copy, so typing a price and
  // watching this panel update live would silently show the pre-edit,
  // still-"missing a price" state until the product was published.
  // useClient()'s own options don't accept `perspective` — withConfig does.
  const client = useClient({ apiVersion }).withConfig({ perspective: 'drafts' })
  const [result, setResult] = useState<ReadinessResult>({ ready: true, issues: [] })
  const [loading, setLoading] = useState(true)

  const ids = (productRefs ?? [])
    .map((ref) => ref?._ref)
    .filter((id): id is string => Boolean(id))
  const idsKey = ids.slice().sort().join(',')
  const hasIds = ids.length > 0

  useEffect(() => {
    if (!hasIds) return

    let active = true
    const params = { ids }

    const refetch = () => {
      client.fetch<ReadinessProduct[]>(READINESS_QUERY, params).then((products) => {
        if (!active) return
        setResult(computeReadiness(products))
        setLoading(false)
      })
    }

    refetch()

    const subscription = client
      .listen(READINESS_QUERY, params, { visibility: 'query' })
      .subscribe(refetch)

    return () => {
      active = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, hasIds])

  if (!hasIds) {
    return { ready: true, issues: [], loading: false }
  }

  return { ...result, loading }
}
