import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { defineField, defineType } from 'sanity'

// Represents the magazine/lookbook/creator-content layer that sits alongside
// capsule drops — the kind of scattered marketing content Use Case 1 (and the
// editorial-audit demo, Use Case 4) is about. Deliberately a separate
// document type from `capsuleDrop` so seeding demo gaps here never touches
// the core three drops used in Acts 1–3.
export const editorialArticle = defineType({
  name: 'editorialArticle',
  title: 'Editorial Article',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: ['Magazine', 'Lookbook', 'Creator content'],
        layout: 'radio',
      },
      initialValue: 'Magazine',
    }),
    defineField({
      name: 'dek',
      title: 'Dek',
      description: 'One or two sentence summary shown wherever this article is listed.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Left blank on some seeded articles on purpose — the audit checks for this.',
        }),
      ],
    }),
    defineField({
      name: 'promoCopy',
      title: 'Promo copy',
      description: 'Short live-status line, e.g. shown as a badge — the kind of copy that goes stale.',
      type: 'string',
    }),
    defineField({
      name: 'relatedDrop',
      title: 'Related capsule drop',
      type: 'reference',
      to: [{ type: 'capsuleDrop' }],
    }),
    defineField({
      name: 'relatedProduct',
      title: 'Related product',
      type: 'reference',
      to: [{ type: 'product' }],
      weak: true,
      description:
        'Weak reference, matching how a real link goes stale — if the product is renamed or removed, this can point at nothing. Deliberately broken on one seeded article; the audit checks for this.',
    }),
    defineField({
      name: 'needsReview',
      title: 'Needs review',
      type: 'boolean',
      description: 'Set by the editorial audit panel when it flags this article for a human to look at.',
      initialValue: false,
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      kind: 'kind',
      needsReview: 'needsReview',
      media: 'coverImage',
    },
    prepare({ title, kind, needsReview, media }) {
      return {
        title,
        subtitle: needsReview ? `${kind ?? 'Article'} · ⚠ needs review` : kind,
        media,
      }
    },
  },
})
