# VOWORA — Implementation Plan

> Premium Global Wedding Experience & Planning SaaS
> Status: Phase 4 (Events, Guests & Secure Invitations) complete & verified → Phase 5 (RSVP & Guest Experience) next
> Branding is **configurable** (`platform_settings`); "VOWORA" is a working name only.

This plan covers the **entire** platform described in the Master Project Prompt (§1–§30).
Nothing is scoped down to a demo. Every feature is assigned to a phase with acceptance
criteria. Integrations that are not yet configured are explicitly marked **PENDING** and
must never be presented as working.

---

## 1. Product Summary

VOWORA is a two-sided wedding platform:

1. **Self-service SaaS** — couples create, customize and publish a cinematic digital
   wedding invitation + full wedding website, then manage guests, events, RSVPs, budget,
   seating, vendors, venues and wedding-day operations from one dashboard.
2. **Custom Design Service** — couples request a professionally designed wedding website
   (`custom_orders`), fulfilled by the internal team via the admin panel.

**Signature experience:** a luxury, cinematic, envelope-opening digital invitation shared
via WhatsApp, with a personalized secure link per guest, dynamic Open Graph preview,
animated wax seal + envelope reveal, and a smooth transition into the wedding website.

**Markets:** Pakistan, India, UAE, UK, USA + international. Multi-language (English, Urdu
with RTL), multi-currency, multi-timezone, multi-tradition (configurable events).

---

## 2. Guiding Principles

- **Security first.** Supabase RLS on every table; public/guest data served only through
  `SECURITY DEFINER` RPCs that validate a slug or unguessable token and return authorized
  fields only. Guests are **not** authenticated users and can never read another guest's
  data by changing a URL/ID.
- **Real data only.** No mock data masquerading as production data. Configuration seed
  (templates, plans, categories) is real, admin-editable config — not fake customers,
  reviews, stats or testimonials.
- **Configurable integrations.** Email, payments, AI, maps, analytics use adapter
  interfaces with provider selection via env/admin. Unconfigured = clearly PENDING.
- **Premium, original design.** Three distinct-but-consistent design systems: marketing,
  customer dashboard, admin. Mobile-first, accessible, RTL-ready. No placeholder buttons,
  no fake social proof.
- **Type-safe & tested.** Strict TypeScript, Zod at every boundary, Vitest + RTL unit,
  Playwright E2E. Typecheck/lint/build/test gate each phase.
- **Maintainable modules.** Feature-folder architecture (§26 of master prompt).

---

## 3. Tech Stack (stable, compatible versions)

| Layer | Choice | Version (pin at scaffold) | Notes |
|---|---|---|---|
| Framework | Next.js App Router | 15.x | React Server Components, Route Handlers, Server Actions |
| UI lib | React | 19.x | Compatible with Next 15 |
| Language | TypeScript | 5.x | `strict: true` |
| Styling | Tailwind CSS | 3.4.x | Stable shadcn/ui pairing |
| Components | shadcn/ui + Radix | latest primitives | Accessible, owned source |
| Animation | Framer Motion | 11.x | Envelope/cinematic experience |
| Backend DB | Supabase / PostgreSQL | 15+ | Managed Postgres, Auth, Storage, Realtime |
| Supabase SSR | `@supabase/ssr`, `@supabase/supabase-js` | 0.5.x / 2.x | Cookie-based App Router auth |
| Forms | React Hook Form | 7.x | |
| Validation | Zod | 3.x | Shared client/server schemas |
| i18n | next-intl | 3.x | App Router, English + Urdu RTL |
| OG images | `next/og` (ImageResponse) | built-in | Dynamic WhatsApp/social previews |
| QR | `qrcode` | 1.5.x | Guest link + gallery upload QR |
| Drag & drop | `@dnd-kit/core` + sortable | 6.x / 8.x | Section reorder, seating planner |
| Charts | Recharts | 2.x | Budget + RSVP analytics |
| CSV | Papa Parse | 5.x | Guest import/export, reports |
| Dates/TZ | date-fns + date-fns-tz | 3.x / 3.x | Timezone-correct events |
| Email | Resend (adapter) | 4.x | **PENDING** until API key configured |
| Payments | Provider adapter (Stripe intl; PK options TBD) | — | **PENDING** eligibility verification |
| AI | Provider adapter (OpenAI-compatible/Anthropic) | — | **PENDING**, server-side only |
| Maps | Google Maps (embed + JS API) | — | **PENDING** API key |
| Analytics | PostHog | 1.x | **PENDING** project key |
| Unit test | Vitest + @testing-library/react | 2.x / 16.x | |
| E2E | Playwright | 1.x | |
| Lint/format | ESLint 9 + Prettier | 9.x / 3.x | |
| Deploy | Vercel + Supabase | — | **PENDING** project linkage |

