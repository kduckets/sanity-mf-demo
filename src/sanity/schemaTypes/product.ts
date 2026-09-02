import { PackageIcon } from '@sanity/icons/Package'
import { defineField, defineType } from 'sanity'

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
        'Leave empty to simulate a product the legacy PIM has not sent a price event for yet.',
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
