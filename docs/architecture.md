# Architecture

A modular monolith (blueprint §3.4): one Next.js app, server-side services, Supabase Postgres with
row-level security, and provider adapters for everything external.

```
User experience     Web app (Next.js) · Builder portal · Public builder pages · Team / admin (planned)
        │
Application layer   Auth & access · Discovery · Matching & scoring · CRM & pipeline · Brex AI
                    Scheduling & comms · Billing & plans
        │
Data & processing   PostgreSQL (Supabase, RLS) · Storage (brand assets) · Background jobs (outbox worker)
                    Search & geo (postcode/area matching) · Analytics (reports)
        │
Integrations        Stripe · Google / Microsoft calendar · AI model · Resend · Data sources   (adapters)
```

## Core tables

| Area | Tables |
| --- | --- |
| Tenancy | `organizations`, `profiles`, `memberships`, `invitations`, `audit_events` |
| Configuration | `service_categories`, `industry_templates`, `org_services`, `service_areas`, `org_questions`, `onboarding`, `onboarding_transitions` |
| Pages | `landing_pages`, `landing_page_versions` |
| CRM | `contacts`, `projects`, `enquiries`, `opportunities`, `qualification_records`, `tasks`, `notes`, `appointments`, `activity_events` |
| Discovery | `discovery_sources`, `project_records` |
| Plans & usage | `plans`, `plan_entitlements`, `usage_events` |
| Operations | `notification_outbox`, `rate_limits`, `demo_requests` |

Every tenant table carries `organization_id`, is protected by RLS (`is_org_member` / `is_org_owner`),
cannot change organisation after insert, and references its parents through composite
`(id, organization_id)` keys. Anonymous callers have no table privileges; public pages and enquiry
submission use two `SECURITY DEFINER` functions that resolve the business from a published page.

## Key flows

- **Lead source → AI qualification → CRM pipeline → appointment → proposal → won project**, with each
  step recorded in `activity_events` and sensitive actions in `audit_events`.
- **Discovery**: owner registers a source (type + permitted use) → imports records (CSV) →
  records are matched with the same explainable fit as enquiries → saving creates a project with
  provenance, plus a contact and opportunity only when contact is permitted.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS v4, Motion |
| Backend | Supabase (Postgres, Auth, Storage), RLS, SQL functions |
| Jobs | Notification outbox + token-protected worker route (Trigger.dev-compatible) |
| AI | Grounded rule-based Brex AI v1; provider adapter for Anthropic / OpenAI |
| Email | Resend adapter (key required) |
| Testing | Vitest, Playwright, SQL tests against a local Supabase stack |
| Hosting / monitoring | Vercel + Supabase; Sentry (to provision) |
