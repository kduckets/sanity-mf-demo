import { defineQuery } from 'next-sanity'
import type { Image, PortableTextBlock } from 'sanity'

// Hand-written result types for the two queries below. This project doesn't
// run Sanity TypeGen (it needs a live, configured project to extract the
// schema from), so these are kept in sync with the GROQ projections by hand.

export interface CapsuleDropListItem {
  _id: string
  title: string
  creatorCollaborator?: string
  slug: string
  launchDate?: string
  heroImage?: Image
  publishedState?: string
}

export interface DropProduct {
  _key: string
  _id: string
  name: string
  sku?: string
  price?: number
  previousPrice?: number
  availabilityStatus?: string
  lastPimEventAt?: string
  image?: Image
}

// A product rendered outside the `products` array (e.g. the spotlight pick)
// has no array `_key` of its own.
export type SpotlightProduct = Omit<DropProduct, '_key'>

export interface ProductSpotlightNode {
  _key: string
  _type: 'productSpotlight'
  heading?: string
}

export type EditorialStoryNode = PortableTextBlock | ProductSpotlightNode

export interface CapsuleDropDetail {
  _id: string
  title: string
  creatorCollaborator?: string
  launchDate?: string
  heroImage?: Image
  editorialStory?: EditorialStoryNode[]
  publishedState?: string
  products: (DropProduct | null)[]
}

// Pool to pick a "Just for you" spotlight product from at render time —
// restricted to in-stock, priced products so the recommendation never
// surfaces one of the deliberately not-ready demo products.
export const SPOTLIGHT_PRODUCT_POOL_QUERY = defineQuery(`
  *[_type == "product" && availabilityStatus == "in_stock" && defined(price)]{
    _id,
    name,
    sku,
    price,
    previousPrice,
    availabilityStatus,
    lastPimEventAt,
    image
  }
`)

export const CAPSULE_DROPS_QUERY = defineQuery(`
  *[_type == "capsuleDrop" && defined(slug.current)] | order(launchDate desc){
    _id,
    title,
    creatorCollaborator,
    "slug": slug.current,
    launchDate,
    heroImage,
    publishedState
  }
`)

export const CAPSULE_DROP_QUERY = defineQuery(`
  *[_type == "capsuleDrop" && slug.current == $slug][0]{
    _id,
    title,
    creatorCollaborator,
    launchDate,
    heroImage,
    "editorialStory": editorialStory[]{
      ...,
      children[]{
        ...
      }
    },
    publishedState,
    "products": products[]{
      _key,
      ...@->{
        _id,
        name,
        sku,
        price,
        previousPrice,
        availabilityStatus,
        lastPimEventAt,
        image
      }
    }
  }
`)
