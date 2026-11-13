# Brexoo roadmap and status

The 20-step development roadmap and 6-sprint MVP plan from the product board, with what this
repository delivers today. Status: ✅ built and tested · 🟡 partly built (what's missing is listed) · ⬜ not started.

## Development roadmap (20 steps)

| # | Step | Status | Notes |
| --- | --- | --- | --- |
| 01 | Product discovery & requirements | ✅ | Blueprint and product board captured in this repo's docs and README. |
| 02 | Technical design & architecture | ✅ | See [architecture.md](architecture.md). |
| 03 | Brand & UI/UX design system | ✅ | Final brand guide: Midnight Blue, Signal Blue, Growth Teal, Cloud White, Inter; traced logo, app icon, tokens, light/dark. |
| 04 | Repository, CI/CD & environments | 🟡 | CI workflow runs lint, types, unit, DB and e2e tests. Hosted staging/production (Vercel + Supabase) not yet provisioned. |
| 05 | Authentication & access control | 🟡 | Email/password with verification, reset, roles (owner/member), RLS everywhere. MFA for Brexoo staff comes with the ops console. |
| 06 | Organisation & multi-tenancy | ✅ | Tenant isolation enforced server-side and by RLS; composite keys block cross-tenant references; tested. |
| 07 | Industry engine & templates | ✅ | 15 versioned industry templates with qualification questions; per-organisation custom questions. |
| 08 | Public website & marketing pages | ✅ | Home, product, industries, pricing, resources, AI, managed services, demo, legal. |
| 09 | Onboarding & business setup | ✅ | Six-step wizard, state machine with recorded transitions, automated review, activation checklist. |
| 10 | Landing page engine & forms | ✅ | Versioned pages, owner approval, publishing, progressive enquiry form, visitor chat. |
| 11 | Enquiry capture & notifications | 🟡 | Validated, deduplicated, rate-limited capture; durable notification outbox and worker. Email delivery needs a Resend key. |
| 12 | CRM & sales pipeline | ✅ | Leads, contacts, projects, opportunities, Kanban pipeline, tasks, notes, timeline, exports. |
| 13 | Discovery engine & data sources | 🟡 | Source registry with permitted use, CSV import, provenance, freshness, save to CRM. External feeds and a credits ledger come after a source is approved. |
| 14 | Intelligence & matching engine | ✅ | Explainable fit / match % with separate confidence; used on leads and discovered projects. |
| 15 | Xoo AI assistant (v1) | 🟡 | Grounded, read-only summaries, next best action, drafts and briefs with citations and usage budgets. A model provider (Anthropic/OpenAI) plugs into the same tool allowlist once a key is approved. |
| 16 | Communications & email integration | 🟡 | Drafts for human approval, contact log, do-not-contact enforcement. Mailbox OAuth (Gmail / Microsoft 365) not built. |
| 17 | Appointments & calendar integration | 🟡 | Calendar month view, bookings with time zones, statuses, reschedules, overlap checks. Google / Microsoft calendar sync not built. |
| 18 | Billing, plans & usage tracking | 🟡 | Plans and entitlements as data, usage metering and limits. Stripe checkout and webhooks not built. |
| 19 | Team workspace & admin console | 🟡 | Team invites, roles, audit log. Brexoo operations workspace and admin console not built. |
| 20 | Testing, security, pilot & production launch | 🟡 | 62 DB, 39 unit and e2e browser tests. Pilot, monitoring (Sentry) and launch pending hosting. |

## 6-sprint MVP plan (12 weeks)

| Sprint | Scope | Status |
| --- | --- | --- |
| 1 (wk 1–2) Foundation | Setup, repo, Supabase, auth, multi-tenant core, architecture | ✅ (hosting pending) |
| 2 (wk 3–4) Website & onboarding | Marketing site, sign-up, business setup, industry config | ✅ |
| 3 (wk 5–6) Landing & capture | Landing pages, forms, AI chat (visitor), notifications | ✅ (email delivery needs key) |
| 4 (wk 7–8) CRM & pipeline | Contacts, opportunities, Kanban, tasks, activity log | ✅ |
| 5 (wk 9–10) Discovery & Xoo AI | Project discovery MVP, matching, scoring, Xoo AI v1 | 🟡 (CSV sources; model provider pending) |
| 6 (wk 11–12) Bookings, billing & pilot | Calendar, subscriptions, team workspace, UAT and pilot launch | 🟡 (calendar sync, Stripe, pilot pending) |

## Needs accounts or keys (founder decision)

| Service | Used for | Blueprint reference |
| --- | --- | --- |
| Supabase (hosted) + Vercel | Staging and production | §3.3, §22 |
| Resend or Postmark | Notification emails | §3.3, §16.2 |
| Stripe | Subscriptions, setup fees, webhooks | §14.4 |
| Google Calendar or Microsoft 365 | Calendar sync (choose one for MVP) | §11.4 |
| Anthropic or OpenAI | Model-backed Xoo AI behind the existing tool allowlist | §10.4 |
| Sentry | Error monitoring and alerting | §22.3 |
| Trigger.dev (optional) | Durable background jobs; the outbox worker runs on a cron today | §16.2 |
