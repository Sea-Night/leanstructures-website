<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LEAN structures site

Marketing site for LEAN structures, a structural engineering consultancy (Monmouthshire, South East Wales). Migrated from a flat HTML/CSS/vanilla-JS site (still at the old Google-Drive-synced project folder, kept as visual/content reference only — do not build here again, npm chokes on Drive's virtual filesystem with thousands of node_modules files).

## Stack

Next.js 16 (App Router, Turbopack default) + TypeScript + Tailwind CSS v4 (CSS-first config via `@theme` in `app/globals.css`, no `tailwind.config.ts`) + shadcn/ui (Carousel/embla, currently unused after the Phase 6 bento redesign but left installed) + `motion` (Framer Motion's current package name — import from `motion/react`). No database, no per-request data — everything is static content (project/article arrays), so skip Cache Components/PPR/`cacheComponents` entirely; plain Server Components are enough.

Taste references: Emil Kowalski's motion/interaction craft (maintains Vaul, shadcn-adjacent — meticulous easing, spring physics, sequencing shape-before-content in animations), Anthropic's own product design (restrained color, generous whitespace, careful typography) as a vibe, not literal cloning.

## Next.js 16 gotchas that bit us / matter here

- `params` and `searchParams` are **fully async** now (Promise-only, no sync fallback) — always `await` them, and use the generated `PageProps<'/route/[slug]'>` helper type.
- `html { scroll-behavior: smooth }` is no longer auto-overridden during route transitions — add `data-scroll-behavior="smooth"` to the root `<html>` tag (in `app/layout.tsx`) to keep in-page anchor links (`#contact`) smooth, matching the old static site's behavior.
- `next/image` defaults changed: `qualities` is `[75]` only, `minimumCacheTTL` is 4 hours. Fine as-is for this site's mostly-static photography.
- Environment: Node.js and Git were not preinstalled on this machine when this project started. If a PowerShell command can't find `node`/`npm`/`git`, prepend `$env:PATH += ";C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"` — the tool's shell doesn't persist env vars between calls, so this is needed on every command that shells out to them.

## Content model conventions

Follow the "just add one entry to an array" pattern the original static site used (`js/articles.js`) — keep content additions trivial for a non-developer to eventually hand off to Claude:

- `lib/projects.ts` — typed `Project[]` array (slug, title, meta, `size` hint — a legacy field from the retired Phase 3 grid, no longer used by the mosaic but harmless to keep, `status`, optional `externalLink`, `coverImage`, `images[]` mixing photos/drawings, `structuralNotes` prose).
- `lib/articles.ts` — typed article list. Each article is its **own named route** under `app/articles/<slug>/page.tsx` (not a dynamic `[slug]` catch-all) — the two existing articles are structurally too different (one a simple text template, one an elaborate scroll-driven diagram) to share one generic template. `app/articles/opening-a-load-bearing-wall/page.tsx` is the rich editorial one (Fraunces + IBM Plex Mono); `app/articles/example-article/page.tsx` is the simple placeholder template — copy whichever is the better starting point for a new article.
- PDF architectural drawings are exported to PNG **once, offline** (not rendered at runtime) into `public/images/projects/<slug>/drawings/` — mirrors what was already manually done for `ExplodedAxo.jpg` in the source project folder.

## Projects page: randomized photo mosaic (`components/bento/*`)

`app/projects/page.tsx` renders `<MosaicGrid projects={PROJECTS} />` — a randomized bento-style photo grid, **not** one-tile-per-project. Replaced an earlier one-tile-per-project version (retired; don't resurrect the old `BentoGrid`/`BentoTile`/`ProjectDetailPanel`/`ProjectGallery`/`MobileProjectDrawer`/`vaul` approach if you see references to it in old commits/plan docs — the user asked for a materially different design and this is the current, intended one).

- `lib/bento-tiling.ts` — `generateTiling`/`generateTilingWithBudget`: recursive guillotine/BSP splitting of an R×C grid into random 1×1–4×4 rectangles with **zero gaps/overlaps by construction**. `generateTilingWithBudget` sweeps a `stopBias` (variety ↓ as attempts proceed) to guarantee the tile count fits within a photo-pool budget — this existed to fix a real bug (duplicate photos in one page) caught via a throwaway `tsx` stress-test script, not just theoretical.
- `lib/bento-pool.ts` — flattens every project's photos into one pool (excluding zero-photo "coming soon" projects), and `takePage` walks a shuffled cursor through it so pages are visually distinct until the whole pool is shown, then reshuffles. Capped so **one page can never repeat a photo**, even under a tight budget.
- `components/bento/use-mosaic-page.ts` — orchestrates tiling + pool + a history stack (Prev replays exactly, Next generates fresh or replays a redo tail).
- `components/bento/use-grid-dimensions.ts` — breakpoint tiers 7×5 down to a 1×3 floor; `use-floor-scale.ts` takes over below the floor with a measured `transform: scale()` (deliberately NOT combined with fluid `%`-based grid sizing — that combo breaks layout since `transform` doesn't affect box size; the floor tier uses fixed pixel dimensions specifically so the scale math stays deterministic).
- `components/bento/ExpandedProjectView.tsx` — click a tile, it grows to ~2/3 of a lightbox-style overlay (anchored to whichever horizontal half it was nearer, or top on mobile) via a shared Framer `layoutId`; the other ~1/3 is a highlight-colored text panel. Clicking the photo again crossfades to the next photo in that project.
- If you touch the tiling algorithm, re-run a stress test across many (rows, cols) combos before trusting it — `assertValidTiling` runs automatically in dev but only checks the shape it's given, not that pagination fed it a sane budget.

## Deployment

- GitHub: https://github.com/Sea-Night/leanstructures-website (main branch, force-pushed over old static-site upload/delete history on 2026-07-06 with user confirmation).
- Vercel project: `cknight-8080s-projects/leanstructures-site`, deployed via `npx vercel` (CLI login, not git-connected yet — the auto-link to GitHub failed with "add a Login Connection to your GitHub account first"; connecting GitHub in Vercel account settings would enable auto-deploy-on-push, currently a manual `vercel`/`vercel --prod` redeploy is needed instead).
- Live preview: https://leanstructures-site.vercel.app
- The user is retiring an old Wix site; DNS/domain cutover from Wix to this Vercel deployment is a **separate, explicitly-confirmed-later step** — never touch DNS or the live Wix site without direct sign-off in the moment.
