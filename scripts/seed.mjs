// Seeds (and resets) demo content for the Marlowe & Finch capsule drop demo.
// Every document uses a fixed _id, is written with createOrReplace, and has
// any unpublished draft discarded first — so this script is safe to re-run
// at any time (e.g. right before a rehearsal) to snap the dataset back to a
// known-good, fully-published state, even if a previous rehearsal left live
// edits sitting unpublished in Studio.
//
// Product/hero imagery is downloaded from Wikimedia Commons (freely licensed,
// no API key required) and re-uploaded to Sanity's asset pipeline, so this
// only needs network access at seed time — the demo itself runs fully local.
//
// Usage: node --env-file=.env.local scripts/seed.mjs

import { createClient } from "@sanity/client";
import crypto from "node:crypto";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_READ_TOKEN;

if (!projectId || !token) {
  console.error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_READ_TOKEN.\n" +
      "Copy .env.local.example to .env.local and fill in your Sanity project details first.",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2025-01-01",
  useCdn: false,
});

// Every image is a real, freely-licensed (CC0/CC-BY/PD) photo sourced from
// Wikimedia Commons — not an exact match for a fictional product, but real
// product/lifestyle photography rather than a generated placeholder.
const uploadedAssets = new Map();
const credits = [];

function commonsFileTitle(url) {
  const parts = decodeURIComponent(url).split("/");
  const thumbIndex = parts.indexOf("thumb");
  const filename = thumbIndex !== -1 ? parts[thumbIndex + 3] : parts[parts.length - 1];
  return `File:${filename}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, attempts = 5) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429 && res.status !== 503) return res;
    if (attempt === attempts) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 1500;
    console.log(`  … rate limited, retrying in ${Math.round(delay / 1000)}s`);
    await sleep(delay);
  }
}

async function uploadImageFromUrl(key, url, filename) {
  if (uploadedAssets.has(key)) return uploadedAssets.get(key);
  // Wikimedia's CDN rate-limits rapid sequential requests, so pace ourselves
  // and retry on 429/503 with backoff (honoring Retry-After when present).
  await sleep(400);
  const res = await fetchWithRetry(url, {
    headers: {
      "User-Agent":
        "MarloweFinchDemoSeed/1.0 (local Sanity demo seed script; not for redistribution)",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to download image for "${key}": ${res.status} ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buffer, { filename });
  uploadedAssets.set(key, asset);
  credits.push(`  - ${key}: ${commonsFileTitle(url)} — https://commons.wikimedia.org/wiki/${encodeURIComponent(commonsFileTitle(url))}`);
  return asset;
}

function imageField(asset) {
  return {
    _type: "image",
    asset: { _type: "reference", _ref: asset._id },
  };
}

// --- Content -----------------------------------------------------------