> Exact patch versions are pinned in `package.json` at scaffold time and locked with a
> committed lockfile. No unstable/RC versions.

---

## 4. Complete Feature Inventory → Phase Mapping

Every master-prompt requirement is listed and mapped. **No feature is dropped.**

### Marketing & Identity (§2, §22, §27)
- Configurable branding (name, logo, palette, fonts) — **Phase 1**
- Marketing site: Home, Features, Templates, Template details, Pricing, How It Works,
  About, Contact, FAQ, Blog, Login, Register — **Phase 1 (shell + core pages)**, Blog
  content management **Phase 8**
- Homepage hero, live invitation demo, template previews, feature sections, how-it-works,
  pricing, FAQ, CTAs; real testimonials only — **Phase 1–2**, demo **Phase 3**
- SEO, accessibility, performance — **Phase 8** (baked in throughout)

### Auth, Accounts & Security (§25)
- Supabase Auth (email/password, magic link, OAuth optional) — **Phase 1**
- RBAC: platform roles + wedding member roles — **Phase 1**
- RLS on all tables; secure RPCs for public/guest — **Phase 1 (foundation), per-feature**
- Rate limiting, audit logs, secure env, file validation — **Phase 1 + ongoing**
- Account deletion + data deletion workflows — **Phase 1 (foundation), finalized Phase 8**
- Invitation revocation, guest privacy — **Phase 4**

### Customer Dashboard (§19)
- Full navigation (Overview, My Weddings, Website Builder, Invitation Designer, Events,
  Guests, Invitations, RSVP, Gallery, Budget, Vendors, Venues, Seating, Checklists, AI,
  Settings, Subscription & Billing) — **Phase 1 shell**, modules fill in per phase
- Overview widgets (active projects, publication status, invitations, RSVP stats, upcoming
  events, budget, pending tasks) — **Phase 1 (real queries)**, enriched later

### Super Admin (§20)
- Secure separate panel; customers, weddings, templates, published sites, subscriptions,
  payments, custom orders, vendor approvals, venues, support, reports/analytics, platform
  settings, admin activity logs; role-based permissions — **Phase 1 foundation**, modules
  per phase

### Wedding Website Builder (§4)
- Template selection, live preview, section customization, color/font customization,
  drag-and-drop reorder, add/edit/delete sections, photo/video upload, background music,
  mobile/desktop preview, draft, publish/unpublish, custom URL/domain, SEO + social
  metadata — **Phase 2**
- 15 sections (Hero, Couple intro, Family intro, Story, Events, Countdown, Venue, Photo
  gallery, Video gallery, Dress code, Invitation message, RSVP, Gift registry, Wishes,
  Contact) enable/disable/reorder — **Phase 2** (RSVP/Gallery/Wishes/Registry render hooks
  wired; data modules in Phases 5/7)

### Signature Invitation Experience (§3) — **HIGHEST PRIORITY**
- WhatsApp Open Graph preview (couple names, date, elegant cover, title, personalized URL,
  refresh on design change) — **Phase 3**
