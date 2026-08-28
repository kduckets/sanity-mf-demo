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
  const client = useClient({ apiVersion })
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
