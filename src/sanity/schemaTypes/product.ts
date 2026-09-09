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
      description:
        'Comes from the PIM — not something a person normally edits directly. Leave empty to ' +
        'simulate a product the PIM hasn\'t sent a price event for yet; editing it here for the ' +
        'demo stands in for that automated push.',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'previousPrice',
      title: 'Previous price (USD)',
      type: 'number',
      description: 'Optional — set this to demonstrate a stale-price scenario.',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'availabilityStatus',
      title: 'Availability status',
      type: 'string',
      description:
        'Comes from the PIM — not something a person normally edits directly. Changing it here ' +
        'for the demo stands in for the automated push a real stock update would trigger.',
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
      description:
        'Timestamp of the last webhook-triggered mutation from the legacy PIM for this SKU — an ' +
        'event landing via API, not a batch sync catching up on a schedule.',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'pimEventId',
      title: 'PIM event ID',
      type: 'string',
      description:
        'Simulates the idempotency key a real PIM webhook payload would carry, so a redelivered ' +
        'event mutates this document once, not twice.',
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
      description: 'Structured catalog field used by the shopping assistant demo.',
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
      description: 'Structured catalog field used by the shopping assistant demo.',
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Structured catalog field used by the shopping assistant demo.',
    }),
    defineField({
      name: 'availableSizes',
      title: 'Available sizes',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description:
        'Sizes currently in stock — used by the shopping assistant demo to prove size/stock filtering.',
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
