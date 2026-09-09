import { PackageIcon } from '@sanity/icons/Package'
import { defineArrayMember, defineField, defineType } from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: PackageIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (USD)',
      type: 'number',
      description: 'From the PIM. Leave empty to simulate no price event yet.',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'previousPrice',
      title: 'Previous price (USD)',
      type: 'number',
      description: 'Optional — set to demo a stale-price scenario.',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'availabilityStatus',
      title: 'Availability status',
      type: 'string',
      description: 'From the PIM. Editing here stands in for an automated stock update.',
      options: {
        list: [
          { title: 'In stock', value: 'in_stock' },
          { title: 'Sold out', value: 'sold_out' },
          { title: 'Pending (not yet confirmed)', value: 'pending' },
          { title: 'Draft (no confirmed data)', value: 'draft' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastPimEventAt',
      title: 'Last PIM webhook event',
      type: 'datetime',
      description: 'Last PIM webhook event for this SKU — not a batch sync.',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'pimEventId',
      title: 'PIM event ID',
      type: 'string',
      description: 'Idempotency key for the PIM webhook event.',
    }),
    defineField({
      name: 'image',
      title: 'Product image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Used by the shopping assistant demo.',
      options: {
        list: [
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
        ],
      },
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Used by the shopping assistant demo.',
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Used by the shopping assistant demo.',
    }),
    defineField({
      name: 'availableSizes',
      title: 'Available sizes',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'In-stock sizes — used by the shopping assistant demo.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'sku',
      status: 'availabilityStatus',
      price: 'price',
      media: 'image',
    },
    prepare({ title, subtitle, status, price, media }) {
      const priceLabel = price === undefined || price === null ? 'NO PRICE' : `$${price}`
      return {
        title,
        subtitle: `${subtitle ?? ''} · ${status ?? 'unknown'} · ${priceLabel}`,
        media,
      }
    },
  },
})
