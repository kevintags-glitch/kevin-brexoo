import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Page } from "@/components/app/PageHeader";
import { AppointmentItem, NewAppointment } from "@/components/app/crm/widgets";
import { BookingRequests, type BookingRequest } from "@/components/app/crm/BookingRequests";
import { EmptyState } from "@/components/ui";
import { APPT_TYPE_LABEL, OPEN_STAGES } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { utcToZonedInputs } from "@/lib/format";

export const metadata: Metadata = { title: "Bookings & calendar" };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ view?: string; m?: string; d?: string }> }) {
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : sp.view === "past" ? "past" : "calendar";
  const { supabase, org } = await requireOrg();
  const tz = org.timezone;
  const nowIso = new Date().toISOString();
  const today = utcToZonedInputs(nowIso, tz).date;

  // Month shown (YYYY-MM) and selected day (YYYY-MM-DD), in the business's time zone.
  const month = /^\d{4}-\d{2}$/.test(sp.m ?? "") ? sp.m! : today.slice(0, 7);
  const [y, m] = month.split("-").map(Number) as [number, number];
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(sp.d ?? "") ? sp.d! : today.startsWith(month) ? today : `${month}-01`;
  const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;

  // Fetch a padded UTC window around the month, then bucket by local date.
  const from = new Date(Date.UTC(y, m - 1, 1) - 2 * 86_400_000).toISOString();
  const to = new Date(Date.UTC(y, m, 1) + 2 * 86_400_000).toISOString();
  let listQuery = supabase
    .from("appointments")
    .select("id, type, status, starts_at, ends_at, location, purpose, outcome, opportunity_id, contact:contacts(full_name)")
    .eq("organization_id", org.id)
    .limit(300);
  listQuery = view === "calendar" ? listQuery.gte("starts_at", from).lt("starts_at", to).order("starts_at") : view === "list" ? listQuery.gte("ends_at", nowIso).order("starts_at") : listQuery.lt("ends_at", nowIso).order("starts_at", { ascending: false });
  const [{ data }, opps, reqs] = await Promise.all([
    listQuery,
    supabase.from("opportunities").select("id, title, contact_id, project:projects(location_text)").eq("organization_id", org.id).in("stage", OPEN_STAGES).order("updated_at", { ascending: false }).limit(200),
    supabase
      .from("enquiries")
      .select("id, requested_start, requested_type, contact:contacts(full_name, is_sample), project:projects(location_text), opportunities!opportunities_enquiry_id_organization_id_fkey(id)")
      .eq("organization_id", org.id)
      .eq("booking_status", "requested")
      .gte("requested_start", nowIso)
      .order("requested_start")
      .limit(50),
  ]);
  const whenFmt = new Intl.DateTimeFormat("en-AU", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const requests: BookingRequest[] = (reqs.data ?? []).map((r) => ({
    id: r.id,
    name: r.contact?.full_name ?? "Visitor",
    when: whenFmt.format(new Date(r.requested_start!)),
    type: APPT_TYPE_LABEL[r.requested_type ?? "phone"],
    where: r.project?.location_text ?? null,
    oppId: r.opportunities?.[0]?.id ?? null,
    sample: Boolean(r.contact?.is_sample),
  }));
  const appts = data ?? [];
  const byDay = new Map<string, typeof appts>();
  for (const a of appts) {
    const k = utcToZonedInputs(a.starts_at, tz).date;
    byDay.set(k, [...(byDay.get(k) ?? []), a]);
  }
  const settings = ((org.settings ?? {}) as { appointments?: { meeting_types?: string[]; meeting_minutes?: number } }).appointments ?? {};
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const cells: (string | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${pad(i + 1)}`)];
  while (cells.length % 7) cells.push(null);
  const monthLabel = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  const dayLabel = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${selected}T00:00:00Z`));
  const dayItems = byDay.get(selected) ?? [];
  const now = Date.now();
  const tabs = [
    { id: "calendar", label: "Calendar", href: "/app/appointments" },
    { id: "list", label: "Upcoming", href: "/app/appointments?view=list" },
    { id: "past", label: "Past", href: "/app/appointments?view=past" },
  ];

  return (
    <Page wide className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[28px]">Bookings &amp; Calendar</h1>
          <p className="text-[14px] text-ink-3">Calls, video meetings and site visits. Times in {tz}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-surface-2 p-1" role="group" aria-label="View">
            {tabs.map((t) => (
              <Link key={t.id} href={t.href} aria-current={view === t.id ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-[14px]", view === t.id ? "bg-surface font-medium shadow-xs" : "text-ink-3")}>
                {t.label}
              </Link>
            ))}
          </div>
          <NewAppointment
            opps={(opps.data ?? []).map((o) => ({ id: o.id, contactId: o.contact_id, label: o.title, location: o.project?.location_text ?? null }))}
            timezone={tz}
            defaults={{ types: settings.meeting_types ?? ["phone", "site_visit"], minutes: settings.meeting_minutes ?? 60 }}
          />
        </div>
      </div>
      <BookingRequests requests={requests} />

      {view === "calendar" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5" aria-label={`Calendar for ${monthLabel}`}>
            <div className="mb-4 flex items-center justify-between">
              <Link href={`/app/appointments?m=${prevMonth}`} className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-surface-2" aria-label="Previous month">
                <ChevronLeft className="size-5" />
              </Link>
              <h2 className="font-sans text-[16px] font-semibold tracking-normal">{monthLabel}</h2>
              <Link href={`/app/appointments?m=${nextMonth}`} className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-surface-2" aria-label="Next month">
                <ChevronRight className="size-5" />
              </Link>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center" role="grid">
              {WEEKDAYS.map((d) => (
                <div key={d} role="columnheader" className="pb-2 text-[12px] font-medium text-ink-3">
                  {d}
                </div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`e${i}`} />;
                const n = byDay.get(day)?.filter((a) => a.status !== "cancelled").length ?? 0;
                const isSel = day === selected;
                const isToday = day === today;
                return (
                  <Link
                    key={day}
                    href={`/app/appointments?m=${month}&d=${day}`}
                    role="gridcell"
                    aria-selected={isSel}
                    aria-label={`${day}${n ? `, ${n} appointment${n > 1 ? "s" : ""}` : ""}`}
                    className={cn(
                      "relative mx-auto grid aspect-square w-full max-w-14 place-items-center rounded-xl text-[14px] tabular transition-colors",
                      isSel ? "bg-blue font-semibold text-on-blue" : isToday ? "font-semibold text-blue ring-1 ring-blue/40" : "text-ink hover:bg-surface-2",
                    )}
                  >
                    {Number(day.slice(8))}
                    {n ? (
                      <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5" aria-hidden>
                        {Array.from({ length: Math.min(n, 3) }, (_, k) => (
                          <span key={k} className={cn("size-1 rounded-full", isSel ? "bg-on-blue" : "bg-teal")} />
                        ))}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface shadow-xs" aria-label={`Schedule for ${dayLabel}`}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-sans text-[16px] font-semibold tracking-normal">{dayLabel}</h2>
              <span className="text-[13px] text-ink-3">{dayItems.length ? `${dayItems.length} booked` : "Free"}</span>
            </div>
            {dayItems.length ? (
              <ul className="grid gap-2 p-4">
                {dayItems.map((a) => (
                  <li key={a.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
                    <span className="pt-3 text-[13px] font-semibold tabular text-ink-2">{utcToZonedInputs(a.starts_at, tz).time}</span>
                    <ul>
                      <AppointmentItem
                        a={a}
                        timezone={tz}
                        now={now}
                        showContact={
                          a.opportunity_id ? (
                            <Link href={`/app/opportunities/${a.opportunity_id}`} className="mt-1 inline-block text-[13px] font-medium text-blue hover:underline">
                              {a.contact?.full_name}
                            </Link>
                          ) : (
                            <p className="mt-1 text-[13px]">{a.contact?.full_name}</p>
                          )
                        }
                      />
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<CalendarDays />} title="Nothing booked" description="Pick another day, or book from a lead with “New appointment”." />
            )}
          </section>
        </div>
      ) : appts.length === 0 ? (
        <section className="rounded-2xl border border-line bg-surface shadow-xs">
          <EmptyState icon={<CalendarDays />} title={view === "list" ? "Nothing booked" : "No past appointments"} description="Book calls and site visits from any lead." />
        </section>
      ) : (
        <ul className="grid gap-2">
          {appts.map((a) => (
            <AppointmentItem
              key={a.id}
              a={a}
              timezone={tz}
              now={now}
              showContact={
                a.opportunity_id ? (
                  <Link href={`/app/opportunities/${a.opportunity_id}`} className="mt-1 inline-block text-[13px] font-medium text-blue hover:underline">
                    {a.contact?.full_name} · {APPT_TYPE_LABEL[a.type]}
                  </Link>
                ) : null
              }
            />
          ))}
        </ul>
      )}
    </Page>
  );
}
