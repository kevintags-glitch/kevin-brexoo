# Known limitations and next steps

Recorded per blueprint §20.5 ("known limitations") and §23.1 ("technical debt register").

| Area | Today | Next step |
| --- | --- | --- |
| Onboarding review | Automated check of activation essentials, recorded as a `system` actor. | Route `submitted` to the Brexoo team's review queue (ops workspace) and record a `staff` actor. |
| Page internal review | Pages go Draft → Awaiting approval (owner) → Approved → Published. The `internal_review` status exists but isn't used. | Insert Brexoo quality review before owner approval once the ops workspace exists. |
| Email notifications | Outbox + worker + Resend adapter. Without `RESEND_API_KEY` notifications are marked `skipped`. | Add the provider key, verify the sending domain, schedule the worker. |
| Calendar | Appointments are internal records with time zone, status and audit; `provider_event_id` is reserved. | Google or Microsoft 365 OAuth adapter (one provider for MVP). |
| Mailbox sync | Not built. Outreach is drafted for people to send from their own email and logged manually. | OAuth mailbox connection with minimal scopes (§11.2). |
| Billing | Plans and entitlements are data; limits are enforced for pages, seats and Brex AI. No payments. | Stripe Checkout + verified, idempotent webhooks as source of truth (§14.4). |
| Brex AI | Deterministic and grounded; allowlisted read-only tools; monthly usage budget. | Optional model-backed provider behind the same tool allowlist, after founder approval and an evaluation set. |
| Visitor chat usage | Not metered (anonymous visitors can't write usage rows). | Meter server-side in the submission path. |
| Brand assets bucket | Public-read (logos and approved images are shown on public pages); writes restricted to members' own folder. | Separate private bucket for non-public attachments with signed URLs. |
| Discovery, credits, ops workspace, admin console | Not built (blueprint phases 8–9). | Validate the first permitted data source before building. |
| Legal pages | Drafts marked for counsel review. | Jurisdiction-specific review before launch. |
| Monitoring | Structured errors surface in server logs. | Add Sentry (or equivalent) and alerting on failed jobs. |
