import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleCheck, Circle, ExternalLink, Inbox } from "lucide-react";
import { Page } from "@/components/app/PageHeader";
import { fitTone } from "@/components/app/crm/FitCard";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState } from "@/components/ui";
import { activationChecklist } from "@/features/onboarding/steps";
import { fitFor, getFitContext } from "@/features/crm/queries";
import { OPEN_STAGES } from "@/features/crm/stages";
import { APPT_TYPE_LABEL } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { formatDateTime, formatMoney, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const ctx = await requireOrg();
  const { supabase, org, user, profile } = ctx;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000).toISOString();

  const [recent, newCount, unassigned, dueTasks, appts, opps, pages, ob, svcCount, areaCount, qCount, members, fc, usage] = await Promise.all([
    supabase
      .from("enquiries")
      .select("id, status, received_at, answers, contact:contacts(full_name), project:projects(category_code, location_text, postcode, start_timing, budget_label, details), opportunities!opportunities_enquiry_id_organization_id_fkey(id)")
      .eq("organization_id", org.id)
      .order("received_at", { ascending: false })
      .limit(6),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("organization_id", org.id).gte("received_at", weekAgo),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("organization_id", org.id).is("owner_id", null).in("stage", OPEN_STAGES),
    supabase
      .from("tasks")
      .select("id, title, due_at, opportunity_id")
      .eq("organization_id", org.id)
      .eq("status", "open")
      .eq("assignee_id", user.id)
      .lte("due_at", new Date(now.getTime() + 86_400_000).toISOString())
      .order("due_at")
      .limit(6),
    supabase.from("appointments").select("id, type, starts_at, opportunity_id, contact:contacts(full_name)").eq("organization_id", org.id).in("status", ["scheduled", "confirmed", "rescheduled"]).gte("starts_at", now.toISOString()).lte("starts_at", weekAhead).order("starts_at").limit(5),
    supabase.from("opportunities").select("stage, value_minor").eq("organization_id", org.id),
    supabase.from("landing_pages").select("id, slug, status").eq("organization_id", org.id),
    supabase.from("onboarding").select("status").eq("organization_id", org.id).single(),
    supabase.from("org_services").select("category_code", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("service_areas").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("org_questions").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("memberships").select("user_id", { count: "exact", head: true }).eq("organization_id", org.id),
    getFitContext(ctx),
    supabase.rpc("usage_remaining", { p_org: org.id, p_kind: "xoo_ai" }),
  ]);

  const checklist = activationChecklist({
    org: { phone: org.phone, website: org.website, contact_name: org.contact_name, settings: (org.settings ?? {}) as Record<string, unknown> },
    servicesCount: svcCount.count ?? 0,
    areasCount: areaCount.count ?? 0,
    questionsCount: qCount.count ?? 0,
    pages: pages.data ?? [],
    membersCount: members.count ?? 1,
    onboardingStatus: ob.data?.status ?? "not_started",
  });
  const doneCount = checklist.filter((c) => c.done).length;
  const openOpps = (opps.data ?? []).filter((o) => OPEN_STAGES.includes(o.stage));
  const openValue = openOpps.reduce((s, o) => s + (o.value_minor ?? 0), 0);
  const overdue = (dueTasks.data ?? []).filter((t) => t.due_at && new Date(t.due_at) < now).length;
  const live = (pages.data ?? []).find((p) => p.status === "published");
  const hour = Number(new Intl.DateTimeFormat("en-AU", { timeZone: org.timezone, hour: "numeric", hourCycle: "h23" }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = profile?.full_name?.split(" ")[0];

  const kpis = [
    { label: "New enquiries", value: newCount.count ?? 0, sub: "last 7 days", href: "/app/enquiries?status=all" },
    { label: "Unassigned", value: unassigned.count ?? 0, sub: "open opportunities", href: "/app/pipeline" },
    { label: "Your follow-ups", value: dueTasks.data?.length ?? 0, sub: overdue ? `${overdue} overdue` : "due by tomorrow", href: "/app/tasks", alert: overdue > 0 },
    { label: "Open pipeline", value: openValue ? formatMoney(openValue, org.currency, { compact: true }) : String(openOpps.length), sub: openValue ? `${openOpps.length} open` : "open opportunities", href: "/app/pipeline" },
  ];

  return (
    <Page wide>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] text-ink-3">{new Intl.DateTimeFormat("en-AU", { timeZone: org.timezone, weekday: "long", day: "numeric", month: "long" }).format(now)}</p>
          <h1 className="mt-1 text-[28px] font-medium tracking-[-0.02em] sm:text-[32px]">
            {greeting}
            {first ? `, ${first}` : ""}
          </h1>
        </div>
        {live ? (
          <a href={`/p/${live.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 self-start rounded-full bg-green-soft px-3 py-1.5 text-[13px] font-medium text-green-ink sm:self-auto">
            <span className="size-1.5 rounded-full bg-current" /> Page live <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </div>

      {doneCount < checklist.length ? (
        <Card className="mt-6 overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-sans text-[15px] font-semibold tracking-normal">Get ready to receive enquiries</h2>
              <p className="text-[13px] text-ink-3">
                {doneCount} of {checklist.length} done
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2 sm:w-48" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={checklist.length} aria-label="Setup progress">
              <div className="h-full rounded-full bg-teal" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
          </div>
          <ul className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {checklist.map((c) => (
              <li key={c.id} className="border-b border-line sm:odd:border-r lg:border-r lg:[&:nth-child(4n)]:border-r-0">
                <Link href={c.href} className="flex items-center gap-2.5 px-5 py-3 text-[13px] hover:bg-surface-2/60">
                  {c.done ? <CircleCheck className="size-4 shrink-0 text-teal-ink" aria-label="Done" /> : <Circle className="size-4 shrink-0 text-ink-3" aria-label="To do" />}
                  <span className={c.done ? "text-ink-3" : "text-ink"}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="pressable rounded-2xl border border-line bg-surface p-4 shadow-xs hover:border-line-strong">
            <p className="text-[13px] text-ink-3">{k.label}</p>
            <p className="mt-2 font-display text-[30px] font-medium leading-none tracking-tight tabular">{k.value}</p>
            <p className={k.alert ? "mt-1.5 text-[12px] font-medium text-red-ink" : "mt-1.5 text-[12px] text-ink-3"}>{k.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Newest enquiries"
            action={
              <Link href="/app/enquiries?status=all" className="inline-flex items-center gap-1 text-[13px] font-medium text-blue hover:underline">
                All enquiries <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          {recent.data?.length ? (
            <ul className="mt-3 divide-y divide-line">
              {recent.data.map((e) => {
                const fit = fitFor(fc, e.project, e.answers);
                const svc = fc.orgServices.find((s) => s.code === e.project?.category_code)?.name;
                return (
                  <li key={e.id}>
                    <Link href={e.opportunities?.[0] ? `/app/opportunities/${e.opportunities[0].id}` : "/app/enquiries"} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/60">
                      <Avatar name={e.contact?.full_name ?? "?"} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-[14px] font-medium">
                          {e.status === "unreviewed" ? <span className="size-1.5 shrink-0 rounded-full bg-blue" aria-label="Unreviewed" /> : null}
                          {e.contact?.full_name}
                        </p>
                        <p className="truncate text-[13px] text-ink-3">
                          {svc ?? "Enquiry"}
                          {e.project?.location_text ? ` · ${e.project.location_text}` : ""}
                        </p>
                      </div>
                      <Badge tone={fitTone(fit.label)} className="max-sm:hidden">
                        {fit.label}
                      </Badge>
                      <span className="w-24 shrink-0 whitespace-nowrap text-right text-[12px] tabular text-ink-3">{formatRelative(e.received_at, org.timezone)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<Inbox />}
              title="No enquiries yet"
              description={live ? "Share your landing page link to start receiving enquiries." : "Publish your landing page to start receiving enquiries."}
              action={<ButtonLink href="/app/landing-pages" variant="secondary">{live ? "Open landing pages" : "Set up your page"}</ButtonLink>}
            />
          )}
          <div className="h-2" />
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title="Your follow-ups" description="Due by tomorrow" action={<Link href="/app/tasks" className="text-[13px] font-medium text-blue hover:underline">All tasks</Link>} />
            <ul className="mt-2 divide-y divide-line">
              {(dueTasks.data ?? []).length === 0 ? <li className="px-5 py-4 text-[14px] text-ink-3">Nothing due. You're on top of it.</li> : null}
              {(dueTasks.data ?? []).map((t) => {
                const late = t.due_at && new Date(t.due_at) < now;
                return (
                  <li key={t.id}>
                    <Link href={t.opportunity_id ? `/app/opportunities/${t.opportunity_id}` : "/app/tasks"} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2/60">
                      <span className="min-w-0 truncate text-[14px]">{t.title}</span>
                      <span className={late ? "shrink-0 text-[12px] font-medium text-red-ink" : "shrink-0 text-[12px] text-ink-3"}>{formatRelative(t.due_at, org.timezone)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="h-2" />
          </Card>
          <Card>
            <CardHeader title="Coming up" description="Next 7 days" action={<Link href="/app/appointments" className="text-[13px] font-medium text-blue hover:underline">Calendar</Link>} />
            <ul className="mt-2 divide-y divide-line">
              {(appts.data ?? []).length === 0 ? (
                <li className="flex items-center gap-3 px-5 py-4 text-[14px] text-ink-3">
                  <CalendarDays className="size-4" aria-hidden /> No appointments booked.
                </li>
              ) : null}
              {(appts.data ?? []).map((a) => (
                <li key={a.id}>
                  <Link href={a.opportunity_id ? `/app/opportunities/${a.opportunity_id}` : "/app/appointments"} className="block px-5 py-3 hover:bg-surface-2/60">
                    <p className="text-[14px] font-medium">{a.contact?.full_name}</p>
                    <p className="text-[12px] text-ink-3">
                      {APPT_TYPE_LABEL[a.type]} · {formatDateTime(a.starts_at, org.timezone)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="h-2" />
          </Card>
          <p className="px-1 text-[12px] text-ink-3">Xoo AI: {usage.data === null || usage.data === undefined ? "no monthly limit" : `${usage.data} requests left this month`}.</p>
        </div>
      </div>
    </Page>
  );
}
