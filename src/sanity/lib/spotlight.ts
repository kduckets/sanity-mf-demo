import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '@/sanity/env'
import { SPOTLIGHT_PRODUCT_POOL_QUERY, type SpotlightProduct } from '@/sanity/lib/queries'

// Deliberately NOT going through sanityFetch/defineLive here: the spotlight
// pick is random on every render regardless, so it doesn't need Sanity
// Live's tag-based tracking, and keeping it off that page's live-tracking
// surface reduces load exactly where Presentation Tool's comlink connection
// has been observed to struggle (its own docs note instability "on heavier
// pages which load many documents").
const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
})

export async function pickSpotlightProduct(options: {
  perspective: 'published' | 'drafts'
}): Promise<SpotlightProduct | null> {
  const pool = await client.fetch<SpotlightProduct[]>(SPOTLIGHT_PRODUCT_POOL_QUERY, {}, {
    perspective: options.perspective,
  })
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}
