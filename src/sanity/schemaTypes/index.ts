import type { SchemaTypeDefinition } from 'sanity'

import { capsuleDrop } from './capsuleDrop'
import { product } from './product'
import { productSpotlight } from './productSpotlight'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [capsuleDrop, product, productSpotlight],
}
