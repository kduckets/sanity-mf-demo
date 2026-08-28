import { PackageIcon } from '@sanity/icons/Package'
import { SparklesIcon } from '@sanity/icons/Sparkles'
import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Marlowe & Finch')
    .items([
      S.listItem()
        .title('Capsule Drops')
        .icon(SparklesIcon)
        .child(S.documentTypeList('capsuleDrop').title('Capsule Drops')),
      S.listItem()
        .title('Products')
        .icon(PackageIcon)
        .child(S.documentTypeList('product').title('Products')),
    ])
