import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CircleCheck, Circle, Clock, Funnel, Inbox, Trophy } from "lucide-react";
import { Page } from "@/components/app/PageHeader";
import { AreaChart } from "@/components/app/dash/AreaChart";
import { DataTable, Delta, Panel, PanelHeader, StatCard, StatusPill } from "@/components/app/dash";
import { Avatar, ButtonLink, EmptyState } from "@/components/ui";
import { PLAN_BY_CODE } from "@/config/plans";
import { activationChecklist } from "@/features/onboarding/steps";
import { getFitContext } from "@/features/crm/queries";
import { APPT_TYPE_LABEL, STAGE_BY_ID } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { formatDateTime, formatMoney, formatRelative, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

const DAY = 86_400_000;
const PERIOD = 30;

function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

const hours = (mins: number | null) => (mins === null ? "—" : mins < 60 ? `${Math.round(mins)}m` : mins < 48 * 60 ? `${(mins / 60).toFixed(1)}h` : `${(mins / 1440).toFixed(1)}d`);

export default async function OverviewPage() {
  const ctx = await requireOrg();
  const { supabase, org, user } = ctx;
  const now = Date.now();
  const start = new Date(now - PERIOD * DAY);
  const prevStart = new Date(now - 2 * PERIOD * DAY);
  const inCur = (iso: string) => +new Date(iso) >= +start;

  const [enq, opps, appts, recent, dueTasks, pages, ob, counts, fc, usage, plan] = await Promise.all([
    supabase.from("enquiries").select("id, received_at, first_response_at, status").eq("organization_id", org.id).gte("received_at", prevStart.toISOString()),
    supabase.from("opportunities").select("id, stage, value_minor, closed_at, enquiry_id, appointments(count)").eq("organization_id", org.id),
    supabase.from("appointments").select("id, created_at, starts_at, status, type, opportunity_id, contact:contacts(full_name)").eq("organization_id", org.id).gte("starts_at", prevStart.toISOString()).order("starts_at"),
    supabase
      .from("enquiries")
      .select("id, status, received_at, answers, contact:contacts(full_name, email, phone), project:projects(category_code, location_text, postcode, start_timing, budget_label, details), opportunities!opportunities_enquiry_id_organization_id_fkey(id, stage)")
      .eq("organization_id", org.id)
      .order("received_at", { ascending: false })
      .limit(5),
    supabase.from("tasks").select("id, title, due_at, opportunity_id").eq("organization_id", org.id).eq("status", "open").eq("assignee_id", user.id).lte("due_at", new Date(now + DAY).toISOString()).order("due_at").limit(5),
    supabase.from("landing_pages").select("id, slug, status").eq("organization_id", org.id),
    supabase.from("onboarding").select("status").eq("organization_id", org.id).single(),
    Promise.all([
      supabase.from("org_services").select("category_code", { count: "exact", head: true }).eq("organization_id", org.id),
      supabase.from("service_areas").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
      supabase.from("org_questions").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
      supabase.from("memberships").select("user_id", { count: "exact", head: true }).eq("organization_id", org.id),
    ]),
    getFitContext(ctx),
    supabase.from("usage_events").select("quantity").eq("organization_id", org.id).eq("kind", "xoo_ai").gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from("plan_entitlements").select("key, limit_value").eq("plan_code", org.plan_code),
  ]);

  const E = enq.data ?? [];
  const O = opps.data ?? [];
  const A = appts.data ?? [];
  const cur = E.filter((e) => inCur(e.received_at));
  const prev = E.filter((e) => !inCur(e.received_at));
  const resp = (xs: typeof E) => median(xs.filter((e) => e.first_response_at).map((e) => (+new Date(e.first_response_at!) - +new Date(e.received_at)) / 60_000));
  const respCur = resp(cur);
  const respPrev = resp(prev);
  const booked = (from: number, to: number) => A.filter((a) => +new Date(a.created_at) >= from && +new Date(a.created_at) < to).length;
  const bookedCur = booked(+start, now + 1);
  const bookedPrev = booked(+prevStart, +start);
  const wonIn = (from: number, to: number) => O.filter((o) => o.stage === "won" && o.closed_at && +new Date(o.closed_at) >= from && +new Date(o.closed_at) < to);
  const wonCur = wonIn(+start, now + 1);
  const wonPrev = wonIn(+prevStart, +start);
  const sum = (xs: typeof O) => xs.reduce((s, o) => s + (o.value_minor ?? 0), 0);
  const closed = O.filter((o) => o.stage === "won" || o.stage === "lost");
  const winRate = closed.length ? Math.round((O.filter((o) => o.stage === "won").length / closed.length) * 100) : null;
  const upcoming = A.filter((a) => +new Date(a.starts_at) >= now && ["scheduled", "confirmed", "rescheduled"].includes(a.status));

  // Daily series, aligned day-by-day with the previous period.
  const fmtDay = new Intl.DateTimeFormat("en-AU", { timeZone: org.timezone, day: "numeric", month: "short" });
  const labels: string[] = [];
  const curSeries: number[] = [];
  const prevSeries: number[] = [];
  // Rolling 7-day totals read as a trend; raw daily counts are too spiky at small-business volumes.
  const inWindow = (end: number) => E.filter((e) => +new Date(e.received_at) > end - 7 * DAY && +new Date(e.received_at) <= end).length;
  for (let i = PERIOD - 1; i >= 0; i--) {
    const dayEnd = now - i * DAY;
    labels.push(fmtDay.format(new Date(dayEnd)));
    curSeries.push(inWindow(dayEnd));
    prevSeries.push(inWindow(dayEnd - PERIOD * DAY));
  }

  // Funnel for enquiries received this period.
  const curIds = new Set(cur.map((e) => e.id));
  const curOpps = O.filter((o) => o.enquiry_id && curIds.has(o.enquiry_id));
  const qualified = cur.filter((e) => e.status === "qualified").length + curOpps.filter((o) => o.stage === "won" && cur.find((e) => e.id === o.enquiry_id)?.status !== "qualified").length;
  const withAppt = curOpps.filter((o) => (o.appointments?.[0]?.count ?? 0) > 0).length;
  const won = curOpps.filter((o) => o.stage === "won").length;
  const funnel = [
    { label: "Enquiries received", n: cur.length },
    { label: "Qualified", n: qualified },
    { label: "Appointment booked", n: withAppt },
    { label: "Won", n: won },
  ];
  const conversion = cur.length ? ((won / cur.length) * 100).toFixed(1) : "0.0";

  const [svc, areas, qs, members] = counts;
  const checklist = activationChecklist({
    org: { phone: org.phone, website: org.website, contact_name: org.contact_name, settings: (org.settings ?? {}) as Record<string, unknown> },
    servicesCount: svc.count ?? 0,
    areasCount: areas.count ?? 0,
    questionsCount: qs.count ?? 0,
    pages: pages.data ?? [],
    membersCount: members.count ?? 1,
    onboardingStatus: ob.data?.status ?? "not_started",
  });
  const todo = checklist.filter((c) => !c.done);
  const planInfo = PLAN_BY_CODE[org.plan_code as keyof typeof PLAN_BY_CODE];
  const limit = (k: string) => plan.data?.find((p) => p.key === k)?.limit_value ?? null;
  const used = { xoo: (usage.data ?? []).reduce((s, r) => s + r.quantity, 0), pages: (pages.data ?? []).filter((p) => p.status === "published").length, seats: members.count ?? 1 };
  const meters = [
    { label: "Xoo AI this month", used: used.xoo, limit: limit("xoo_ai_requests_month") },
    { label: "Published pages", used: used.pages, limit: limit("published_pages") },
    { label: "Team seats", used: used.seats, limit: limit("seats") },
  ];
  const tz = org.timezone;

  return (
    <Page wide className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[28px]">Overview</h1>
          <p className="text-[14px] text-ink-3">Last {PERIOD} days, compared with the {PERIOD} before.</p>
        </div>
        <ButtonLink href="/app/enquiries?status=all" variant="secondary" size="sm">
          <Inbox className="size-4" aria-hidden /> All enquiries
        </ButtonLink>
      </div>

      {todo.length ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="relative grid size-11 place-items-center">
              <svg viewBox="0 0 36 36" className="size-11 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface-2)" strokeWidth="4" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--teal)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${((checklist.length - todo.length) / checklist.length) * 94.2} 94.2`} />
              </svg>
              <span className="absolute text-[11px] font-semibold tabular">
                {checklist.length - todo.length}/{checklist.length}
              </span>
            </span>
            <div>
              <p className="text-[14px] font-semibold">Finish setting up</p>
              <p className="text-[13px] text-ink-3">Next: {todo[0]!.label.toLowerCase()}</p>
            </div>
          </div>
          <ul className="flex flex-1 flex-wrap gap-2 sm:justify-end">
            {checklist.map((c) => (
              <li key={c.id}>
                <Link href={c.href} className={c.done ? "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-ink-3" : "inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-[12px] text-ink hover:bg-surface-2"}>
                  {c.done ? <CircleCheck className="size-3.5 text-teal-ink" aria-label="Done" /> : <Circle className="size-3.5 text-ink-3" aria-label="To do" />}
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New enquiries" value={cur.length} current={cur.length} previous={prev.length} icon={<Inbox />} href="/app/enquiries?status=all" footer={`${cur.length - prev.length >= 0 ? "+" : ""}${cur.length - prev.length} from previous period`} />
        <StatCard label="First response" value={hours(respCur)} current={respCur ?? 0} previous={respPrev ?? 0} invert icon={<Clock />} href="/app/reports" footer={respPrev !== null ? `${hours(respPrev)} previous period (median)` : "Median time to first reply"} />
        <StatCard label="Appointments booked" value={bookedCur} current={bookedCur} previous={bookedPrev} icon={<CalendarCheck />} href="/app/appointments" footer={`${upcoming.length} upcoming`} />
        <StatCard
          label="Won"
          value={sum(wonCur) ? formatMoney(sum(wonCur), org.currency, { compact: true }) : wonCur.length}
          current={sum(wonCur) || wonCur.length}
          previous={sum(wonPrev) || wonPrev.length}
          icon={<Trophy />}
          href="/app/pipeline"
          footer={winRate !== null ? `Win rate ${winRate}% overall` : "No closed opportunities yet"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader eyebrow="Enquiries" title={cur.length} badge={<Delta current={cur.length} previous={prev.length} />} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-y border-line px-5 py-3">
            <p className="text-[13px] text-ink-3">Rolling 7-day total, from your pages and chat</p>
            <div className="flex items-center gap-4 text-[12px] text-ink-3">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-teal" /> This period
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-signal" /> Previous period
              </span>
            </div>
          </div>
          <div className="px-3 pb-3 pt-2">
            <AreaChart
              labels={labels}
              series={[
                { label: "This period", values: curSeries, color: "var(--teal)" },
                { label: "Previous", values: prevSeries, color: "var(--signal)" },
              ]}
              ariaLabel={`Rolling 7-day enquiries: ${cur.length} in the last ${PERIOD} days against ${prev.length} in the previous ${PERIOD}.`}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Conversion rate" title={`${conversion}%`} icon={<Funnel />} />
          <p className="px-5 pt-1 text-[12px] text-ink-3">Enquiries this period that became won work</p>
          <ul className="m-3 mt-4 divide-y divide-line rounded-xl border border-line">
            {funnel.map((f, i) => {
              const pct = funnel[0]!.n ? (f.n / funnel[0]!.n) * 100 : 0;
              return (
                <li key={f.label} className="px-4 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[14px] font-medium">{f.label}</p>
                    <p className="text-[15px] font-semibold tabular">{f.n.toLocaleString("en-AU")}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span className="block h-full rounded-full bg-teal" style={{ width: `${pct}%`, opacity: 1 - i * 0.18 }} />
                    </span>
                    <span className="w-10 text-right text-[12px] tabular text-ink-3">{i === 0 ? "100%" : `${pct.toFixed(0)}%`}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
        <Panel inner="flex flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Your plan</p>
              <p className="mt-1 font-display text-[22px] font-semibold tracking-tight">{planInfo?.name ?? org.plan_code}</p>
            </div>
            <ButtonLink href="/app/settings/plan" size="sm" className="bg-midnight text-white hover:bg-midnight-hover dark:bg-blue dark:text-on-blue">
              Manage
            </ButtonLink>
          </div>
          <p className="px-5 pt-4 text-[14px] leading-relaxed text-ink-2">{planInfo?.positioning}</p>
          <div className="m-3 mt-4 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-surface-2/50">
            {meters.map((m) => (
              <div key={m.label} className="px-3 py-3 text-center">
                <p className="text-[11px] text-ink-3">{m.label}</p>
                <p className="mt-1 text-[16px] font-semibold tabular">
                  {m.used}
                  <span className="text-[12px] font-normal text-ink-3">{m.limit === null ? "" : ` / ${m.limit}`}</span>
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow="Newest enquiries"
            title={E.length ? cur.length : 0}
            badge={cur.length ? <span className="rounded-full border border-green-ink/20 bg-green-soft px-1.5 py-0.5 text-[11px] font-semibold text-green-ink">+{E.filter((e) => +new Date(e.received_at) > now - 7 * DAY).length} this week</span> : null}
            action={
              <Link href="/app/enquiries?status=all" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2">
                View all <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          {recent.data?.length ? (
            <div className="mt-3">
              <DataTable
                minWidth={560}
                head={[{ label: "Contact" }, { label: "Service" }, { label: "Stage" }, { label: "Received", className: "text-right" }]}
              >
                {recent.data.map((e) => {
                  const opp = e.opportunities?.[0];
                  const stage = opp ? STAGE_BY_ID[opp.stage] : null;
                  return (
                    <tr key={e.id} className="hover:bg-surface-2/50">
                      <td className="py-3 pl-5 pr-4">
                        <Link href={opp ? `/app/opportunities/${opp.id}` : "/app/enquiries"} className="flex items-center gap-3">
                          <Avatar name={e.contact?.full_name ?? "?"} className="size-8" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 font-medium">
                              {e.status === "unreviewed" ? <span className="size-1.5 rounded-full bg-blue" aria-label="Unreviewed" /> : null}
                              {e.contact?.full_name}
                            </span>
                            <span className="block max-w-[200px] truncate text-[12px] text-ink-3">{e.contact?.email ?? e.contact?.phone}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block text-[13px]">{fc.orgServices.find((s) => s.code === e.project?.category_code)?.name ?? "—"}</span>
                        <span className="block max-w-[180px] truncate text-[12px] text-ink-3">{e.project?.location_text}</span>
                      </td>
                      <td className="px-4 py-3">{stage ? <StatusPill tone={stage.tone}>{stage.label}</StatusPill> : null}</td>
                      <td className="whitespace-nowrap py-3 pl-4 pr-5 text-right text-[12px] tabular text-ink-3">{formatRelative(e.received_at, tz)}</td>
                    </tr>
                  );
                })}
              </DataTable>
            </div>
          ) : (
            <EmptyState icon={<Inbox />} title="No enquiries yet" description="Publish your landing page and share its link to start receiving enquiries." action={<ButtonLink href="/app/landing-pages" variant="secondary">Landing pages</ButtonLink>} />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader eyebrow="Your follow-ups" title={dueTasks.data?.length ?? 0} badge={<span className="text-[12px] text-ink-3">due by tomorrow</span>} action={<Link href="/app/tasks" className="text-[13px] font-medium text-blue hover:underline">All tasks</Link>} />
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {(dueTasks.data ?? []).length === 0 ? <li className="px-5 py-4 text-[14px] text-ink-3">Nothing due. You&apos;re on top of it.</li> : null}
            {(dueTasks.data ?? []).map((t) => {
              const late = t.due_at && +new Date(t.due_at) < now;
              return (
                <li key={t.id}>
                  <Link href={t.opportunity_id ? `/app/opportunities/${t.opportunity_id}` : "/app/tasks"} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2/50">
                    <span className="min-w-0 truncate text-[14px]">{t.title}</span>
                    {late ? <StatusPill tone="red">Overdue</StatusPill> : <span className="shrink-0 whitespace-nowrap text-[12px] text-ink-3">{formatRelative(t.due_at, tz)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader eyebrow="Coming up" title={upcoming.length} badge={<span className="text-[12px] text-ink-3">{plural(upcoming.length, "appointment")}</span>} action={<Link href="/app/appointments" className="text-[13px] font-medium text-blue hover:underline">Calendar</Link>} />
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {upcoming.length === 0 ? <li className="px-5 py-4 text-[14px] text-ink-3">No appointments booked.</li> : null}
            {upcoming.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link href={a.opportunity_id ? `/app/opportunities/${a.opportunity_id}` : "/app/appointments"} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/50">
                  <Avatar name={a.contact?.full_name ?? "?"} className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{a.contact?.full_name}</span>
                    <span className="block text-[12px] text-ink-3">{APPT_TYPE_LABEL[a.type]}</span>
                  </span>
                  <span className="shrink-0 text-right text-[12px] text-ink-2">{formatDateTime(a.starts_at, tz)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Page>
  );
}