// Wikimedia Commons thumbnail URLs (freely licensed; see the credit list
// printed at the end of this script for source titles).
const WM = (path) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}`;

const products = [
  {
    _id: "product-av-wr-001",
    name: "Ochre Wool Trench",
    sku: "AV-WR-001",
    price: 428,
    availabilityStatus: "in_stock",
    image: WM("f/fd/Trench_coat_family_%2814087793299%29.jpg/1280px-Trench_coat_family_%2814087793299%29.jpg"),
  },
  {
    _id: "product-av-wr-002",
    name: "Rust Silk Slip Dress",
    sku: "AV-WR-002",
    price: 268,
    availabilityStatus: "in_stock",
    image: WM("c/ca/Dress%2C_evening_%28AM_1970.236-3%29.jpg/1280px-Dress%2C_evening_%28AM_1970.236-3%29.jpg"),
  },
  {
    _id: "product-av-wr-003",
    name: "Amber Cashmere Scarf",
    sku: "AV-WR-003",
    price: 148,
    previousPrice: 168,
    availabilityStatus: "in_stock",
    image: WM("d/d3/CashScarf.JPG/1280px-CashScarf.JPG"),
  },
  {
    _id: "product-av-wr-004",
    name: "Bronze Leather Boots",
    sku: "AV-WR-004",
    price: 512,
    availabilityStatus: "sold_out",
    image: WM("1/1f/Leather_boots_men%27s.jpg/1280px-Leather_boots_men%27s.jpg"),
  },
  {
    _id: "product-av-wr-005",
    name: "Umber Wide-Leg Trouser",
    sku: "AV-WR-005",
    // Deliberately no price — this is the "missing price" not-ready product
    // used to trip the readiness validation during the Act 2 demo.
    availabilityStatus: "in_stock",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/60/Palazzo_trousers.jpg",
  },
  {
    _id: "product-av-wr-006",
    name: "Copper Knit Vest",
    sku: "AV-WR-006",
    price: 96,
    // Deliberately "pending" — the second not-ready product for Act 2.
    availabilityStatus: "pending",
    image: WM("6/60/Kleurrijk_gestreept_gebreid_vest%2C_objectnr_87816%282%29.JPG/1280px-Kleurrijk_gestreept_gebreid_vest%2C_objectnr_87816%282%29.JPG"),
  },
  {
    _id: "product-gh-ms-001",
    name: "Marigold Puffer Jacket",
    sku: "GH-MS-001",
    price: 384,
    availabilityStatus: "in_stock",
    image: WM("4/42/Adidas_Helionic_Down_Jacket.jpg/1280px-Adidas_Helionic_Down_Jacket.jpg"),
  },
  {
    _id: "product-gh-ms-002",
    name: "Honeycomb Merino Sweater",
    sku: "GH-MS-002",
    price: 178,
    availabilityStatus: "in_stock",
    image: WM("c/c4/Oceans_and_trees_Fair_Isle_pullover.jpg/1280px-Oceans_and_trees_Fair_Isle_pullover.jpg"),
  },
  {
    _id: "product-gh-ms-003",
    name: "Field Canvas Tote",
    sku: "GH-MS-003",
    price: 88,
    availabilityStatus: "in_stock",
    image: WM("c/c1/Canvas_two-tone_tote_Navy_and_Natural7_%289038437258%29.jpg/1280px-Canvas_two-tone_tote_Navy_and_Natural7_%289038437258%29.jpg"),
  },
  {
    _id: "product-gh-ms-004",
    name: "Sundown Suede Mules",
    sku: "GH-MS-004",
    price: 236,
    availabilityStatus: "in_stock",
    image: WM("8/83/Mule%2C_1998.174.XA.jpg/1280px-Mule%2C_1998.174.XA.jpg"),
  },
  {
    _id: "product-sf-dv-001",
    name: "Dancing Coyote Tee",
    sku: "SF-DV-001",
    price: 58,
    availabilityStatus: "in_stock",
    image: WM("4/4e/IMages_Are_Hopefully_in_Your_head_since_1982_shirt.jpg/1280px-IMages_Are_Hopefully_in_Your_head_since_1982_shirt.jpg"),
  },
  {
    _id: "product-sf-dv-002",
    name: "Peaceable Kingdom Hoodie",
    sku: "SF-DV-002",
    price: 118,
    availabilityStatus: "in_stock",
    image: WM("e/e8/Sonoma_Raceway_hoodie_-_June_2023_-_Sarah_Stierch.jpg/1280px-Sonoma_Raceway_hoodie_-_June_2023_-_Sarah_Stierch.jpg"),
  },
  {
    _id: "product-sf-dv-003",
    name: "Sun-Bleached Tie-Dye Tee",
    sku: "SF-DV-003",
    price: 62,
    availabilityStatus: "in_stock",
    image: WM("6/6c/Tie_dye_T-shirts.jpg/1280px-Tie_dye_T-shirts.jpg"),
  },
  {
    _id: "product-sf-dv-004",
    name: "Roadside Botanicals Long Sleeve",
    sku: "SF-DV-004",
    price: 68,
    availabilityStatus: "in_stock",
    image: WM("d/df/Raglan-sleeve_shirt.jpg/1280px-Raglan-sleeve_shirt.jpg"),
  },
  {
    _id: "product-sf-dv-005",
    name: "Wildlife Archive Trucker Hat",
    sku: "SF-DV-005",
    price: 38,
    availabilityStatus: "in_stock",
    image: WM("5/50/Truckerhat.jpg/1280px-Truckerhat.jpg"),
  },
  {
    _id: "product-sf-dv-006",
    name: "Slow Fauna Stoneware Mug",
    sku: "SF-DV-006",
    price: 34,
    availabilityStatus: "in_stock",
    image: WM("9/9e/White_Ceramic_Mug_Filled_With_Coffee_Beside_Coffee_Beans_%2843087322071%29.jpg/1280px-White_Ceramic_Mug_Filled_With_Coffee_Beside_Coffee_Beans_%2843087322071%29.jpg"),
  },
];

// Dedicated catalog for the structured-search demo (Use Case 1/2 supplement)
// — kept out of `products` above and out of every capsule drop's product
// list, so it never touches the Acts 1–3 flow. Two exact matches for "blue
// wool sweaters under $100, size M"; the rest each fail exactly one
// constraint, to make the contrast with the fake similarity panel legible.
// Non-matches skip `image` — they're never rendered, only queried.
const searchDemoProducts = [
  {
    _id: "product-search-demo-001",
    name: "Cove Blue Wool Crewneck",
    sku: "SD-001",
    price: 88,
    availabilityStatus: "in_stock",
    category: "sweater",
    color: "blue",
    materials: ["wool"],
    availableSizes: ["S", "M", "L"],
    image: WM("c/c4/Oceans_and_trees_Fair_Isle_pullover.jpg/1280px-Oceans_and_trees_Fair_Isle_pullover.jpg"),
  },
  {
    _id: "product-search-demo-002",
    name: "Slate Blue Lambswool Sweater",
    sku: "SD-002",
    price: 96,
    availabilityStatus: "in_stock",
    category: "sweater",
    color: "blue",
    materials: ["wool", "lambswool"],
    availableSizes: ["M", "L"],
    image: WM("c/c4/Oceans_and_trees_Fair_Isle_pullover.jpg/1280px-Oceans_and_trees_Fair_Isle_pullover.jpg"),
  },
  {
    _id: "product-search-demo-003",
    name: "Cove Blue Cotton Crewneck",
    sku: "SD-003",
    // Fails the material constraint (cotton, not wool).
    price: 74,
    availabilityStatus: "in_stock",
    category: "sweater",
    color: "blue",
    materials: ["cotton"],
    availableSizes: ["S", "M", "L"],
  },
  {
    _id: "product-search-demo-004",
    name: "Amber Wool Crewneck",
    sku: "SD-004",
    // Fails the color constraint (amber, not blue).
    price: 92,
    availabilityStatus: "in_stock",
    category: "sweater",
    color: "amber",
    materials: ["wool"],
    availableSizes: ["M"],
  },
  {
    _id: "product-search-demo-005",
    name: "Cove Blue Wool Sweater",
    sku: "SD-005",
    // Fails the price constraint (over $100).
    price: 128,
    availabilityStatus: "in_stock",
    category: "sweater",
    color: "blue",
    materials: ["wool"],
    availableSizes: ["M"],
  },
  {
    _id: "product-search-demo-006",
    name: "Cove Blue Wool Pullover",
    sku: "SD-006",
    // Fails the size/stock constraint (no M in stock).
    price: 84,
    availabilityStatus: "in_stock",
    category: "sweater",
    color: "blue",
    materials: ["wool"],
    availableSizes: ["S", "L"],
  },
  {
    _id: "product-search-demo-007",
    name: "Cove Blue Wool Scarf",
    sku: "SD-007",
    // Fails the category constraint (scarf, not sweater).
    price: 68,
    availabilityStatus: "in_stock",
    category: "scarf",
    color: "blue",
    materials: ["wool"],
    availableSizes: [],
  },
];

// Editorial/magazine content (Use Case 4) — deliberately separate from the
// three capsule drops' own `editorialStory` field. Each article carries at
// most one intentional gap for the audit panel to find; one is left clean as
// a control so the audit doesn't read as flagging everything indiscriminately.
const editorialArticles = [
  {
    _id: "editorial-article-fall-layering",
    title: "Reading the Room: A Fall Layering Guide",
    slug: "fall-layering-guide",
    kind: "Magazine",
    dek: "Three ways to layer this season's key pieces, from studio to street.",
    coverImage: WM("7/71/Forest_path_through_yellow_autumn_leaves_in_Tuntorp_1.jpg/1280px-Forest_path_through_yellow_autumn_leaves_in_Tuntorp_1.jpg"),
    // Deliberately no alt text — the "missing alt text" audit gap.
    weeklyViews: 620,
    body: [
      "The trick to layering isn't more pieces — it's picking three that actually earn their place. Start with something close and light, add one piece of real structure, and finish with the layer you'd wear alone on a warmer day.",
      "This season that means the Honeycomb Merino Sweater under the Ochre Wool Trench, with the Amber Cashmere Scarf doing the work a fourth layer usually would. Swap the trench for the Marigold Puffer on the coldest days and the formula still holds.",
      "None of this is precious. Layering is supposed to survive a commute, a coffee run, and a chair back at your desk — these pieces are chosen because they do.",
    ],
  },
  {
    _id: "editorial-article-wilder-row-visit",
    title: "Wilder Row Studio Visit",
    slug: "wilder-row-studio-visit",
    kind: "Creator content",
    dek: "A morning in the studio where Autumn Reverie started as a sketch on a gig poster.",
    coverImage: WM("7/71/Forest_path_through_yellow_autumn_leaves_in_Tuntorp_1.jpg/1280px-Forest_path_through_yellow_autumn_leaves_in_Tuntorp_1.jpg"),
    coverImageAlt: "Wilder Row's studio workspace",
    // Points at a product id that doesn't exist — the "broken product link" gap.
    relatedProductId: "product-av-wr-999",
    weeklyViews: 1900,
    body: [
      "Amara Voss keeps a corkboard of gig posters over her cutting table, and Autumn Reverie started as a note scrawled across one of them: a coat silhouette, an arrow, the word 'heavier.'",
      "By the time we visited, that note had become a dozen fittings and a wall of fabric swatches in ochre and rust. Nothing on the rack yet looked like the finished line — that's the part that doesn't photograph well, and the part that matters most.",
      "Six weeks later the trench existed. The poster is still on the corkboard.",
    ],
  },
  {
    _id: "editorial-article-golden-hour-restock",
    title: "Golden Hour Restock",
    slug: "golden-hour-restock",
    kind: "Magazine",
    dek: "Everything from the Golden Hour capsule, back in stock for one more pass through the light.",
    coverImage: WM("a/ad/That_Golden_Hour_Light_%2814871942828%29.jpg/1280px-That_Golden_Hour_Light_%2814871942828%29.jpg"),
    coverImageAlt: "Golden hour light through trees",
    relatedDropId: "capsule-drop-golden-hour",
    // Golden Hour is fully published and ready — this copy just never got
    // updated. The "stale promo copy" gap.
    promoCopy: "Coming soon — details TBD",
    // High traffic + no product link — the "high-traffic gap" check.
    weeklyViews: 5200,
    body: [
      "Golden Hour sold through its first run in eleven days, which is either a good problem or an object lesson in ordering enough puffer jackets, depending who at Marlowe Studio you ask.",
      "The restock brings back all four pieces — the Marigold Puffer, the Honeycomb Merino Sweater, the Field Canvas Tote, the Sundown Suede Mules — in the same quantities as the original drop. No changes, no reprint of the story. Some capsules don't need a second chapter, just a second chance to catch them.",
    ],
  },
  {
    _id: "editorial-article-slow-fauna-zine",
    title: "Slow Fauna Zine, Issue No. 1",
    slug: "slow-fauna-zine-issue-1",
    kind: "Lookbook",
    dek: "Behind the hand-tied dye lots of the Peaceable Kingdom capsule.",
    coverImage: WM("6/69/Desert_Sky%2C_Joshua_Tree_NP_4-13_%2831141402630%29.jpg/1280px-Desert_Sky%2C_Joshua_Tree_NP_4-13_%2831141402630%29.jpg"),
    coverImageAlt: "Desert sky over Joshua Tree",
    relatedDropId: "capsule-drop-slow-fauna",
    relatedProductId: "product-sf-dv-006",
    promoCopy: "Now live — shop the drop.",
    // No gaps — control case, proves the audit doesn't flag everything.
    weeklyViews: 980,
    body: [
      "Dana Vela hand-tied every dye lot for Peaceable Kingdom on the same wheel where Slow Fauna started as a market-stall side project. This zine is the record of that process — the coyotes, the moths, the weeds pushing through parking-lot cracks — before any of it became a product photo.",
      "Issue No. 1 is six pieces and six pages, one for each. It's a slow read on purpose.",
    ],
  },
];

const drops = [
  {
    _id: "capsule-drop-autumn-reverie",
    title: "Autumn Reverie x Wilder Row",
    slug: "autumn-reverie-x-wilder-row",
    creatorCollaborator: "Wilder Row",
    launchDate: "2026-10-08T15:00:00.000Z",
    heroImage: WM("7/71/Forest_path_through_yellow_autumn_leaves_in_Tuntorp_1.jpg/1280px-Forest_path_through_yellow_autumn_leaves_in_Tuntorp_1.jpg"),
    productIds: [
      "product-av-wr-001",
      "product-av-wr-002",
      "product-av-wr-003",
      "product-av-wr-004",
      "product-av-wr-005",
      "product-av-wr-006",
    ],
    editorialStory: [
      "Somewhere between the last warm afternoon and the first frost, Amara Voss found Wilder Row sketching coat silhouettes on the back of a gig-poster proof. Six weeks and a hundred fittings later, Autumn Reverie is the record of that conversation — outerwear and separates in a palette of ochre, rust, and umber, cut for the specific ritual of walking home slowly because the light is doing something worth noticing.",
      spotlight(),
      "The collection leans on weight rather than decoration: raw wool that holds a crease, silk with enough body to swing, cashmere knit densely enough to read as armor against the first real cold. Wilder Row's contribution shows up less in logos than in proportion — dropped shoulders, cropped hems, a trouser cut wide enough to move in without ever looking loose.",
      "This is a small run by design. Twelve pieces, most of them one per color, all of them meant to be worn until they wear back. Autumn Reverie launches as a single story — editorial and product together — because that's the only way this kind of collection is supposed to be told.",
    ],
  },
  {
    _id: "capsule-drop-golden-hour",
    title: "Golden Hour x Marlowe Studio",
    slug: "golden-hour-x-marlowe-studio",
    creatorCollaborator: "Marlowe Studio",
    launchDate: "2026-09-15T15:00:00.000Z",
    heroImage: WM("a/ad/That_Golden_Hour_Light_%2814871942828%29.jpg/1280px-That_Golden_Hour_Light_%2814871942828%29.jpg"),
    productIds: [
      "product-gh-ms-001",
      "product-gh-ms-002",
      "product-gh-ms-003",
      "product-gh-ms-004",
    ],
    editorialStory: [
      "Golden Hour is Marlowe Studio's take on the last good light of the day — the twenty minutes when everything, including last season's field jacket, looks like it belongs in a magazine. It's a small, fully-ready capsule: four pieces, every one of them in stock, priced, and photographed.",
      spotlight(),
      "Where Autumn Reverie is about the ritual of dressing for weather, Golden Hour is about dressing for a specific hour — the puffer you throw on to catch the sunset, the tote that's already got sand in the bottom seam by the second wear. Nothing precious, everything considered.",
    ],
  },
  {
    _id: "capsule-drop-slow-fauna",
    title: "Peaceable Kingdom x Dana Vela",
    slug: "peaceable-kingdom-x-dana-vela",
    creatorCollaborator: "Dana Vela",
    launchDate: "2026-09-29T15:00:00.000Z",
    heroImage: WM("6/69/Desert_Sky%2C_Joshua_Tree_NP_4-13_%2831141402630%29.jpg/1280px-Desert_Sky%2C_Joshua_Tree_NP_4-13_%2831141402630%29.jpg"),
    productIds: [
      "product-sf-dv-001",
      "product-sf-dv-002",
      "product-sf-dv-003",
      "product-sf-dv-004",
      "product-sf-dv-005",
      "product-sf-dv-006",
    ],
    editorialStory: [
      "Slow Fauna is the roadside-Americana label in the Marlowe & Finch portfolio — hand-drawn animals, sun-faded color, and the unhurried logic of a summer with nowhere urgent to be. For this capsule, illustrator Dana Vela spent a season sketching the coyotes, moths, and backyard weeds that show up between gas stations on the long drive between nowhere and somewhere, then hand-tied every dye lot herself in small batches.",
      "Nothing here is printed to a template. Tie-dye grounds shift piece to piece; line art is inked, not vectored; the stoneware mug rounding out the drop was thrown on the same wheel as the label's very first run, back when Slow Fauna was still a market-stall side project before Marlowe & Finch brought it into the fold.",
      spotlight(),
      "It's a small, slow collection about paying attention — to a coyote at dusk, to a weed pushing through a parking lot crack, to the fact that summer is already ending. Six pieces, hand-finished, sold as one story.",
    ],
  },
];

function randomKey() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

// Marks a spot in an editorialStory array for a "Just for you" product
// recommendation block, mixed in among the plain paragraph strings.
function spotlight(heading) {
  return { __spotlight: true, heading };
}

function toPortableText(items) {
  return items.map((item) => {
    if (item && typeof item === "object" && item.__spotlight) {
      return { _type: "productSpotlight", _key: randomKey(), heading: item.heading };
    }
    return {
      _type: "block",
      _key: randomKey(),
      style: "normal",
      children: [{ _type: "span", _key: randomKey(), text: item }],
    };
  });
}

async function discardDraft(id) {
  // If a previous rehearsal left an unpublished edit sitting in Studio, wipe
  // it too — otherwise createOrReplace (which only ever touches the published
  // copy) would leave that stale draft in place, and it could resurface the
  // next time someone opens the document.
  await client.delete(`drafts.${id}`);
}

async function seedProducts(list) {
  console.log(`Seeding ${list.length} products...`);
  for (const product of list) {
    const doc = {
      _id: product._id,
      _type: "product",
      name: product.name,
      sku: product.sku,
      availabilityStatus: product.availabilityStatus,
      // Stands in for the webhook-triggered mutation a real PIM integration
      // would send — an event landing via API, not a batch job catching up.
      lastPimEventAt: new Date().toISOString(),
      pimEventId: `evt_${randomKey()}`,
    };
    // Search-demo non-matches skip an image — they're only ever queried, never rendered.
    if (product.image) {
      const image = await uploadImageFromUrl(product._id, product.image, `${product.sku}.jpg`);
      doc.image = imageField(image);
    }
    if (product.price !== undefined) doc.price = product.price;
    if (product.previousPrice !== undefined) doc.previousPrice = product.previousPrice;
    if (product.category !== undefined) doc.category = product.category;
    if (product.color !== undefined) doc.color = product.color;
    if (product.materials !== undefined) doc.materials = product.materials;
    if (product.availableSizes !== undefined) doc.availableSizes = product.availableSizes;

    await discardDraft(product._id);
    await client.createOrReplace(doc);
    console.log(`  ✓ ${product.name} (${product.sku})`);
  }
}

async function seedEditorialArticles() {
  console.log(`\nSeeding ${editorialArticles.length} editorial article(s)...`);
  for (const article of editorialArticles) {
    const coverImage = await uploadImageFromUrl(
      `${article._id}-cover`,
      article.coverImage,
      `${article.slug}-cover.jpg`,
    );

    const coverImageField = imageField(coverImage);
    if (article.coverImageAlt) coverImageField.alt = article.coverImageAlt;

    const doc = {
      _id: article._id,
      _type: "editorialArticle",
      title: article.title,
      slug: { _type: "slug", current: article.slug },
      kind: article.kind,
      dek: article.dek,
      coverImage: coverImageField,
      needsReview: false,
    };
    if (article.body) doc.body = toPortableText(article.body);
    if (article.promoCopy !== undefined) doc.promoCopy = article.promoCopy;
    if (article.weeklyViews !== undefined) doc.weeklyViews = article.weeklyViews;
    if (article.relatedDropId) {
      doc.relatedDrop = { _type: "reference", _ref: article.relatedDropId };
    }
    if (article.relatedProductId) {
      // Weak, matching the schema field — lets this point at a nonexistent
      // product without Sanity's referential-integrity check rejecting the
      // write (a real stale link behaves the same way once its target is
      // renamed or removed).
      doc.relatedProduct = {
        _type: "reference",
        _ref: article.relatedProductId,
        _weak: true,
      };
    }

    await discardDraft(article._id);
    await client.createOrReplace(doc);
    console.log(`  ✓ ${article.title}`);
  }
}

async function seedDrops() {
  console.log(`\nSeeding ${drops.length} capsule drop(s)...`);
  for (const drop of drops) {
    const heroImage = await uploadImageFromUrl(
      `${drop._id}-hero`,
      drop.heroImage,
      `${drop.slug}-hero.jpg`,
    );

    await discardDraft(drop._id);
    await client.createOrReplace({
      _id: drop._id,
      _type: "capsuleDrop",
      title: drop.title,
      slug: { _type: "slug", current: drop.slug },
      creatorCollaborator: drop.creatorCollaborator,
      launchDate: drop.launchDate,
      heroImage: imageField(heroImage),
      editorialStory: toPortableText(drop.editorialStory),
      products: drop.productIds.map((id) => ({
        _type: "reference",
        _key: id,
        _ref: id,
      })),
    });
    console.log(`  ✓ ${drop.title} (/drops/${drop.slug})`);
  }
}

try {
  await seedProducts([...products, ...searchDemoProducts]);
  await seedDrops();
  await seedEditorialArticles();
  console.log("\nDone. Two products are deliberately not-ready:");
  console.log('  - "Umber Wide-Leg Trouser" (AV-WR-005) — missing a price');
  console.log('  - "Copper Knit Vest" (AV-WR-006) — availabilityStatus: pending');
  console.log(
    "\nOpen the Autumn Reverie drop in Studio to see the readiness warning.",
  );
  console.log(
    "\nThree editorial articles carry a deliberate gap for the audit panel\n" +
      '(Studio → "Editorial Audit"): missing alt text, a broken product link,\n' +
      "and stale promo copy on the Golden Hour restock piece. A fourth is clean.",
  );
  console.log(
    '\n"Cove Blue Wool Crewneck" and "Slate Blue Lambswool Sweater" are the\n' +
      "only exact matches for the /search-demo constraint-based query.",
  );
  console.log("\nImage sources (Wikimedia Commons, freely licensed):");
  console.log(credits.join("\n"));
} catch (err) {
  console.error("\nSeed failed:", err.message || err);
  process.exit(1);
}
