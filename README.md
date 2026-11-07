# VOWORA

**Premium Global Wedding Experience & Planning SaaS.** Create cinematic digital wedding
invitations, build complete wedding websites, manage guests and RSVP, and plan every event —
for Pakistan, India, UAE, UK, USA and international couples.

> "Vowora" is a **working brand name**. Branding is runtime-configurable via the
> `platform_settings` table, so it can change without rewriting the application.

---

## Current status

**Phase 4 — Events, Guests & Secure Invitations: complete and verified.** Phases 1 (Foundation),
2 (Wedding Website Builder) and 3 (Premium Invitation Experience) are also complete. See
[`docs/implementation-plan.md`](docs/implementation-plan.md) for the full 8-phase roadmap, and the
Phase 4 + Phase 3 + Phase 2 + Phase 1 reports at the bottom of this file.

What works today:

- Marketing website (home, features, templates, pricing, how-it-works, about, faq, contact, blog).
- Authentication (register, login, password reset, email callback) via Supabase Auth.
- Customer dashboard foundation (overview, my weddings, create wedding, settings) and honest
  "arriving in Phase X" status pages for modules not yet built.
- **Wedding Website Builder** — 15 section types, drag-and-drop reorder (dnd-kit) with keyboard
  + arrow fallback, section add/edit/delete/enable, color/font/message/music design, template
  selection, mobile/desktop live preview, SEO metadata, publish/unpublish, and photo/video upload.
- **Signature cinematic invitation** — a luxury sealed envelope with an animated wax-seal break,
  card reveal and four animation variants (classic-reveal, soft-fade, petal-drift, cinematic-zoom),
  ambient particles, gesture-gated background music, and a static reduced-motion path. Driven by
  the 10 seeded themes and fully overridable per wedding.
- **Invitation Designer** (`/dashboard/weddings/[id]/invitation`) — theme gallery, couple names +
  monogram, envelope/card colors, fonts, wax-seal style, card border, animation, intro message and
  music, with a **live preview using the real envelope component** (replayable). Persists to
  `weddings.invitation_config` via validated, RLS-enforced server actions.
- **Public wedding website** `/w/[slug]` served through a `SECURITY DEFINER` RPC (public fields
  only), wrapped in the envelope experience, with theme palette, Urdu RTL, SEO/Open Graph metadata
  and a true 404 for unpublished or missing weddings. Uploaded media is served by a published-gated
  proxy (never a public bucket).
- **Dynamic Open Graph image** (`/api/og`) — an elegant couple-names cover for WhatsApp/social
  link previews, cache-busted on publish; WhatsApp share helper.
- **Events** (`/dashboard/weddings/[id]/events`) — ceremonies (Mehndi, Nikah, Baraat, Walima,
  reception, engagement, custom) with date/time/timezone, venue, address, maps link, dress code,
  cover image and instructions; chronological ordering; server-side plan-limit enforcement;
  elegant public rendering on the wedding site.
- **Guests** (`/dashboard/weddings/[id]/guests`) — guest list with categories, groups/families,
  VIP flag, seats, dietary preferences and notes; per-guest **event authorization** (which
  ceremonies they may see/RSVP, with per-event seat caps); search/filter/sort; **CSV import**
  (all-or-nothing, plan-cap pre-check) and **CSV export**; soft delete that invalidates links.
- **Secure invitations** (`/dashboard/weddings/[id]/invitations`) — per-guest **unguessable
  capability tokens** (256-bit CSPRNG, base64url), issue/reuse/regenerate/revoke, optional expiry
  and open caps, delivery + open tracking. Delivery via **WhatsApp deep-link** (personalized,
  phone-targeted), **copy link**, **locally-generated QR** (the token never leaves the device to a
  third-party QR service) and **email via Resend** (honest PENDING until configured). The
  personalized route `/i/[token]` resolves through the `get_invitation` `SECURITY DEFINER` RPC,
  greets the guest by name, shows only their authorized events, and returns a true 404 for any
  invalid/revoked/expired/exhausted token. OG previews are keyed by public slug — never the token.
- Super-admin dashboard foundation (customers, weddings, templates, subscriptions, activity log).
- English + Urdu with full RTL layout switching.
- Database schema through migration `0013`, Row Level Security, storage buckets and configuration seed.