- Envelope opening: full-screen luxury envelope, initials, wax seal, "You Are Cordially
  Invited", tap-to-open, seal break animation, envelope open, card reveal, particles/floral/
  cinematic effects, smooth transition to website — **Phase 3**
- 10 premium themes, each with envelope/card/typography/palette/decor/background/animation/
  identity — **Phase 3**
- Customization (envelope/card, names/initials, wording, colors/gradients, fonts, wax seal,
  decor, animation, music, intro message, photos, event artwork) + live preview — **Phase 3**
- Animation/perf: React+TS+CSS+Framer Motion, mobile+desktop, optimized assets, no autoplay
  music (user gesture + play/pause), reduced-motion respect, low-end perf, graceful
  fallback, accessible content — **Phase 3**

### Events (§5)
- Standard + unlimited custom events (Engagement, Dholki, Mayun, Mehndi, Nikah, Baraat,
  Walima, Reception, After Party, custom) within subscription limits — **Phase 4**
- Per event: name, description, date, start/end, timezone, venue, address, Google Maps,
  cover image, dress code, instructions, event-specific guest list + RSVP — **Phase 4**

### Guests (§6)
- Individuals, families/groups; name, phone, email, group, category, max attendees, notes,
  event permissions, invitation status; CSV import/export; search/filter/sort; resend/
  revoke — **Phase 4**
- Personalized secure invitation link per guest; event-level authorization; never expose
  private guest info publicly — **Phase 4**

### RSVP & Attendance (§7)
- Accept/Decline/Maybe; event-wise confirmation; attendee count within limit; optional
  message; dietary preferences (if enabled) — **Phase 5**
- Dashboard: total invited, accepted, declined, pending, expected attendees, event-wise,
  family-wise, response history; export reports — **Phase 5**

### WhatsApp & Delivery (§8)
- WhatsApp native share links, copy link, QR generation, email invitations, preview, status
  tracking, resend, personalized links — **Phase 4–5**
- WhatsApp Business Platform only later via official APIs/templates/verified credentials;
  never claim automated delivery unless configured — **PENDING / future**

### Budget Planner (§9)
- Total/event-wise/category-wise budgets, expense tracking, paid/pending, remaining, alerts,
  vendor payment tracking, reports, CSV/PDF export, charts — **Phase 7**

### Venue Discovery (§10)
- Filter by city/location/type/capacity/indoor-outdoor/parking/catering/facilities/price/
  photos/contact; enquiry + booking status; estimated vs verified clearly distinguished —
  **Phase 7**

### Vendor Marketplace (§11)
- 10 categories; profiles, portfolio, photos/videos, packages, locations, price ranges,
  reviews, enquiries, quote comparison, booking status, contact; admin review/manage; no
  fake reviews/profiles — **Phase 7**

### AI Wedding Assistant (§12)
- Planning, budget suggestions, scheduling, invitation wording, WhatsApp messages, decor
  ideas, checklists, vendor comparison, recommendations, guest communication drafts;
  authorized data only; protect guest info; server-side keys; configurable provider —
  **Phase 7** (**PENDING** provider key)

### Seating & Table Planner (§13)
- Create tables, capacity, assign guests, group families, VIP flags, move guests, occupancy,
  printable chart, export — **Phase 7**

### Gallery & Memory Wall (§14)
- Couple photos/videos, guest uploads via QR, wishes, memory wall, couple approval before
  publish, image moderation, privacy controls, download permissions; public/private/
  invitation-only — **Phase 5 (gallery/wishes)**, guest QR uploads + moderation **Phase 7**

### Destination Wedding Manager (§15)
- Hotels, room allocation, guest accommodation, travel info, airport pickup, transport,
  guest itinerary, travel instructions, important contacts — **Phase 7**

### Wedding-Day Command Center (§16)
- Live schedule, vendor arrival status, decoration/catering readiness, task assignments,
  responsible members, emergency contacts, schedule updates, announcements, delay
  notifications; scoped team access — **Phase 7**

