# Brexoo

The growth and next-project platform for builders and service businesses: capture enquiries from an approved landing page, qualify them with an explainable fit score, follow up, book appointments and record outcomes, all in one tenant-isolated workspace.

This repository implements the **"Build this first" journey** from the Brexoo product and engineering blueprint:

> sign up → configure business and services → approve landing page → receive enquiry → manage CRM record → assign follow-up → book appointment → record outcome

plus the marketing site, Xoo AI (read-only, grounded) and the visitor chat assistant.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript (strict) · Tailwind CSS v4 · Motion · Supabase (Postgres, Auth, Storage, RLS) · Zod · Vitest · Playwright.

A modular monolith: one app, feature modules under `features/`, every tenant rule enforced twice (server code *and* row-level security).

## Run it locally

Needs Node 22+ and Docker.

```bash
npm install
npx supabase start          # Postgres, Auth, Storage and a mail catcher on :54324
cp .env.example .env.local  # paste the URL and publishable key printed by `supabase status`
npm run dev                 # http://localhost:3000
```

Sign-up sends a real confirmation email; open it in the mail catcher at http://127.0.0.1:54324.

## Tests

| Command | What it checks |
| --- | --- |
| `npm run db:test` | 51 database assertions: tenant isolation (cross-tenant reads, writes, ID substitution, composite-key references), anonymous access, onboarding and page state machines, publish-needs-approval, enquiry validation, dedupe, rate limits, activity history |
| `npm test` | Unit tests: fit and confidence scoring, time zones across daylight saving, money, visitor assistant guardrails, Xoo AI writers (do-not-contact refusal, prompt-injection text treated as data) |
| `npm run test:e2e` | The full builder journey in a browser against a production build and the local stack, plus access-control checks |
| `npm run lint` / `npm run typecheck` / `npm run build` | Static checks |

CI (`.github/workflows/ci.yml`) runs all of them on every pull request.

## Code map

```
app/(marketing)/       Public site: home, how it works, builders, trades, AI, managed services, pricing, demo, legal
app/(auth)/            Log in, sign up, verify, password reset
app/app/setup          Create the organisation (owner membership is created in the same transaction)
app/app/(workspace)/   The builder workspace: overview, enquiries, opportunities/[id], pipeline, tasks,
                       appointments, contacts, landing pages (+ editor), reports, Xoo AI, settings
app/p/[slug]           Published builder landing page with progressive enquiry form and visitor chat
app/api/jobs/notifications   Notification outbox worker (token-protected)
features/              Domain logic and server actions: onboarding, landing-pages, crm, xoo-ai, visitor-chat, auth, workspace
config/                Industry templates (15 verticals, Appendix A questions) and plan entitlements: the source of truth
supabase/migrations/   Schema, RLS, RPCs; the templates/plans migration is generated from config/
supabase/tests/        Database tests
components/            Design system (ui/), brand, marketing, app and public-page components
```

## How the important rules are enforced

- **Tenant isolation.** Every tenant table has `organization_id`, RLS policies using `is_org_member()`, a trigger that stops rows moving between organisations, and composite `(id, organization_id)` foreign keys so a record can't point at another tenant's record. Anonymous callers have no table privileges at all; public reads and enquiry submission go through two `SECURITY DEFINER` functions that resolve the business only from a *published* page.
- **Server-side authority.** `requireOrg()` picks the active organisation from the user's own memberships; no organisation ID from the browser is trusted.
- **Publishing.** Page status changes only through RPCs. A submission snapshots the draft into an immutable version; only an owner can approve; publishing requires an approved version and respects the plan's page limit.
- **Enquiries are never lost.** The enquiry, contact, project, opportunity, follow-up task and activity are written in one transaction; notifications go to an outbox processed separately with retries.
- **Explainable fit.** `features/crm/fit.ts` shows each factor and its reason, reports confidence separately, never infers budgets, and won't call a record a strong fit when most evidence is unknown.
- **AI safety.** Xoo AI uses a short allowlist of read-only, tenant-scoped tools and deterministic, cited writers; drafts are returned for a person to send. The visitor assistant answers only from approved FAQs, services and areas, refuses prices, availability and licensing questions, and confirms with the visitor before creating an enquiry.
- **Consent and opt-out.** Consent text and time are stored with each enquiry. Do-not-contact blocks drafts and outreach logging, and is audited.

## Environment variables

See `.env.example`. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are required. `SUPABASE_SECRET_KEY` + `JOBS_TOKEN` enable the notification worker; `RESEND_API_KEY` enables email delivery.

## Deploying

1. Create a Supabase project and apply `supabase/migrations` (`npx supabase link && npx supabase db push`).
2. In Supabase Auth settings set the Site URL and add `https://<your-domain>/auth/callback` to redirect URLs; configure SMTP for production email.
3. Deploy to Vercel (or similar) with the environment variables above.
4. Schedule `POST /api/jobs/notifications` every minute with `Authorization: Bearer $JOBS_TOKEN`.

## Not built yet (deliberately)

Per the blueprint's phasing, these have seams but no implementation: sourced project discovery and the credit ledger, the Brexoo operations workspace and admin console, Stripe checkout and webhooks, Gmail/Microsoft mailbox sync, calendar provider sync, and a model-backed Xoo AI (the provider adapter is ready; adding a paid AI key needs founder approval). See `docs/known-limitations.md`.
