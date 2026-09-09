'use client'

import { DashboardIcon } from '@sanity/icons/Dashboard'
import { visionTool } from '@sanity/vision'
import { dashboardTool } from '@sanity/dashboard'
import { defineConfig } from 'sanity'
import { defineDocuments, defineLocations, presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'

import { LaunchReadinessWidget } from '@/sanity/components/LaunchReadinessWidget'
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
    dashboardTool({
      title: 'Overview',
      icon: DashboardIcon,
      widgets: [
        {
          name: 'launch-readiness',
          component: LaunchReadinessWidget,
          layout: { width: 'full' },
        },
      ],
    }),
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
          {
            route: '/preview/magazine/:slug',
            filter: `_type == "editorialArticle" && slug.current == $slug`,
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
          editorialArticle: defineLocations({
            select: { title: 'title', slug: 'slug.current' },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Untitled article',
                  href: `/preview/magazine/${doc?.slug}`,
                },
                { title: 'Magazine', href: '/preview/magazine' },
              ],
            }),
          }),
        },
      },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
})