### Checklist & Timeline (§17)
- Pre-wedding, event prep, vendor bookings, clothing/shopping, invitations, venue prep,
  wedding-day, custom tasks; deadlines, completion, reminders; custom checklists —
  **Phase 7** (basic tasks may land early; full module Phase 7)

### Gift Registry & Wishes (§18)
- Registry, item list, optional gift links, guest wishes, private/public messages, couple
  visibility control; never force purchase — **Phase 7** (wishes Phase 5)

### Subscription & Monetization (§21)
- Configurable plans (Free, Starter, Premium, Luxury, Custom Design); admin-configurable
  pricing/limits; secure checkout, payment records, renewals, upgrade/downgrade, cancel,
  webhooks, failed-payment handling, invoice history; never trust browser payment status;
  PK + international providers after eligibility verification — **Phase 6** (**PENDING**
  provider)

### Internationalization (§2)
- English + Urdu RTL; international dates/times/currencies; cultural/religious configurable
  events — **Phase 1 (framework)**, Urdu content + RTL polish **Phase 8**

---

## 5. Phased Roadmap

Each phase ends with: typecheck + lint + build + tests green, docs updated, and a phase
report (implemented / files / migrations / working integrations / pending config / tests /
next-phase remainder). **Do not advance until the current phase is checked.**

### Phase 1 — Foundation
**Status: COMPLETE & VERIFIED** (typecheck, lint, 27 unit tests, `db:check` migration/RLS suite,
production build, and browser smoke test all pass). Migrations shipped as `0001`–`0009`;
see the Phase 1 report in `README.md`. Live Supabase credentials and optional integrations
remain **PENDING** and are marked honestly in the UI.
**Goal:** runnable, secure skeleton with auth, database, design system, both dashboards.
- Scaffold Next.js 15 + TS strict + Tailwind + shadcn/ui + Framer Motion + next-intl.
- Tooling: ESLint 9, Prettier, Vitest, Playwright, lockfile, `.env.example`, README.
- Supabase clients (browser/server/middleware), session refresh middleware.
- Design system: tokens, branding provider, primitives, layout, loading/empty/error states.
- Migrations: `profiles`, `platform_settings`, `weddings`, `wedding_members`, `templates`,
  `wedding_themes`, `wedding_sections`, `subscription_plans`, `plan_feature_limits`,
  `subscriptions`, `admin_activity_logs`, `notifications`; enums; helper functions;
  triggers; RLS; storage buckets + policies.
- Auth: sign up/in/out, magic link, password reset; RBAC guards; protected route groups.
- Customer dashboard shell + overview (real queries) + wedding creation entry.
- Admin shell + role guard + customer/template/plan management foundation + activity log.
- Marketing shell: Home, Pricing, Login, Register, Features (core), layout/nav/footer.
- Account/data deletion foundation (soft-delete + request workflow).
**Acceptance:** new user registers → profile auto-created → sees dashboard → creates a
wedding (real DB row, RLS-enforced) → admin (seeded role) sees it in admin panel.
Typecheck/lint/build/test pass. No secret in source. Unconfigured integrations listed.

### Phase 2 — Wedding Website Builder
**Status: COMPLETE & VERIFIED** (typecheck, lint, 49 unit tests, `db:check` incl. public RPC,
production build, and browser/curl smoke tests pass). Migration `0010_public_rpc.sql` added;
see the Phase 2 report in `README.md`. The live authenticated builder flow and media upload are
**PENDING** Supabase credentials and are documented honestly (logic + RLS validated via PGlite).
- Wedding CRUD, template selection, theme assignment.
- Section engine: 15 section types, enable/disable/reorder (dnd-kit drag-and-drop + keyboard +
  arrow fallback), add/edit/delete.
- Customization: colors, fonts, wording, photos/videos (validated upload to private
  `wedding-media` + published-gated `/api/media` proxy), music, SEO/social metadata.
