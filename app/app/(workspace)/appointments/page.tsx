import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { AppointmentItem } from "@/components/app/crm/widgets";
import { Card, EmptyState } from "@/components/ui";
import { requireOrg } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Appointments" };

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  const view = sp.view === "past" ? "past" : "upcoming";
  const { supabase, org } = await requireOrg();
  const now = new Date().toISOString();
  let q = supabase
    .from("appointments")
    .select("id, type, status, starts_at, ends_at, location, purpose, outcome, opportunity_id, contact:contacts(full_name)")
    .eq("organization_id", org.id)
    .limit(200);
  q = view === "upcoming" ? q.gte("ends_at", now).order("starts_at") : q.lt("ends_at", now).order("starts_at", { ascending: false });
  const { data } = await q;
  const tz = org.timezone;
  const dayKey = (iso: string) => new Intl.DateTimeFormat("en-AU", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
  const groups = new Map<string, NonNullable<typeof data>>();
  for (const a of data ?? []) {
    const k = dayKey(a.starts_at);
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }

  return (
    <Page>
      <PageHeader
        title="Appointments"
        description={`Calls, video meetings and site visits. Times in ${tz}.`}
        actions={
          <div className="inline-flex rounded-xl bg-surface-2 p-1" role="group" aria-label="Which appointments">
            {(["upcoming", "past"] as const).map((v) => (
              <Link key={v} href={`/app/appointments?view=${v}`} aria-current={view === v ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-[14px] capitalize", view === v ? "bg-surface font-medium shadow-xs" : "text-ink-3")}>
                {v}
              </Link>
            ))}
          </div>
        }
        className="mb-6"
      />
      {groups.size === 0 ? (
        <Card>
          <EmptyState icon={<CalendarDays />} title={view === "upcoming" ? "Nothing booked" : "No past appointments"} description="Book calls and site visits from any opportunity. They appear here grouped by day." />
        </Card>
      ) : (
        <div className="grid gap-8">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">{day}</h2>
              <ul className="grid gap-2">
                {items.map((a) => (
                  <AppointmentItem
                    key={a.id}
                    a={a}
                    timezone={tz}
                    now={Date.now()}
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
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
