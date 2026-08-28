import { SparklesIcon } from '@sanity/icons/Sparkles'
import { defineField, defineType } from 'sanity'

export const productSpotlight = defineType({
  name: 'productSpotlight',
  title: 'Just for you',
  type: 'object',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'Just for you',
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare({ heading }) {
      return {
        title: heading || 'Just for you',
        subtitle: 'Product recommendation (picked automatically)',
      }
    },
  },
})