- Live preview (mobile/desktop), draft save, publish/unpublish, slug-based public URL.
- Public renderer `/w/[slug]` via `get_published_wedding` RPC (public fields only); true 404 for
  unpublished/missing.
**Acceptance:** couple builds a multi-section site, previews, publishes; anonymous visitor
loads `/w/[slug]` seeing only public content; unpublished returns 404; RLS blocks edits by
non-members. *(Acceptance logic verified via PGlite + unconfigured-path browser tests; the
end-to-end authenticated run requires live Supabase credentials — PENDING.)*
**Carried forward:** custom-domain routing (Phase 8/deployment); Events/RSVP/Gallery/Wishes/
Registry data modules (Phases 4/5/7) — render hooks already wired.

### Phase 3 — Premium Invitation Experience (signature)
**Status: COMPLETE & VERIFIED** (typecheck, lint, 73 unit/component tests incl. 5 envelope tests,
`db:check` through `0011`, build, OG PNG + 404/auth smoke). See the Phase 3 report in `README.md`.
The live authenticated designer flow and guest-facing envelope on a published wedding are
**PENDING** Supabase credentials; `/i/[token]` resolution and theme plan-tier gating arrive in
Phases 4 and 6 respectively.
- 10 themes with envelope/card/typography/palette/decor/animation identity.
- Envelope sequence (initials → wax seal → tap → seal break → open → card reveal →
  particles/floral → transition), Framer Motion, 3D depth/shadows.
- Reduced-motion + graceful fallback + accessibility; no autoplay music; play/pause.
- Invitation Designer (customization + live preview) in dashboard.
- Dynamic OG image route (`next/og`) with couple names/date/title; refresh on design change.
- Personalized invitation URL scaffolding `/i/[token]` (token issuance finalized Phase 4).
- WhatsApp share message + link from real couple data.
**Acceptance:** guest opens link → cinematic envelope → card → website; WhatsApp/social
scrape shows correct dynamic OG preview; reduced-motion users get accessible static path;
low-end mobile smooth; music only after gesture.

### Phase 4 — Events, Guests & Secure Invitations
**Status: COMPLETE & VERIFIED** (typecheck, lint, 144 unit/component tests, `db:check` through
`0013` incl. token-isolation/revocation/limit assertions, build, production 404/auth/OG smoke).
See the Phase 4 report in `README.md`. Migrations shipped as `0012`–`0013`. The live authenticated
flow (add guests → issue → deliver → guest opens personalized site) and email sending are
**PENDING** Supabase / Resend credentials; RSVP capture arrives in Phase 5.
- Event CRUD (standard + custom, timezone-correct, maps, cover, dress code, instructions).
- Guest CRUD, groups/families, categories, max attendees, notes, CSV import/export,
  search/filter/sort.
- `guest_events` authorization; secure per-guest invitation tokens (unguessable, revocable,
  expiry); resend/revoke; status tracking.
- Delivery: WhatsApp native share, copy link, **local** QR (token never sent to a 3rd-party QR
  service), email invitation (Resend if configured).
**Acceptance:** Guest A sees only authorized events; changing token/ID never leaks another
guest; revoked token rejected; CSV round-trips; subscription guest/event limits enforced.

### Phase 5 — RSVP & Guest Experience
- Event-wise RSVP (accept/decline/maybe), attendee count within limit, message, dietary.
- `submit_rsvp` secure RPC; response history.
- Attendance dashboard (totals, event-wise, family-wise, expected attendees) + exports.
- Countdown, maps embed, gallery + guest wishes rendering on public site.
**Acceptance:** guest RSVPs only for authorized events within attendee limit; dashboard
stats correct & real-time-ish; over-limit rejected; reports export.

### Phase 6 — Business System
- Configurable plans + feature limits enforced server-side.
- Payment adapter (provider selectable); secure checkout; **webhook-verified** status;
  records, renewals, upgrade/downgrade, cancel, failed handling, invoices.
