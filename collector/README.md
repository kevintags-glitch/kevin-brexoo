# Brexoo Project Data Collector

Collects project information from **approved sources**, removes personal details, and sends it to
Brexoo. Brexoo keeps one central pool and gives every business its own private copy of the
projects that match its services and service areas. They appear in **Discover** labelled
"Brexoo · {source}", with a notification. Homeowner enquiries from outside tools arrive through
**inbound links**, usually from a Make.com scenario.

```
GitHub Actions (every 6 h) ─ python -m brexoo_collector run --all
   ├─ fetch from official APIs only ─ normalise ─ classify ─ strip personal details
   └─ POST /api/collector/ingest ─ upsert into the pool ─ copy to matching businesses ─ notify

Make.com scenario (Facebook Lead Ads, Google Forms, Hipages…)
   └─ POST /api/inbound/enquiries/{key} ─ same pipeline as landing-page enquiries
```

## Sources

| Key | Source | Kind | Licence | Personal details | Contact rule |
|---|---|---|---|---|---|
| `nsw-planning-da` | NSW Planning Portal, online DA and CDC data API | Planning applications | CC BY 4.0 | Applicant and owner fields dropped | Not permitted |
| `austender-construction` | AusTender OCDS API, contract notices with UNSPSC 72 | Awarded contracts, listed as subcontract opportunities | CC BY 3.0 AU | Contact points dropped; supplier business named | Not permitted |
| `austin-permits` | City of Austin Open Data (Socrata `3syk-w9eu`) | Issued building permits | City open-data terms | Contractor and owner fields dropped | Not permitted |
| `chicago-permits` | Chicago Data Portal (Socrata `ydr8-5enu`) | Issued building permits | City terms of use | Contact fields dropped | Not permitted |
| `nyc-permits` | NYC Open Data, DOB NOW approved permits (Socrata `rbx6-tga4`) | Approved permits | NYC Open Data terms | Applicant, owner and filing rep dropped | Not permitted |
| `nz-gets-tenders` | NZ GETS notice feed (RSS/Atom) | Open tenders | GETS terms | Buyer contacts scrubbed from text | Not permitted. **Switched off** until the official feed URL and terms are confirmed. |

Rules every source follows:
- **Official APIs and feeds only.** No website is scraped.
- **Every record keeps its source,** observed date, licence and link.
- **No personal details.** Fields naming people, emails and phone numbers are removed before
  anything is stored, and contact clauses are scrubbed from free text (`privacy.py`).
- **No marketing contact.** Contacting people found in public registers for marketing is not
  permitted. Businesses see "Contact not permitted by source" on these records.

Field names follow each API's published schema. When a source is first enabled, check it with a
**dry run** (below) before relying on it.

## Running

```bash
pip install "./collector[dev]"
python -m brexoo_collector list-sources

# Dry run: fetch and normalise, send nothing (prints the first record of each source).
python -m brexoo_collector run --all --dry-run

# Offline, from saved responses (what the tests use).
python -m brexoo_collector run --all --dry-run --fixtures collector/tests/fixtures

# Against a local Brexoo (next start with COLLECTOR_TOKEN set, plus SUPABASE_SECRET_KEY).
BREXOO_API_URL=http://localhost:3000 COLLECTOR_TOKEN=local-collector-token \
  python -m brexoo_collector run --all --fixtures collector/tests/fixtures

# Re-collect one source from a date.
python -m brexoo_collector run --source nsw-planning-da --since 2026-11-01

pytest -q collector/tests
```

Each source resumes where it left off: Brexoo stores a cursor per source (the latest observed
date). Re-sending a record is safe, because Brexoo upserts by (source, id). An unchanged record
only refreshes "last seen", and a changed one updates every business copy while keeping each
business's own status (saved or dismissed).

## Schedule (GitHub Actions)

`.github/workflows/collector.yml` runs every 6 hours. It can also be run from the **Actions** tab,
with an optional source, start date or dry run.

**One-time setup:**
1. **Vercel** (project `kevin-brexoo` → Settings → Environment Variables): add `COLLECTOR_TOKEN`
   (any long random string) and `SUPABASE_SECRET_KEY`, then redeploy.
2. **GitHub** (repo → Settings → Secrets and variables → Actions):
   - **Secrets:** `BREXOO_API_URL` = `https://kevin-brexoo-z2ya.vercel.app`, and `COLLECTOR_TOKEN` = the same value as on Vercel.
   - **Optional secret:** `SOCRATA_APP_TOKEN` (raises US open-data rate limits).
   - **Optional variable:** `GETS_FEED_URL`, once the GETS feed is confirmed.
3. Run the workflow by hand with **dry run** ticked, and check the job summary table.

Until the secrets exist, scheduled runs finish with a notice instead of failing.

## Adding a source

1. Add a connector in `brexoo_collector/sources/`. Subclass `Source` and implement
   `fetch_pages`, `items_from_page` and `normalise`. The module docstring records the source URL,
   licence and permitted use.
2. Register it in `sources/registry.py`.
3. Add a row to `platform_sources` in a migration, with the same key, its licence, permitted use
   and default contact permission.
4. Save a real-shaped response under `tests/fixtures/<key>/`, and add tests to `tests/test_sources.py`.
   Include a personal field, to prove it's dropped.

**Approved data providers** (licensed feeds) don't need code. Write a JSON config (see
`sources/provider_feed.py`), register its key in `platform_sources` with the contact permission
the licence allows, then run `--provider path/to/config.json`.

## Inbound leads from Make.com

In Brexoo, go to **Settings → Integrations → Inbound leads** and create a link. It's shown once.
In Make:
1. Use your lead source as the trigger.
2. Add an HTTP **Make a request** module: method POST, the link as the URL, body type JSON.
3. Map at least the name, a message, an email or phone, and `"consent": true`.

A blueprint to start from is at `public/templates/make-inbound-enquiry.json`.

Accepted fields:
- **Name:** `name` (or `first_name` + `last_name`)
- **Contact:** `email`, `phone`
- **Project:** `message` or `description`, `suburb`, `city`, `postcode`, `category_code`
- **Consent:** `consent`, `consent_text`
- **Other:** `channel`, `answers`

Responses:
- `201` with a reference: created.
- `200` with `"duplicate": true`: the same lead within 24 hours, linked to the first.
- `400`: missing fields or no consent.
- `401`: the link is unknown or revoked.
- `429`: too many leads in a short time.
