import { createClient } from 'next-sanity'
import { defineLive } from 'next-sanity/live'

import { apiVersion, dataset, projectId } from '@/sanity/env'

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Disabled so draft-perspective preview fetches never see CDN-cached data.
  useCdn: false,
  stega: {
    studioUrl: '/studio',
  },
})

const token = process.env.SANITY_API_READ_TOKEN

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