- Admin subscription/payment management; custom design orders workflow.
**Acceptance:** subscription state changes only via verified webhook/server logic, never
browser; limits enforced; invoice history accurate. Provider marked PENDING until keys +
eligibility confirmed; manual/record-only mode works without a live gateway.

### Phase 7 — Advanced Planning Features
- Budget planner (charts, alerts, vendor payments, CSV/PDF export).
- Vendor marketplace (profiles, portfolio, packages, reviews, enquiries, quotes, bookings;
  admin approval; no fake data).
- Venue discovery (filters, enquiry/booking, estimated vs verified labeling).
- AI assistant (server-side adapter, authorized-data-only, guest privacy).
- Seating planner (dnd, capacity, VIP, occupancy, printable, export).
- Destination manager (hotels, rooms, travel, itinerary, contacts).
- Wedding-day command center (live schedule, readiness, assignments, announcements, delays;
  scoped team access; Realtime).
- Checklists/timeline + reminders; gift registry; guest QR gallery uploads + moderation.
**Acceptance:** each module CRUD + RLS + exports work; AI never leaks guest data and keys
stay server-side; command center realtime updates scoped to authorized members.

### Phase 8 — Quality & Launch
- Security testing (RLS penetration, token guessing, webhook forgery, IDOR, rate limits).
- Responsive + low-end device testing; performance optimization (images, animation, bundle).
- SEO audit; accessibility audit (WCAG AA); Urdu RTL polish + translations.
- Deployment to Vercel + Supabase; production docs; runbooks; backup/restore.
- Blog content management; final marketing polish (real testimonials only).
**Acceptance:** production deploy green; security/accessibility/perf checklists passed;
docs complete; all PENDING integrations either configured or clearly documented as optional.

---

## 6. Project Structure (per master prompt §26)

```
src/
  app/
    (marketing)/        # home, features, templates, pricing, how-it-works, about, contact, faq, blog
    (auth)/             # login, register, reset, callback
    dashboard/          # customer dashboard (protected)
    admin/              # super admin (protected, role-guarded)
    w/[slug]/           # public published wedding website
    i/[token]/          # personalized secure invitation experience
    api/                # route handlers (og, webhooks, rsvp, ai, exports, qr)
  components/
    ui/                 # shadcn primitives
    builder/            # website + invitation builder
    dashboard/          # dashboard widgets/shell
    invitations/        # envelope, wax seal, card, themes
    shared/             # layout, nav, states, branding
  templates/            # luxury-gold, emerald-luxury, traditional, modern-minimal, ...
  features/             # weddings, events, guests, invitations, rsvp, billing, budget,
                        # vendors, venues, gallery, seating, checklist, ai, destination,
                        # command-center, registry, admin
  lib/
    supabase/           # browser, server, middleware, admin clients
    validations/        # Zod schemas (shared)
    utils/              # tokens, csv, dates, currency, formatting
    integrations/       # email, payments, ai, maps, analytics adapters
  hooks/
  types/
  i18n/                 # next-intl config + messages (en, ur)
  styles/
supabase/
  migrations/           # ordered SQL migrations
  seed.sql              # config seed (templates, plans, categories) — not fake users
docs/
  implementation-plan.md
  system-architecture.md
  database-schema.md
.env.example
README.md
```

---

## 7. Environment Variables / Integration Matrix

All secrets server-side only. `.env.example` ships with **placeholders**, never real keys.

| Variable | Purpose | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required (user supplies) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS-gated) | Required (user supplies) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client | Required, **never** client-exposed |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (links/OG) | Required |
| `DATABASE_URL` | Migration/CLI connection | Required for migrations |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email | **PENDING** |
| `PAYMENTS_PROVIDER` + provider keys | Checkout/webhooks | **PENDING** (eligibility) |
| `AI_PROVIDER` + `AI_API_KEY` | AI assistant | **PENDING** |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Maps | **PENDING** |
| `NEXT_PUBLIC_POSTHOG_KEY` / `HOST` | Analytics | **PENDING** |
| `RATE_LIMIT_*` / Upstash Redis (optional) | Rate limiting | Optional/configurable |

