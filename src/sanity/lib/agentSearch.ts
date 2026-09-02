import { createClient } from '@sanity/client'
import type { Image } from 'sanity'

import { dataset, projectId } from '@/sanity/env'
import type { SearchDemoProduct } from '@/sanity/lib/queries'

// Agent Actions (client.agent.action.*) are a distinct, experimental API
// surface from the rest of this app's dataset queries — as of writing it
// only works on apiVersion "vX" (confirmed by testing: the regular dataset
// apiVersion returns "Agent Actions are only available on apiVersion vX").
// This client is kept separate from src/sanity/lib/live.ts for that reason.
const agentClient = createClient({
  projectId,
  dataset,
  apiVersion: 'vX',
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
})

export interface SearchFilters {
  category?: string
  color?: string
  materials?: string[]
  maxPrice?: number
  size?: string
}

const EXTRACTION_TIMEOUT_MS = 8000

const VALID_CATEGORIES = [
  'sweater',
  'coat',
  'jacket',
  'dress',
  'trouser',
  'tee',
  'hoodie',
  'scarf',
  'boots',
  'mules',
  'vest',
  'hat',
  'tote',
  'mug',
]

const EXTRACTION_INSTRUCTION = `You are extracting structured search filters from a shopper's request for a clothing and accessories catalog.

Return ONLY JSON matching this exact shape, omitting any key the request doesn't specify:
{"category": string, "color": string, "materials": string[], "maxPrice": number, "size": string}

Valid categories: ${VALID_CATEGORIES.join(', ')}.
"materials" should be lowercase fabric/material names (e.g. "wool", "cotton", "cashmere").
"maxPrice" is a plain number with no currency symbol, parsed from any price ceiling
mentioned in the request.
"size" should be the exact size token as written (e.g. "M", "8", "One Size").

Never invent a constraint the request doesn't mention — if the request is unrelated to
shopping for a specific item, return {}.

Shopper's request: $query`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// The model's output is untrusted input, same as any other user-adjacent
// data — validate shape before it ever reaches a GROQ query.
function sanitizeFilters(raw: unknown): SearchFilters {
  if (!isRecord(raw)) return {}
  const filters: SearchFilters = {}

  if (typeof raw.category === 'string' && VALID_CATEGORIES.includes(raw.category)) {
    filters.category = raw.category
  }
  if (typeof raw.color === 'string' && raw.color.trim()) {
    filters.color = raw.color.trim().toLowerCase()
  }
  if (Array.isArray(raw.materials)) {
    const materials = raw.materials.filter((m): m is string => typeof m === 'string' && m.trim() !== '')
    if (materials.length > 0) filters.materials = materials.map((m) => m.trim().toLowerCase())
  }
  if (typeof raw.maxPrice === 'number' && Number.isFinite(raw.maxPrice) && raw.maxPrice > 0) {
    filters.maxPrice = raw.maxPrice
  }
  if (typeof raw.size === 'string' && raw.size.trim()) {
    filters.size = raw.size.trim().toUpperCase()
  }

  return filters
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Agent Actions call exceeded ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

// Real Content Agent call — turns free text into structured filters using
// the catalog's actual schema fields, not a vector/similarity guess. Throws
// on any failure (network, plan not AI-enabled, malformed output); the
// caller is expected to fall back to a deterministic query rather than let
// a live demo hang on an external model call.
export async function extractSearchFilters(query: string): Promise<SearchFilters> {
  const result = await withTimeout(
    agentClient.agent.action.prompt<Record<string, unknown>>({
      instruction: EXTRACTION_INSTRUCTION,
      instructionParams: { query },
      format: 'json',
      temperature: 0,
    }),
    EXTRACTION_TIMEOUT_MS,
  )
  return sanitizeFilters(result)
}

const FILTERED_PRODUCTS_QUERY = `
  *[
    _type == "product" &&
    (!defined($category) || category == $category) &&
    (!defined($color) || color == $color) &&
    (!defined($material) || $material in materials) &&
    (!defined($maxPrice) || (defined(price) && price < $maxPrice)) &&
    (!defined($size) || $size in availableSizes)
  ]{
    _id,
    name,
    sku,
    price,
    color,
    materials,
    availableSizes,
    image
  }
`

interface RawFilteredProduct {
  _id: string
  name: string
  sku?: string
  price?: number
  color?: string
  materials?: string[]
  availableSizes?: string[]
  image?: Image
}

export async function runFilteredSearch(filters: SearchFilters): Promise<SearchDemoProduct[]> {
  const params = {
    category: filters.category ?? null,
    color: filters.color ?? null,
    // Only the first material is used as a single `in materials` constraint —
    // matches the one-material examples this demo's catalog is seeded for.
    material: filters.materials?.[0] ?? null,
    maxPrice: filters.maxPrice ?? null,
    size: filters.size ?? null,
  }
  const products = await agentClient.fetch<RawFilteredProduct[]>(FILTERED_PRODUCTS_QUERY, params)
  return products
}
