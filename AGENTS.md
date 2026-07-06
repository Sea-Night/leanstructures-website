<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LEAN structures site

Marketing site for LEAN structures, a structural engineering consultancy (Monmouthshire, South East Wales). Migrated from a flat HTML/CSS/vanilla-JS site (still at the old Google-Drive-synced project folder, kept as visual/content reference only — do not build here again, npm chokes on Drive's virtual filesystem with thousands of node_modules files).

## Stack

Next.js 16 (App Router, Turbopack default) + TypeScript + Tailwind CSS v4 (CSS-first config via `@theme` in `app/globals.css`, no `tailwind.config.ts`) + shadcn/ui (Carousel/embla) + `motion` (Framer Motion's current package name — import from `motion/react`) + `vaul` (mobile bottom sheet). No database, no per-request data — everything is static content (project/article arrays), so skip Cache Components/PPR/`cacheComponents` entirely; plain Server Components are enough.

Taste references: Emil Kowalski's motion/interaction craft (maintains Vaul, shadcn-adjacent — meticulous easing, spring physics, sequencing shape-before-content in animations), Anthropic's own product design (restrained color, generous whitespace, careful typography) as a vibe, not literal cloning.

## Next.js 16 gotchas that bit us / matter here

- `params` and `searchParams` are **fully async** now (Promise-only, no sync fallback) — always `await` them, and use the generated `PageProps<'/route/[slug]'>` helper type.
- `html { scroll-behavior: smooth }` is no longer auto-overridden during route transitions — add `data-scroll-behavior="smooth"` to the root `<html>` tag (in `app/layout.tsx`) to keep in-page anchor links (`#contact`) smooth, matching the old static site's behavior.
- `next/image` defaults changed: `qualities` is `[75]` only, `minimumCacheTTL` is 4 hours. Fine as-is for this site's mostly-static photography.
- Environment: Node.js and Git were not preinstalled on this machine when this project started. If a PowerShell command can't find `node`/`npm`/`git`, prepend `$env:PATH += ";C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"` — the tool's shell doesn't persist env vars between calls, so this is needed on every command that shells out to them.

## Content model conventions

Follow the "just add one entry to an array" pattern the original static site used (`js/articles.js`) — keep content additions trivial for a non-developer to eventually hand off to Claude:

- `lib/projects.ts` — typed `Project[]` array (slug, title, meta, bento `size` hint, `status`, optional `externalLink`, `coverImage`, `images[]` mixing photos/drawings, `structuralNotes` prose). See the approved migration plan for the full shape.
- `lib/articles.ts` — typed article list + `app/articles/[slug]/page.tsx` for the bespoke editorial template (Fraunces + IBM Plex Mono, ported from the two existing static article pages).
- PDF architectural drawings are exported to PNG **once, offline** (not rendered at runtime) into `public/images/projects/<slug>/drawings/` — mirrors what was already manually done for `ExplodedAxo.jpg` in the source project folder.

## Deployment

- GitHub: https://github.com/Sea-Night/leanstructures-website (main branch, force-pushed over old static-site upload/delete history on 2026-07-06 with user confirmation).
- Vercel project: `cknight-8080s-projects/leanstructures-site`, deployed via `npx vercel` (CLI login, not git-connected yet — the auto-link to GitHub failed with "add a Login Connection to your GitHub account first"; connecting GitHub in Vercel account settings would enable auto-deploy-on-push, currently a manual `vercel`/`vercel --prod` redeploy is needed instead).
- Live preview: https://leanstructures-site.vercel.app
- The user is retiring an old Wix site; DNS/domain cutover from Wix to this Vercel deployment is a **separate, explicitly-confirmed-later step** — never touch DNS or the live Wix site without direct sign-off in the moment.