What is **pending** (clearly marked in the UI, never faked): live Supabase credentials, email,
payments, AI, Google Maps and analytics. The app renders the marketing site without any of these;
the dashboard, auth, builder/designer mutations and media upload require a configured Supabase project.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions), React 19, TypeScript (strict) |
| Styling | Tailwind CSS 3.4, shadcn/ui (owned source), Radix UI, Framer Motion 11 |
| Backend | Supabase — PostgreSQL, Auth, Storage, Realtime |
| Data access | `@supabase/ssr` cookie sessions; RLS on every table; `SECURITY DEFINER` RPCs for guests |
| Forms/validation | React Hook Form + Zod (shared schemas) |
| i18n | next-intl (without i18n routing), English + Urdu RTL |
| Testing | Vitest + Testing Library, Playwright (e2e), PGlite migration validation |
| Deployment | Vercel + Supabase |

---

## Prerequisites

- Node.js 20+ (tested on 24).
- A Supabase project (free tier is fine) **or** the Supabase CLI for local development.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
# Leave optional integrations empty — they stay honestly PENDING until configured.

# 3. Apply the database schema (choose one)
#    Hosted project:
supabase link --project-ref <your-ref>
npm run db:push
#    Local stack:
supabase start
npm run db:reset

# 4. Run
npm run dev
```

Open http://localhost:3000. The marketing site renders immediately; sign in to access the dashboard.

> No Supabase CLI installed? `npm run db:check` still validates every migration against an
> embedded Postgres (PGlite) and runs RLS/trigger smoke tests — no live project required.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit suite |
| `npm run test:e2e` | Playwright end-to-end |
| `npm run db:push` / `db:reset` | Apply migrations via Supabase CLI |
| `npm run db:check` | Validate migrations + RLS with embedded Postgres (no Supabase needed) |
| `npm run format` | Prettier |

---

## Project structure

```
src/
  app/
    (marketing)/        Public website
    (auth)/             Login, register, password flows
    dashboard/          Customer dashboard (weddings/[id]/builder + invitation designer)
    admin/              Super-admin dashboard
    w/[slug]/           Public published wedding website (envelope experience)
    i/[token]/          Personalized secure invitation (get_invitation RPC, guest greeting)
    api/                Route handlers (auth callback, media proxy, dynamic OG image)
  components/
    ui/                 shadcn/ui primitives (owned)
    dashboard/ admin/ shared/ invitations/   (envelope, wax seal, particles, music, gate)
  features/             auth, weddings (builder/media/invitation actions + queries), invitations, settings, admin
  lib/                  supabase, validations, env, branding, auth, modules
  i18n/                 request config + en/ur messages
  types/                database types
supabase/
  migrations/           Ordered SQL (0001–0013; 0012 = events/guests/tokens, 0013 = get_invitation RPC)
  config.toml           Local dev config
scripts/
  validate-migrations.mjs   PGlite migration + RLS validation
docs/
  implementation-plan.md system-architecture.md database-schema.md
