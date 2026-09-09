import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { defineArrayMember, defineField, defineType } from 'sanity'

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
      options: {
        canvasApp: { purpose: 'The article headline.' },
      },
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96, canvasApp: { exclude: true } },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: ['Magazine', 'Lookbook', 'Creator content'],
        layout: 'radio',
        canvasApp: { exclude: true },
      },
      initialValue: 'Magazine',
    }),
    defineField({
      name: 'dek',
      title: 'Dek',
      description: 'One or two sentence summary shown wherever this article is listed.',
      type: 'text',
      rows: 2,
      options: {
        canvasApp: {
          purpose:
            'A one- or two-sentence hook shown wherever this article is listed — not the whole story, just the pull.',
        },
      },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      description: 'The full article — the writing surface Canvas drafts flow into.',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      options: {
        canvasApp: {
          purpose:
            'The full article body, in the voice of Marlowe & Finch\'s in-house magazine — write the piece here.',
        },
      },
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true, canvasApp: { exclude: true } },
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
      options: {
        canvasApp: {
          purpose: 'A short, punchy live-status line, e.g. "Now live — shop the drop."',
        },
      },
    }),
    defineField({
      name: 'relatedDrop',
      title: 'Related capsule drop',
      type: 'reference',
      to: [{ type: 'capsuleDrop' }],
      weak: true,
      description:
        'Weak reference — an article can cover a drop before that drop is ready to publish. If the ' +
        'drop has no published version yet (or is later removed), this resolves to nothing on the ' +
        'live site rather than blocking either document from publishing independently.',
      options: { canvasApp: { exclude: true } },
    }),
    defineField({
      name: 'relatedProduct',
      title: 'Related product',
      type: 'reference',
      to: [{ type: 'product' }],
      weak: true,
      description:
        'Weak reference, matching how a real link goes stale — if the product is renamed or removed, this can point at nothing. Deliberately broken on one seeded article; the audit checks for this.',
      options: { canvasApp: { exclude: true } },
    }),
    defineField({
      name: 'weeklyViews',
      title: 'Weekly views (simulated)',
      description:
        'Stand-in for a real analytics feed — lets Content Agent demo a popularity-based check without wiring up actual analytics.',
      type: 'number',
      readOnly: true,
      options: { canvasApp: { exclude: true } },
    }),
    defineField({
      name: 'needsReview',
      title: 'Needs review',
      type: 'boolean',
      description: 'Set by the editorial audit panel when it flags this article for a human to look at.',
      initialValue: false,
      readOnly: true,
      options: { canvasApp: { exclude: true } },
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
