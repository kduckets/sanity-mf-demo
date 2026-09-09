export interface ReadinessProduct {
  _id: string
  name: string
  sku?: string
  price?: number
  availabilityStatus?: string
}

export interface ReadinessIssue {
  productId: string
  productName: string
  sku?: string
  field: 'availabilityStatus' | 'price'
  // Full sentence, for contexts that can only render plain text (e.g. the
  // document-level validation error). `detail` is the same sentence minus
  // the product name, so UI that can link the name renders
  // <Link>{productName}</Link> {detail} instead.
  message: string
  detail: string
}

export interface ReadinessResult {
  ready: boolean
  issues: ReadinessIssue[]
}

const BLOCKING_STATUSES = new Set(['pending', 'draft'])

export function computeReadiness(products: ReadinessProduct[]): ReadinessResult {
  const issues: ReadinessIssue[] = []

  for (const product of products) {
    const label = product.name || product.sku || 'Untitled product'

    if (product.availabilityStatus && BLOCKING_STATUSES.has(product.availabilityStatus)) {
      const detail = `is marked "${product.availabilityStatus}" — not confirmed ready for launch.`
      issues.push({
        productId: product._id,
        productName: label,
        sku: product.sku,
        field: 'availabilityStatus',
        message: `"${label}" ${detail}`,
        detail,
      })
    }

    if (product.price === undefined || product.price === null) {
      const detail = 'is missing a price.'
      issues.push({
        productId: product._id,
        productName: label,
        sku: product.sku,
        field: 'price',
        message: `"${label}" ${detail}`,
        detail,
      })
    }
  }

  return { ready: issues.length === 0, issues }
}