```

## Database & security

- **RLS on every table**, default deny. Guests/anon never read wedding or guest tables directly —
  only through `SECURITY DEFINER` RPCs that return minimal authorized fields (Phase 2+).
- **Two role dimensions:** platform role (customer/vendor/support/admin/super_admin) and per-wedding
  role (owner/partner/planner/family/viewer) with fine-grained permission overrides.
- **Privilege-escalation guard:** a `BEFORE UPDATE` trigger blocks self-service changes to
  `platform_role`; only privileged server roles or an existing admin may change it.
- **Secrets stay server-side.** The service-role key is imported only in `server-only` modules;
  the anon key is gated by RLS. Secret `platform_settings` keys (`secret_*`) are hidden from anon.
- See [`docs/database-schema.md`](docs/database-schema.md) for the full 52-table design and RLS matrix.

## Design documents

- [`docs/implementation-plan.md`](docs/implementation-plan.md) — feature inventory, roadmap, integration matrix.
- [`docs/system-architecture.md`](docs/system-architecture.md) — auth/RBAC/RLS, invitation pipeline, adapters.
- [`docs/database-schema.md`](docs/database-schema.md) — authoritative schema, RPCs, storage, indexing.

---

## Phase 4 report

**Implemented**

- **Schema** (`0012_events_guests.sql`, `0013_guest_access.sql`): `events`, `guest_groups`,
  `guests`, the `guest_events` authorization junction and `invitations` capability tokens, plus
  `guest_category` / `invitation_status` enums. RLS is default-deny on every table (members read,
  `manage_events` / `manage_guests` / `manage_invitations` permissions write); anon has **no**
  direct access. Server-side `enforce_guest_limit` / `enforce_event_limit` triggers (errcode
  `42501`) and a `validate_guest_event` cross-wedding guard provide defense in depth.
  `get_invitation(p_token)` is a `SECURITY DEFINER` capability check returning only the invited
  guest's name + authorized events; every failure returns `NULL` (no enumeration). It increments
  `use_count` / `last_opened_at` once per request (React `cache()` dedupes metadata + page).
- **Events** (`/dashboard/weddings/[id]/events` + index): full CRUD with validated server actions,
  chronological ordering, timezone-correct display, safe-URL validation (rejects `javascript:` /
  `data:` in maps/cover links), and elegant public event cards on `/w/[slug]` and `/i/[token]`.
- **Guests** (`/dashboard/weddings/[id]/guests` + index): CRUD, groups/families dialog, categories,
  VIP, seats, dietary/notes, per-guest event authorization with seat caps, search/filter/sort,
  hand-written **CSV import** (all-or-nothing with `feature_limit` pre-check) and client-side
  **CSV export**, and soft delete (invalidates the guest's invitation links via the RPC).
- **Secure invitation tokens + delivery** (`/dashboard/weddings/[id]/invitations` + index):
  `generateInvitationToken()` mints 32 CSPRNG bytes → 43-char base64url (256-bit entropy).
  `issueInvitationAction` is idempotent (reuses an active token) with a `regenerate` path that
  revokes-then-mints; optional expiry (end-of-day UTC) and open caps. `revokeInvitationAction`,
  `markDeliveredAction` and `sendInvitationEmailAction` (Resend REST, **honest PENDING** when
  unconfigured, sends only to the guest's own stored address). The manager shows effective status
  (active/revoked/expired/exhausted), delivery channel, opens and last-opened per guest.
- **Delivery UI** (`DeliveryDialog`): personalized **WhatsApp** deep-link (`wa.me/<phone>`,
  digits-normalized), **copy link**, **QR generated in-browser** with the `qrcode` package — the
  token URL is never sent to a third-party QR service — and **email** with a configured/pending
  badge. Email body is HTML-escaped and only emits http(s) links (injection-safe).
- **Personalized public route** `/i/[token]`: resolves via `get_invitation`, greets the guest by
  name on the invitation card, renders only their authorized events, stays `noindex`, and returns
  a true 404 for invalid/revoked/expired/exhausted tokens or unpublished weddings. OG metadata is
  keyed by the **public slug** (never the token), so social previews leak no capability or guest data.

**Verification performed**

- `npm run typecheck` — clean. `npm run lint` — clean.
- `npm test` — **144 unit/component tests pass** (7 token tests incl. uniqueness + shape/probe
  rejection; 13 invitation-delivery validation/status tests; 4 email-template injection tests;
  8 share tests incl. phone normalization + guest greeting; 2 new envelope personalization tests;
  plus the restored Phase 3 designer tests and all earlier suites).
- `npm run db:check` — all migrations `0001`–`0013` apply; checks pass including **anon cannot read
  guests/events/invitations**, member reads own guests but a stranger does not, free-plan event cap
  enforced, cross-wedding `guest_events` rejected, **`get_invitation` reveals only authorized guest
  events**, and **revoked/expired/invalid/unknown tokens return null**.
- `npm run build` — succeeds; 33 routes including `/dashboard/invitations`,
  `/dashboard/weddings/[id]/invitations` and `/i/[token]`.
- Production-server smoke (unconfigured Supabase) — `/` renders (200); `/i/<invalid>` and
  `/i/<short>` return **true 404s** with a generic not-found body (no data leak); `/w/<unknown>`
  404; `/dashboard/invitations` redirects (307) to login with the redirect preserved; `/api/og`
  returns a valid `image/png` branded fallback.

**Working vs pending**

| Capability | Status |
|---|---|
| Events/guests/invitations schema + RLS + limits + `get_invitation` | Implemented & validated (PGlite security assertions) |
| Events CRUD + public rendering | Implemented; typecheck/lint/build/tests verified |
| Guests CRUD + groups + CSV import/export + event authorization | Implemented; typecheck/lint/build/tests verified |
| Token issue/revoke/regenerate + status tracking | Implemented; logic unit-tested |
| WhatsApp / copy / local QR delivery | Implemented (QR rendered on-device, token never leaves to a 3rd party) |
| Email delivery (Resend) | Implemented; **PENDING** `RESEND_API_KEY` + `EMAIL_FROM` — honest pending badge in UI |
| Live authenticated flow (add guests → issue → deliver → guest opens personalized site) | **PENDING** Supabase credentials — cannot be end-to-end browser-tested without a configured project |
| RSVP responses to invitations | Arrives in **Phase 5** (guests can open + view now; RSVP capture next) |

**Remaining issues / notes (carried forward)**

- Authenticated dashboard flows (events/guests/invitations mutations, the delivery dialog, and the
  live personalized guest experience) require a configured Supabase project to browser-test;
  logic, RLS and the public 404/OG paths are verified without one.
- Email is the only delivery channel needing credentials; WhatsApp/copy/QR work with no integration.
  No API keys are invented — Resend stays PENDING until configured.
- `qrcode` was added as a dependency for **local** QR generation specifically to avoid leaking
  capability tokens to external QR APIs. `npm audit` reports transitive advisories in the broader
  tree (pre-existing); review before production deploy.
- Invitations resolve only once the wedding is **published**; the manager warns when a wedding is
  still draft. Theme plan-tier gating remains deferred to Phase 6.
- Migrations are validated with PGlite stubbing Supabase primitives; still run `supabase db push`
  against a real project before production.

**Next:** Phase 5 — RSVP, Gallery & Memory Wall (event-wise RSVP capture against guest
authorizations, photo/video gallery, guest wishes/memory wall with moderation).

---

## Phase 3 report

**Implemented**

- **Cinematic envelope experience** (`src/components/invitations/`): a sealed luxury envelope with
  pocket + liner + flap, an animated wax-seal break (six seal styles), a card reveal with seven
  border styles, and four animation variants. Ambient particles (petals/sparkles) are deterministic
  (index-based) so server and client renders match. Background music is created lazily and **only
  plays after an explicit gesture** — never autoplay. A `useReducedMotion` path skips all animation
  and opens immediately. The website content stays server-rendered (crawlable) beneath the opaque
  envelope via `InvitationGate`.
- **Theme resolution** (`src/features/invitations/theme.ts`): `resolveInvitationTheme` merges a
  seeded `wedding_themes` row with per-wedding overrides into a concrete, serializable theme, with
  elegant defaults so the envelope always renders. Consumes the 10 themes seeded in `0009`.
- **Invitation Designer** (`/dashboard/weddings/[id]/invitation` + `/dashboard/invitation` index):
  theme gallery with palette swatches, couple names + monogram, envelope/card colors, heading/body
  fonts, wax-seal style, card border, animation variant, intro message and music URL — with a
  **live, replayable preview that uses the real `EnvelopeExperience`** (a `contained` mode was added
  without changing public behavior). Validated server actions (`updateInvitationAction`,
  `selectThemeAction`, `updateCoupleAction`) persist to `weddings.invitation_config` / `theme_id` /
  couple fields, all `requireUser` + RLS-enforced. The wedding detail "next step" links to it.
- **Persistence** (`0011_invitation.sql`): adds `weddings.invitation_config jsonb` and extends
  `get_published_wedding` to expose `invitation_config` + `published_at` (public fields only).
- **Public integration**: `/w/[slug]` wraps the website in the envelope experience, resolving theme
  from design colors + invitation overrides, with Urdu RTL. `/i/[token]` is scaffolded (noindex,
  token-format validation, true 404) awaiting the Phase 4 secure-token RPC. WhatsApp share helper
  (`buildInvitationShare`) is wired into the builder's Share card.
- **Dynamic Open Graph image** (`/api/og`, `next/og` ImageResponse): an elegant couple-names/date
  cover for WhatsApp/social previews, cache-busted by `published_at`, with a branded fallback when
  no wedding is resolved. Wired into `/w/[slug]` metadata (Open Graph + Twitter).

**Verification performed**

- `npm run typecheck` — clean. `npm run lint` — clean.
- `npm test` — **73 unit/component tests pass** (9 new invitation-validation tests; 7 theme-resolution
  tests; 3 share tests; **5 envelope component tests** covering sealed render, music no-autoplay,
  opening gesture, reduced-motion immediate open, and contained card reveal + replay).
- `npm run db:check` — all migrations `0001`–`0011` apply; RLS/trigger/RPC/seed checks pass.
- `npm run build` — succeeds; routes include `/dashboard/invitation`,
  `/dashboard/weddings/[id]/invitation`, `/i/[token]` and `/api/og`.
- Browser/curl smoke test — `/dashboard/invitation` and `/dashboard/weddings/[id]/invitation`
  redirect (307) to login with the redirect preserved (auth guard works); `/i/<short>` and
  `/w/<unknown>` return **true 404s**; `/api/og` returns a valid `image/png` (verified PNG magic
  bytes) with zero server errors.
- Envelope browser check (temporary dev harness, since removed) — sealed envelope renders with the
  monogram and couple names, music toggle starts paused with **no `<audio>` element** (no autoplay),
  the website is `aria-hidden` beneath the envelope, clicking advances to the card phase (particles
  activate), and there are **no console errors/warnings** (no hydration mismatch). The full animated
  card transition was additionally verified deterministically via the component tests, because the
  in-app browser's hidden viewport throttles `requestAnimationFrame`.

**Working vs pending**

| Capability | Status |
|---|---|
| Envelope/card/particles/music/theme logic | Implemented & verified (component tests + browser sealed-state) |
| Invitation Designer + persistence actions + RLS | Implemented; typecheck/build/PGlite validated |
| Dynamic OG image | Implemented & browser-verified (valid PNG, unconfigured fallback) |
| Public `/w/[slug]` envelope + metadata | Implemented; 404/metadata path browser-verified |
| Live authenticated designer flow (customize → save → publish → guest opens) | **PENDING** Supabase credentials — cannot be end-to-end browser-tested without a configured project |
| Personalized `/i/[token]` resolution | Scaffolded; secure `get_invitation` RPC + tokens arrive in **Phase 4** |
| Theme plan-tier gating (premium/luxury themes) | Deferred to **Phase 6** (subscriptions); all active themes selectable until then |

**Remaining issues / notes (carried forward)**

- The envelope's full animated transition is best experienced in a visible browser; the hidden
  in-app viewport throttles rAF, so animation completion was verified via component tests rather
  than a live screenshot.
- "Decor" customization is expressed through wax-seal style, card border and animation/particles;
  there is no separate free-form decor editor (the renderer has no such layer).
- Fonts are passed through to the theme; only the bundled display/body fonts are guaranteed to
  render — arbitrary font names fall back to the serif/sans stack.
- Music URLs are user-supplied (http(s) or the media proxy path); playback failures are caught and
  leave the toggle paused. No audio is bundled or invented.
- Migrations are validated with PGlite stubbing Supabase primitives; still run `supabase db push`
  against a real project before production.

**Next:** Phase 4 — Events, Guests & Secure Invitations (ceremonies, guest management, personalized
invitation tokens + `get_invitation` RPC, WhatsApp/QR delivery, event-wise guest lists).

---

## Phase 2 report

**Implemented**

- **Public wedding RPC** (`0010_public_rpc.sql`): `get_published_wedding(p_slug)` is
  `SECURITY DEFINER` with a fixed `search_path`, returns only published, non-deleted weddings
  plus their theme and enabled sections (ordered), and returns `NULL` for draft/missing slugs.
  Execute granted to `anon`/`authenticated` only — no broad anon table reads.
- **Builder data layer**: creating a wedding seeds 13 sensible default sections; server actions
  for design, SEO, template selection, section add/update/delete/reorder and publish/unpublish,
  all `requireUser` + RLS-enforced (non-members cannot edit).
- **Website Builder UI**: tabbed editor (Sections / Design / Template / Preview / SEO & Publish),
  **drag-and-drop reorder via dnd-kit** (pointer + keyboard sensors) with arrow-button fallback,
  section editor dialog, color/font/invitation-message/music design, template cards,
  mobile/desktop live preview, SEO form and publish/unpublish with the public link.
- **Photo/video upload**: validated `uploadMediaAction` writes to the private `wedding-media`
  bucket and records a `media_assets` row; a **published-gated `/api/media/[weddingId]/[asset]`
  proxy** serves objects only to wedding members (preview, even unpublished) or to the public
  once the wedding is published. Hero image, photo gallery and video gallery render on the
  public site; the section editor has upload controls. No public bucket, no IDOR.
- **Public renderer** `/w/[slug]`: theme palette + design colors, Urdu RTL, SEO/Open Graph
  metadata, countdown, and a true HTTP 404 for unpublished/missing weddings.

**Verification performed**

- `npm run typecheck` — clean. `npm run lint` — clean.
- `npm test` — **49 unit tests pass** (13 new media-validation tests: file type/size limits,
  gallery URL parsing, proxy URL building, upload schema).
- `npm run db:check` — all migrations apply; 10 checks pass, including
  "anon reads published wedding; draft/missing return null".
- `npm run build` — succeeds; 33 routes including `/api/media/[weddingId]/[asset]`.
- Browser/curl smoke test — homepage renders (200); `/w/<unknown>` returns a **true 404** with the
  not-found page; `/dashboard/builder` redirects (307) to login with the redirect preserved;
  login form renders; media proxy returns 404 when Supabase is unconfigured, for an invalid UUID,
  and for a path-traversal attempt.
- Fixed a real issue found during verification: a root `loading.tsx` caused `/w/[slug]` to stream
  a 200 + `noindex` instead of a 404. Moved the loading fallback into the dashboard segment so
  public invitation URLs return a correct 404 status.

**Working vs pending**

| Capability | Status |
|---|---|
| Builder logic, RLS, public RPC | Implemented & validated (PGlite) |
| Public renderer + 404 + OG metadata | Implemented & browser-verified (unconfigured path) |
| Drag-and-drop reorder | Implemented (dnd-kit), typecheck/build verified |
| Live authenticated builder flow (create → build → upload → publish → view) | **PENDING** Supabase credentials — cannot be end-to-end browser-tested without a configured project |
| Media upload + public media proxy | Implemented; requires Supabase URL/anon (+ service-role key for the public path). **PENDING** live test |

**Remaining issues / notes (carried forward)**

- Custom **domain** mapping is not wired yet; public URLs are slug-based (`/w/[slug]`). The
  `custom_domain` column exists; domain routing is deferred to deployment (Phase 8).
- Gallery fields store a JSON-encoded URL array inside section content (the content schema
  permits scalar values); the renderer parses it defensively.
- The Events section shows a placeholder until Phase 4; RSVP/Gallery/Wishes/Registry data
  modules arrive in Phases 5/7 (render hooks already wired).
- Migrations are validated with PGlite stubbing Supabase primitives; still run `supabase db push`
  against a real project before production.

**Next:** Phase 3 — Premium Invitation Experience (signature cinematic envelope/wax-seal,
10 themes, Invitation Designer, dynamic OG image, `/i/[token]` scaffolding).

---

## Phase 1 report

**Implemented**

- Project scaffold & tooling: Next.js 15 + TS strict, Tailwind/shadcn design system, ESLint 9,
  Vitest, Playwright, Prettier, security headers, configurable branding.
- Auth & authorization: Supabase cookie sessions, middleware guards, server-side admin role check,
  register/login/reset flows with Zod validation and i18n error keys.
- Customer & admin dashboard foundations with real queries and honest module status pages.
- Marketing website (9 pages) with a Framer Motion hero that respects reduced-motion.
- English + Urdu RTL via next-intl cookie locale.
- Database migrations `0001`–`0009`: extensions, enums, identity, wedding core, billing config,
  helpers/triggers, RLS, storage buckets/policies, configuration seed (10 themes, 4 templates,
  5 plans + feature limits, branding defaults). **No fake users, reviews or statistics.**

**Verification performed**

- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm test` — 27 unit tests pass (validations, slug generation, integration status, module catalog, branding).
- `npm run db:check` — all 8 migrations apply; 9 RLS/trigger/seed checks pass, including
  tenant isolation, anon denial, privilege-escalation prevention and secret-key hiding.
