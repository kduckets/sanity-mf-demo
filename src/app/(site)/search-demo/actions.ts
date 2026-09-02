'use server'

import { extractSearchFilters, runFilteredSearch, type SearchFilters } from '@/sanity/lib/agentSearch'
import { sanityFetch } from '@/sanity/lib/live'
import { SEARCH_DEMO_PRODUCTS_QUERY, type SearchDemoProduct } from '@/sanity/lib/queries'

export interface SearchResult {
  query: string
  products: SearchDemoProduct[]
  filters: SearchFilters
  // True when the real Content Agent call failed (network, plan not
  // AI-enabled, timeout, malformed output) and this fell back to the
  // built-in example query instead — never silently pretend the AI ran.
  usedFallback: boolean
  // True when extraction succeeded but recognized no catalog constraints in
  // the request — a legitimate outcome, not a failure, so it's kept distinct
  // from usedFallback.
  noFiltersRecognized: boolean
}

async function fallbackResult(query: string): Promise<SearchResult> {
  const { data } = await sanityFetch({
    query: SEARCH_DEMO_PRODUCTS_QUERY,
    perspective: 'published',
    stega: false,
  })
  return {
    query,
    products: data as SearchDemoProduct[],
    filters: { category: 'sweater', color: 'blue', materials: ['wool'], maxPrice: 100, size: 'M' },
    usedFallback: true,
    noFiltersRecognized: false,
  }
}

export async function searchWithAgent(query: string): Promise<SearchResult> {
  const trimmed = query.trim()
  if (!trimmed) return fallbackResult(query)

  try {
    const filters = await extractSearchFilters(trimmed)

    if (Object.keys(filters).length === 0) {
      return { query, products: [], filters, usedFallback: false, noFiltersRecognized: true }
    }

    const products = await runFilteredSearch(filters)
    return { query, products, filters, usedFallback: false, noFiltersRecognized: false }
  } catch (err) {
    console.error('Content Agent search extraction failed, falling back:', err)
    return fallbackResult(query)
  }
}
