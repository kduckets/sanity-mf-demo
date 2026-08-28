# Marlowe & Finch — Launch Coordination Demo

- **Live:** https://sanity-mf-demo.vercel.app
- **Repo:** https://github.com/kduckets/sanity-mf-demo

A live Sanity + Next.js demo built for a Solution Engineer interview. It shows a
fictional apparel retailer ("Marlowe & Finch") how a unified content model with
real-time sync and publish-time validation fixes the launch-coordination problem
they had: editorial content going live while linked product data (price,
availability) was still stale.

Studio and the storefront run in the **same Next.js app** — one server, one
command to start it. For the actual demo, run it in **production mode**
(`npm run build && npm run start`), not `npm run dev` — see [§4](#4-run-it) for
why.

## 1. Set up a Sanity project

You need a real (free-tier) Sanity project.

```bash
npx sanity@latest init
```

Or create one manually at [sanity.io/manage](https://www.sanity.io/manage). Either
way you need:

- A **project ID** and **dataset name** (`production` is fine)
- An **API token** with Editor (read/write) permissions — create one under
  your project's API settings

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and
`SANITY_API_READ_TOKEN` in `.env.local`.

## 3. Install and seed

```bash
npm install
npm run seed
```

`npm run seed` writes three capsule drops and sixteen products directly to your
dataset using fixed document IDs, so it's **safe to re-run any time** — including
right before you go on — to reset the dataset to a known-good state. Product and
hero imagery is downloaded from Wikimedia Commons (freely licensed, no API key)
and re-uploaded to Sanity's asset pipeline, so seeding needs outbound network
access; the demo itself, once seeded, runs fully local. The image credits printed
at the end of the seed script list every source.

One of the seeded drops, **"Autumn Reverie x Wilder Row,"** has two deliberately
not-ready products:

- **Umber Wide-Leg Trouser** (`AV-WR-005`) — missing a price
- **Copper Knit Vest** (`AV-WR-006`) — `availabilityStatus: pending`

The other two — **"Golden Hour x Marlowe Studio"** and **"Peaceable Kingdom x
Dana Vela"** (Slow Fauna, the label's boho-streetwear line) — are fully ready.
Keep either in your back pocket as a fallback if live editing goes sideways
mid-demo, and use them to show that the same model holds up across visually
distinct labels in the portfolio, not just one.

## 4. Run it

**For the actual interview, running locally is still the plan** — no network
dependency, no risk of a venue's wifi being the reason something breaks. The
Vercel deployment above exists mainly to check whether Presentation Tool's
comlink connection (see the fragile-points note near the bottom) behaves
differently on a real HTTPS domain than it does locally; it isn't a
replacement for the local flow. `vercel.json` pins the framework to Next.js
explicitly — Vercel's zero-config detection didn't pick it up on its own,
likely due to the Sanity CLI config files (`sanity.cli.ts`) sitting at the
project root alongside the Next.js ones.

**For the actual demo, use production mode:**

```bash
npm run build
npm run start
```

**For local iteration/rehearsal-content edits, use dev mode:**

```bash
npm run dev
```

- Studio: [http://localhost:3000/studio](http://localhost:3000/studio)
- Storefront: [http://localhost:3000](http://localhost:3000)

Why production mode for the demo: `npm run dev` (Turbopack) compiles each
route on-demand the first time it's requested, which can take several seconds
on a route nobody's visited yet. Presentation Tool's iframe has a connection
handshake with a timeout shorter than that — the first click into a drop
inside Studio → Presentation can hit **"Could not connect to the preview"**
purely because the route was still compiling, even though clicking **Retry**
a moment later works fine (by then it's compiled). `npm run build` compiles
everything up front, so there's no first-visit lag: production-mode cold
requests land in ~300–500ms instead of several seconds. If you edit any code
after building, run `npm run build` again before demoing — `npm run start`
serves whatever was last built, it doesn't hot-reload. Content edits made in
Studio don't need a rebuild; those flow through Sanity's API and
`<SanityLive />` regardless of which mode the Next.js server is in.

If the browser console shows "unable to connect... not in the list of allowed
CORS origins," add `http://localhost:3000` as a CORS origin (with "Allow
credentials" on) under your project's API settings at sanity.io/manage —
required for the live-update connection (`<SanityLive />`) to work at all.

## Site structure

The storefront is built to read like a real lifestyle-retail site, not a bare
CMS demo:

- **`/`** — homepage: hero on the latest drop, brand statement, more drops
- **`/drops`** — full drop catalog (published content only)
- **`/drops/[slug]`** — a single capsule drop (editorial + linked products)
- **`/about`** — brand story and a small stats strip ($650M / 6 labels / etc.)
- **`/wholesale`** — wholesale positioning and contact
- **`/preview/drops`** and **`/preview/drops/[slug]`** — the same pages, but
  reading unpublished draft content. A separate URL tree (not a cookie toggle
  on the same URL), so it's unambiguous in the address bar which one you're on
- **`/studio`** — the Sanity Studio, embedded in the same app, including a
  **Presentation** tool tab that iframes the `/preview/*` pages for
  click-to-edit and drag-and-drop reordering (see below)

## How it works

- **One content model.** `capsuleDrop` holds the editorial story and references
  to `product` documents. `product` stands in for what a legacy PIM would feed
  in. See `src/sanity/schemaTypes/`.
- **Readiness validation.** `capsuleDrop` has an async, document-level
  validation rule (`src/sanity/schemaTypes/capsuleDrop.ts`) that dereferences
  every linked product and blocks publishing if any product is `pending`,
  `draft`, or missing a price — naming the specific product and field. This is
  native Sanity validation, so it disables the Publish button for real.
- **Live readiness panel.** The `readinessStatus` and `publishedState` fields on
  `capsuleDrop` render custom components (`src/sanity/components/`) that
  subscribe to the linked products in real time via `client.listen()`. Fix a
  product in one browser tab and the warning clears in another within a couple
  of seconds — no refresh needed. This works regardless of publish state,
  since it talks to Studio's live document store directly.
- **Published-only storefront, with a separate preview site for drafts.**
  `/drops` and `/drops/[slug]` call `sanityFetch` with `perspective:
  "published"` — a real storefront wouldn't show a stakeholder someone else's
  half-finished edit. Editing a product in Studio writes to an unpublished
  draft first, same as any Sanity document. `/preview/drops` and
  `/preview/drops/[slug]` (`src/app/preview/`) render the exact same view
  components (`src/components/drops/`) but call `sanityFetch` with
  `perspective: "drafts"`, so they show that live edit **before** you click
  Publish — the actual "no batch-sync delay" proof point. It's a genuinely
  separate route tree, not a cookie flag on the same URL, so which one you're
  looking at is always visible in the address bar (plus a standing amber
  banner on every `/preview/*` page).
- **Visual Editing: click-to-edit and drag-and-drop.** Studio's **Presentation**
  tool (`sanity.config.ts`) opens `/preview/drops/[slug]` in an iframe.
  `/preview/*` fetches with `stega: true` (client configured with
  `stega.studioUrl: '/studio'` in `src/sanity/lib/live.ts`), so title,
  editorial copy, and other plain-text fields are click-to-edit automatically —
  verified by inspecting the response for the invisible Content Source Map
  characters Sanity embeds, not just assumed. The product list
  (`src/components/drops/PreviewProductList.tsx`) additionally carries explicit
  `data-sanity` attributes plus Presentation Tool's `useOptimistic` hook, so an
  editor can **drag products into a new order directly in the preview** — no
  separate "reorder" UI in the form. Drag-and-drop specifically needs a live
  connection to Studio, so it only works inside the Presentation Tool iframe —
  not on a standalone `/preview/*` browser tab, which still shows the same
  draft content, just without the drag handles.
- **"Just for you" spotlight, reorderable two ways.** `productSpotlight`
  (`src/sanity/schemaTypes/`) is a block type mixed into `editorialStory`'s
  portable text array alongside regular paragraphs — insert one via the `+`
  menu in the story field. It can be reordered either:
  - **In the Structure tool's story field**, via the block editor's own drag
    handle (native Studio behavior). Sanity's Portable Text editor has a
    long-standing limitation here: you can't drop a block into the empty
    space *past* the last element — there needs to be something to drop
    it *onto*. Drag the block that's currently last up above the spotlight
    instead of dragging the spotlight all the way down, if it won't land.
  - **In Presentation Tool**, the same way the product list is reorderable —
    `src/components/drops/PreviewStoryContent.tsx` wraps every story block
    (paragraphs included) with `data-sanity` and `useOptimistic`. This drag
    is computed from the live rendered preview page rather than Studio's
    internal editor DOM, so dropping at the very bottom works reliably there.
  The frontend (`src/components/drops/ProductSpotlight.tsx`) fills the block
  with one in-stock, priced product picked at random from the whole catalog
  on every render — nothing to configure per-drop. It's fetched with a plain
  one-off client call (`src/sanity/lib/spotlight.ts`), deliberately outside
  Sanity Live's tag-tracking — the pick is random regardless, so it doesn't
  need live updates, and keeping it off the page's live-tracking surface
  reduces load on Presentation Tool's comlink connection specifically (see
  the comlink heartbeat note below).
- **Custom document action.** `capsuleDrop` documents get a "Notify wholesale"
  button (`src/sanity/components/NotifyWholesaleAction.tsx`, wired up via
  `document.actions` in `sanity.config.ts`) alongside the default Publish/
  Delete actions — enabled only once the drop is actually published. A
  standing example of extending Studio's action bar for a custom step in the
  launch workflow; `onHandle` is a placeholder (a real integration would post
  to a webhook or send an email from there).

## Demo script (Act 1 / 2 / 3)

**Before you start:** run `npm run seed`, run the app with `npm run build &&
npm run start` (see [§4](#4-run-it) for why not `dev`), then open three
browser tabs side by side — `/studio` (logged in), the public drop page at
`/drops/autumn-reverie-x-wilder-row`, and the preview of the same drop at
`/preview/drops/autumn-reverie-x-wilder-row`.

### Act 1 — one shared model

1. In Studio, open **Capsule Drops → Autumn Reverie x Wilder Row**. Point out
   that the editorial story and the six linked products live in the same
   document — no separate CMS, no separate PIM.
2. Switch to the public storefront tab. Show the drop page rendering the story
   and product list together, on a site that looks like the rest of
   marloweandfinch.com — this is the customer-facing result of that one
   document.

### Act 2 — the readiness block (the key moment)

1. Back in Studio, scroll to the **Readiness** field on the drop document. It's
   already red: *"Umber Wide-Leg Trouser" is missing a price* and *"Copper Knit
   Vest" is marked "pending."*
2. Try to **Publish**. Studio blocks it and shows the same two validation
   errors, pointing at the `products` field.
3. Open **Products → Copper Knit Vest** (in the same tab, or a third tab).
   Change **Availability status** from `Pending` to `In stock` and let it
   autosave.
4. Switch back to the drop document tab — no refresh. Watch the readiness panel
   update live: one issue left (the missing price).
5. Open **Umber Wide-Leg Trouser**, add a price (e.g. `238`), let it autosave.
6. Switch back to the drop tab again: readiness flips to green, **Ready to
   publish**.
7. Switch to the **preview** tab (`/preview/drops/...`): the same two products
   update from "Pending" / "Price unavailable" to in-stock with a real price —
   within a couple of seconds, live, no redeploy, no click-through publish.
   Point at the URL bar and the standing amber banner — this is a distinctly
   different address than the public site, which is what a stakeholder
   previewing the change would see before it's live to customers.
8. Switch to the **public** tab and refresh: still shows the old, stale data.
   That gap — draft vs. published — is exactly the coordination point the
   prospect's batch-synced stack couldn't give them.

### Act 3 — publish

1. Back in Studio, click **Publish**. It goes through this time.
2. Switch to the public storefront tab and refresh: now shows the resolved,
   in-stock, correctly-priced page — no preview mode needed anymore.

## Known fragile points (and how to rehearse around them)

- **Live-panel timing.** The readiness panel and storefront both update within
  a couple of seconds via `client.listen()` / Sanity's Live Content API, not
  instantly. Narrate through the couple-second gap rather than clicking twice —
  don't undersell it as literally instant.
- **Three-tab setup.** The "fix it in Studio, watch it clear in the readiness
  panel, watch preview update while public stays stale" beat depends on all
  three tabs (Studio, public, preview) staying open. Open and arrange all
  three before you start talking, not mid-sentence.
- **Preview and public are different URLs, not a toggle.** If a tab is
  showing stale data, check whether it's actually on `/drops/...` (published)
  vs. `/preview/drops/...` (drafts) — they're separate pages, not the same
  page in two modes.
- **Autosave delay.** Studio autosaves field edits after a short debounce.
  Click outside the field (or tab away) after typing a price so the edit
  actually commits before you switch tabs.
- **If live editing misbehaves on stage,** fall back to the pre-seeded, fully
  ready **"Golden Hour x Marlowe Studio"** drop to show the clean end state
  without live-editing anything.
- **Resetting mid-rehearsal.** If anything gets into a weird state, `npm run
  seed` puts both drops back to their scripted starting state in a few
  seconds.
- **Refresh Studio after a reseed or schema change if you had it open.** An
  open Studio tab reactively autosaves (via `readinessStatus`/
  `publishedState`'s live-computed fields) whenever the products it's watching
  change — including right after a reseed. If that tab's client-side bundle
  still has the *previous* schema loaded, its portable text editor can
  silently strip block types it doesn't recognize (like `productSpotlight`)
  the next time it autosaves the story field, discarding content that was
  correct in the dataset a moment earlier. Hard-refresh any open Studio tab
  after `npm run seed` or a schema change, before trusting what's in the
  editor.
- **`npm run build`** requires a real, reachable Sanity project with data —
  the homepage is prerendered at build time. If you reseed or otherwise
  meaningfully change content structure after building, rebuild before the
  demo so the static homepage isn't stale (drop and preview pages are
  server-rendered per-request, so they're always fresh either way).
- **Rebuild after code changes.** `npm run start` serves the last `npm run
  build` output — it will not pick up edits to `.tsx`/`.ts` files until you
  rebuild. If you tweak something right before going on, run `npm run build`
  again.
- **Product photos are real but approximate.** They're genuine Wikimedia
  Commons photography, not generated art — but since the products are
  fictional, a photo is a plausible stand-in for "Ochre Wool Trench," not a
  literal photo of it. Don't zoom in and narrate exact details.
- **`/preview/*` has no access gate.** Anyone who can reach `localhost:3000`
  can view unpublished drafts by navigating there directly — fine for a local,
  single-presenter demo, not something to expose beyond that.
- **Drag-and-drop needs a real pointer and a modern browser.** It isn't
  compatible with touch-only devices, and needs a recent Chrome/Safari/
  Firefox/Edge. Demo it from a trackpad or mouse, not a tablet.
- **Drag-and-drop only works inside the Presentation Tool's iframe** (Studio →
  Presentation tab), not on a standalone `/preview/*` browser tab — the tab
  shows the same draft content, but reordering requires Presentation Tool's
  connection back to Studio.
- **Presentation Tool's comlink connection can be flaky when switching
  between documents** (`[@sanity/comlink] Received no response to message
  'comlink/heartbeat'` in the console, "Could not connect to the preview" on
  screen). This matches a currently-open upstream Sanity issue, not something
  in this project's code — we're already on the latest published
  `@sanity/visual-editing`/`sanity` versions, so there's no upgrade fix
  available yet. The spotlight pick was moved off Sanity Live's tag-tracking
  as a mitigation (Sanity's own report notes this failing more on "heavier"
  pages), but if it still happens: click **"Continue anyway"** on the error
  screen first — the preview and click-to-edit often still work past it — and
  remember the core Act 2 demo doesn't depend on Presentation Tool at all,
  since it runs through a standalone `/preview/*` tab and `<SanityLive/>`
  instead.
