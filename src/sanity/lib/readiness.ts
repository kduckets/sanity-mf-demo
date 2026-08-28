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
  message: string
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
      issues.push({
        productId: product._id,
        productName: label,
        sku: product.sku,
        field: 'availabilityStatus',
        message: `"${label}" is marked "${product.availabilityStatus}" — not confirmed ready for launch.`,
      })
    }

    if (product.price === undefined || product.price === null) {
      issues.push({
        productId: product._id,
        productName: label,
        sku: product.sku,
        field: 'price',
        message: `"${label}" is missing a price.`,
      })
    }
  }

  return { ready: issues.length === 0, issues }
}
