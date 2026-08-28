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

async function seedProducts() {
  console.log(`Seeding ${products.length} products...`);
  for (const product of products) {
    const image = await uploadImageFromUrl(
      product._id,
      product.image,
      `${product.sku}.jpg`,
    );

    const doc = {
      _id: product._id,
      _type: "product",
      name: product.name,
      sku: product.sku,
      availabilityStatus: product.availabilityStatus,
      lastSyncedAt: new Date().toISOString(),
      image: imageField(image),
    };
    if (product.price !== undefined) doc.price = product.price;
    if (product.previousPrice !== undefined) doc.previousPrice = product.previousPrice;

    await discardDraft(product._id);
    await client.createOrReplace(doc);
    console.log(`  ✓ ${product.name} (${product.sku})`);
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
  await seedProducts();
  await seedDrops();
  console.log("\nDone. Two products are deliberately not-ready:");
  console.log('  - "Umber Wide-Leg Trouser" (AV-WR-005) — missing a price');
  console.log('  - "Copper Knit Vest" (AV-WR-006) — availabilityStatus: pending');
  console.log(
    "\nOpen the Autumn Reverie drop in Studio to see the readiness warning.",
  );
  console.log("\nImage sources (Wikimedia Commons, freely licensed):");
  console.log(credits.join("\n"));
} catch (err) {
  console.error("\nSeed failed:", err.message || err);
  process.exit(1);
}