- `npm run build` — succeeds; 27 routes.
- Browser smoke test — homepage renders; `/dashboard` redirects to login; login form renders;
  Urdu toggle switches `dir="rtl"`, `lang="ur"` and translated copy.

**Working vs pending integrations**

| Integration | Status |
|---|---|
| Supabase schema/RLS/storage | Implemented & validated (apply with `db:push`) |
| Supabase live credentials | **PENDING** — add to `.env.local` |
| Email (Resend) | **PENDING** |
| Payments | **PENDING** — provider/merchant eligibility must be verified first |
| AI assistant | **PENDING** |
| Google Maps | **PENDING** |
| Analytics (PostHog) | **PENDING** |

**Remaining for later phases**

- Phase 2: Wedding Website Builder (15 sections, live preview, publish) + public wedding site RPC.
- Phase 3: Signature cinematic invitation (envelope/wax-seal experience, 10 themes, OG previews).
- Phase 4: Events, guests, secure personalized invitations.
- Phase 5: RSVP, gallery & memory wall.
- Phase 6: Subscriptions & billing.
- Phase 7: Budget, vendors, venues, seating, checklists, AI assistant.
- Phase 8: Destination manager, wedding-day command center, hardening, deletion workflows.

**Known limitations**

- Migrations validated with PGlite (embedded Postgres) stubbing Supabase primitives; still run
  `supabase db push` against a real project before production.
- `next lint` is deprecated in Next 16; migrate to the ESLint CLI when upgrading.