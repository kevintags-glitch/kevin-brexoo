# Move Brexoo to new GitHub, Supabase and Vercel accounts

## Context
The founder wants Brexoo on accounts dedicated to it. They chose:
- **GitHub:** a new account, with a **private** repo. Today the code is in the **public** repo `kevintags-glitch/kevin-brexoo`, plus old public copies `kevin-brexoo1` and `brexoo`.
- **Supabase:** a new account. Connected here today is the Cleons org, whose free plan is full (lovioo, cleeons-dev).
- **Vercel:** a new account. Today the live site `kevin-brexoo-z2ya.vercel.app` runs on an account that isn't connected here. The `kevin-2313` account is connected but has no Brexoo project.
- **Old copies:** archive them and delete later.

Facts that make this simpler:
- **No hosted database data to migrate.** Brexoo has never had a hosted Supabase project; all data so far is local demo data. The new Supabase project is built fresh from the 16 migrations in `supabase/migrations/`, which also seed templates, plans and the collector sources.
- **The git history moves intact** by pushing every branch and tag to the new repo.
- **The settings the app needs** are in `lib/env.ts` and `process.env` usages:
  - public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`
  - secret: `SUPABASE_SECRET_KEY`, `RATE_LIMIT_SALT`, `JOBS_TOKEN`, `COLLECTOR_TOKEN`
  - optional: `RESEND_API_KEY`, `NOTIFICATIONS_FROM`
- **Auth URLs** in `supabase/config.toml` are local only. The hosted project needs the Site URL and Redirect URLs set in its dashboard.

## Step 1: what the founder does (accounts and connections only, about 20 min)
1. **GitHub:**
   - Create the new account (or use it if it exists).
   - Create an **empty private repo**, e.g. `brexoo`, with no README.
   - On claude.ai, connect that GitHub account and install the Claude GitHub App on the new repo, so this session can push to it.
2. **Supabase:** create the new account. On claude.ai (Settings → Connectors), **reconnect the Supabase connector to the new account**.
3. **Vercel:**
   - Sign up for the new account **with the new GitHub account**, so Vercel can see the private repo.
   - Reconnect the Vercel connector to the new account.
4. **Tell me** "accounts ready" and the new repo name, e.g. `newaccount/brexoo`.

## Step 2: GitHub (me)
- `add_repo` the new repo with push access.
- In `/home/user/brexoo`, add the remote `new` and run `git push new --all` and `git push new --tags`. Compare the latest commit on both remotes.
- Keep `origin` until the switch-over is verified, then make `new` the default.
- Replace hard-coded old URLs with the new site URL once Vercel gives it (`grep -rn "kevin-brexoo"`):
  - `collector/README.md` (BREXOO_API_URL)
  - `collector/brexoo_collector/http.py` (User-Agent)
- Commit and push those changes to the new repo.

## Step 3: Supabase (me, via the Supabase connector on the new account)
1. **Create the project:** `create_project`, named `brexoo`. Region **ap-southeast-2 (Sydney)**, since customers start in Australia; latency for US and NZ is acceptable.
2. **Database:** apply all 16 migrations **in filename order** with `apply_migration`.
3. **Check:**
   - `list_tables` and `get_advisors` (security and performance).
   - `execute_sql` spot checks: `service_categories` count is 15, `platform_sources` has 6 rows.
4. **Demo accounts are NOT loaded in production.** `scripts/seed-demo.sql` creates logins with a known password. Each business can still load sample data from the app.
5. **Connection details:** read the project URL and publishable key with `get_project_url` and `get_publishable_keys`.
6. **The founder copies the secret key** from Supabase → Project Settings → API keys straight into Vercel (step 4). It is never pasted in chat.
7. **Sign-in URLs:** the founder sets these in the Supabase dashboard (Authentication → URL Configuration), because the connector can't change auth settings. I'll give the exact values:
   - Site URL = the new Vercel URL
   - Redirect URLs = `https://<new-site>/**`

## Step 4: Vercel (me, via the Vercel connector on the new account)
1. **Create the project** from the new GitHub repo with `create_project` (framework `nextjs`, branch `main`).
2. **Settings I add** with `create_project_env` (Production and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `RATE_LIMIT_SALT` and `JOBS_TOKEN`: random values I generate and send straight to Vercel, never shown in chat.
3. **Settings the founder adds** in Vercel → Settings → Environment Variables:
   - `SUPABASE_SECRET_KEY`
   - `COLLECTOR_TOKEN`: a long random value they choose, also needed in GitHub.
4. **Deploy** with `create_deployment` and follow the build with `get_deployment` and `list_deployment_events` until it's READY. Fix any build error in the repo and push.
5. **Site URL:** set `NEXT_PUBLIC_SITE_URL` to the final production URL and redeploy if it changed.

## Step 5: GitHub Actions (founder, about 2 min)
In the new repo → Settings → Secrets and variables → Actions, add:
- `BREXOO_API_URL` = the new site URL
- `COLLECTOR_TOKEN` = the same value as in Vercel
- optional: `SOCRATA_APP_TOKEN`

CI and the Project Data Collector workflow are already in `.github/workflows/` and move with the code.

## Step 6: Verify (me, with the founder for one sign-up)
- **Website:** `web_fetch_vercel_url` on `/`, `/pricing`, `/how-it-works`, `/leads/builders/au/new-south-wales/sydney`, `/sitemap.xml`, `/manifest.webmanifest` and `/media/brexoo-stairs.mp4`, all 200.
- **Workspace:** `/login` shows the sign-in form, not the "workspace isn't connected" notice.
- **Founder sign-up:** the founder signs up with a real email, confirms it, completes onboarding and opens the dashboard. I watch the logs with `get_runtime_errors`, and Supabase logs for auth errors.
- **Collector:** the founder runs the workflow with **dry run** ticked; I read the job summary, then they run it for real. Discover then shows "Brexoo sources".
- **CI:** the first CI run in the new repo is green; I check it with the GitHub tools.

## Step 7: Old copies (after the new site is verified)
- **Founder, in GitHub:** make `kevintags-glitch/kevin-brexoo`, `kevin-brexoo1` and `brexoo` **private**, then **Archive** them (Settings → General → Danger Zone).
- **Founder, in the old Vercel account:** leave `kevin-brexoo-z2ya.vercel.app` running for a week as a fallback, then delete the project.
- **Me:** remove the old `origin` remote locally. I'll remind the founder about the deletions; I won't delete anything myself.

## Out of scope, noted for later
- **Notification emails:** the outbox job (`/api/jobs/notifications`, `JOBS_TOKEN`) has no schedule yet. It needs either a Vercel Cron or a GitHub Actions schedule, and Resend (`RESEND_API_KEY`) is needed to send emails.
- **Sign-up emails:** Supabase's default email sender is rate-limited. Before launch, set up custom SMTP (e.g. Resend) for sign-up emails.
- **Custom domain:** e.g. brexoo.com, added in Vercel later.