**Rule:** any integration without configured credentials renders a clear "not configured"
state and is reported as PENDING. No fabricated success.

---

## 8. Testing Strategy

- **Unit (Vitest + RTL):** utils (token generation, currency/date, CSV), Zod schemas,
  components, hooks, RLS-helper logic where testable.
- **Integration:** Supabase local (Docker) for migration + RLS policy tests; RPC behavior
  (published wedding, invitation token, RSVP limits, IDOR attempts).
- **E2E (Playwright):** register→create wedding→publish→guest open→RSVP golden path;
  admin guard; invitation envelope interaction; reduced-motion path.
- **Security tests:** token unguessability/revocation, cross-guest IDOR, webhook signature
  forgery, RLS bypass attempts, rate limiting.
- **Gates:** `typecheck`, `lint`, `build`, `test` must pass before each phase report.

---

## 9. Security Checklist (master prompt §25)

- [x] RLS enabled on every table (design in database-schema.md)
- [x] RBAC platform + wedding roles
- [x] Secure auth (Supabase), SSR cookie sessions, middleware guards
- [x] Server-side Zod validation on all mutations
- [x] Protected admin routes (role guard, server-side)
- [x] Unguessable invitation tokens (≥128-bit entropy), revocation, expiry
- [x] Public/guest data via SECURITY DEFINER RPCs only (no broad anon table access)
- [ ] Rate limiting (auth, RSVP, token lookup, AI, webhooks) — Phase 1 foundation + per phase
- [x] Private storage buckets + signed URLs; file type/size validation
- [ ] Payment webhook signature verification — Phase 6
- [x] Audit logs (admin + sensitive mutations)
- [x] Secure env handling; no secrets in source/client
- [x] Guest data privacy; invitation revocation
- [ ] Account/data deletion workflow — foundation Phase 1, finalized Phase 8

---

## 10. Risk Register

| Risk | Mitigation |
|---|---|
| Pakistani payment provider eligibility (Stripe not universal) | Adapter pattern; verify merchant eligibility before claiming support; record-only/manual fallback |
| WhatsApp OG preview caching/staleness | Correct dynamic OG metadata; refresh endpoint; cache-busting on design change |
| Low-end mobile animation perf | Framer Motion lazy transform/opacity only; reduced-motion; graceful fallback; asset optimization |
| Guest data leakage via IDOR | Token-scoped SECURITY DEFINER RPCs; no anon table reads; security tests |
| Scope creep / unstructured build | Strict 8-phase gates; phase reports; no advancing until checked |
| Fake data temptation | Config-only seed; real testimonials/reviews gated on existence |
| Urdu RTL complexity | next-intl + logical CSS properties; RTL audit Phase 8 |

---

## 11. Definition of Done (per phase)

1. All phase acceptance criteria met with **real** DB operations.
2. `typecheck` + `lint` + `build` + `test` green.
3. RLS/security verified for new tables/RPCs.
4. Loading/empty/error states present; responsive + accessible.
5. Docs updated; `.env.example` reflects new vars.
6. Phase report written: implemented, files, migrations, working integrations, pending
   config, tests performed, next-phase remainder.

---

## 12. Immediate Next Action

Proceed to **Phase 5 — RSVP & Guest Experience**: event-wise RSVP (accept/decline/maybe) with
attendee counts bounded by each guest's `guest_events` authorization, message and dietary capture,
a `submit_rsvp` `SECURITY DEFINER` RPC keyed by the invitation token, and response history.
Attendance dashboard (totals, event-wise, family-wise, expected attendees) with exports. Render
countdown, maps embed, gallery and guest wishes on the public site. Guests must only RSVP for
authorized events within their attendee limit; over-limit submissions rejected server-side. Then
verify and report before advancing.