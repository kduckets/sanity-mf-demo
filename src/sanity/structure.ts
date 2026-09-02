import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { PackageIcon } from '@sanity/icons/Package'
import { RobotIcon } from '@sanity/icons/Robot'
import { SparklesIcon } from '@sanity/icons/Sparkles'
import type { StructureResolver } from 'sanity/structure'

import { EditorialAuditPane } from '@/sanity/components/EditorialAuditPane'

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
      S.listItem()
        .title('Editorial Articles')
        .icon(DocumentTextIcon)
        .child(S.documentTypeList('editorialArticle').title('Editorial Articles')),
      S.divider(),
      S.listItem()
        .title('Content Agent')
        .icon(RobotIcon)
        .child(S.component(EditorialAuditPane).title('Content Agent')),
    ])
