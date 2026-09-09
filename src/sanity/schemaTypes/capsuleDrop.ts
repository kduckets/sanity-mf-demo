import { SparklesIcon } from '@sanity/icons/Sparkles'
import { defineArrayMember, defineField, defineType } from 'sanity'

import { apiVersion } from '@/sanity/env'
import { ArticlesBacklinkInput } from '@/sanity/components/ArticlesBacklinkInput'
import { ReadinessStatusInput } from '@/sanity/components/ReadinessStatusInput'
import { PublishedStateInput } from '@/sanity/components/PublishedStateInput'
import { computeReadiness, type ReadinessProduct } from '@/sanity/lib/readiness'

interface CapsuleDropDraft {
  products?: { _ref?: string }[]
}

export const capsuleDrop = defineType({
  name: 'capsuleDrop',
  title: 'Capsule Drop',
  type: 'document',
  icon: SparklesIcon,
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
      name: 'creatorCollaborator',
      title: 'Creator collaborator',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'launchDate',
      title: 'Launch date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'editorialStory',
      title: 'Editorial story',
      description: 'Insert a "Just for you" block via the + menu; drag to reposition.',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({ type: 'productSpotlight' }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'articles',
      title: 'Articles',
      description: 'Live-computed from articles that link here. Set the link on the article, not here.',
      type: 'string',
      readOnly: true,
      components: { input: ArticlesBacklinkInput },
    }),
    defineField({
      name: 'readinessStatus',
      title: 'Readiness',
      type: 'string',
      readOnly: true,
      components: { input: ReadinessStatusInput },
    }),
    defineField({
      name: 'publishedState',
      title: 'Publish state',
      type: 'string',
      readOnly: true,
      components: { input: PublishedStateInput },
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Ready', value: 'ready' },
          { title: 'Published', value: 'published' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      creator: 'creatorCollaborator',
      media: 'heroImage',
    },
    prepare({ title, creator, media }) {
      return {
        title,
        subtitle: creator ? `x ${creator}` : undefined,
        media,
      }
    },
  },
  validation: (Rule) =>
    Rule.custom(async (doc, context) => {
      const draft = doc as CapsuleDropDraft | undefined
      const refs = (draft?.products ?? [])
        .map((ref) => ref?._ref)
        .filter((id): id is string => Boolean(id))

      if (refs.length === 0) return true

      const client = context.getClient({ apiVersion })
      const products = await client.fetch<ReadinessProduct[]>(
        `*[_id in $ids]{_id, name, sku, price, availabilityStatus}`,
        { ids: refs },
      )

      const { issues } = computeReadiness(products)
      if (issues.length === 0) return true

      return issues.map((issue) => ({
        message: `Not ready to publish: ${issue.message}`,
        path: ['products'],
      }))
    }),
})
