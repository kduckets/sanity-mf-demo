'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { defineDocuments, defineLocations, presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'

import { NotifyWholesaleAction } from '@/sanity/components/NotifyWholesaleAction'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { schema } from '@/sanity/schemaTypes'
import { structure } from '@/sanity/structure'

export default defineConfig({
  basePath: '/studio',
  name: 'marlowe-finch',
  title: 'Marlowe & Finch — Launch Studio',
  projectId,
  dataset,
  schema,
  document: {
    actions: (prev, context) =>
      context.schemaType === 'capsuleDrop'
        ? [...prev, NotifyWholesaleAction]
        : prev,
  },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        initial: '/preview/drops',
      },
      resolve: {
        mainDocuments: defineDocuments([
          {
            route: '/preview/drops/:slug',
            filter: `_type == "capsuleDrop" && slug.current == $slug`,
          },
        ]),
        locations: {
          capsuleDrop: defineLocations({
            select: { title: 'title', slug: 'slug.current' },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Untitled drop',
                  href: `/preview/drops/${doc?.slug}`,
                },
                { title: 'All drops', href: '/preview/drops' },
              ],
            }),
          }),
        },
      },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
})
