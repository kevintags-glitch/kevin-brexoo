import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { Timeline } from "@/components/app/crm/Timeline";
import { DoNotContact } from "@/components/app/crm/widgets";
import { Badge, Card, CardHeader } from "@/components/ui";
import { STAGE_BY_ID } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase, org } = await requireOrg();
  const { data: c } = await supabase.from("contacts").select("*").eq("id", id).eq("organization_id", org.id).maybeSingle();
  if (!c) notFound();
  const [opps, activity] = await Promise.all([
    supabase.from("opportunities").select("id, title, stage, value_minor, currency, created_at").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("activity_events").select("*, actor:profiles!activity_events_actor_id_fkey(full_name, email)").eq("contact_id", id).order("created_at", { ascending: false }).limit(60),
  ]);
  return (
    <Page>
      <PageHeader eyebrow={<Link href="/app/contacts" className="hover:text-ink">Contacts</Link>} title={c.full_name} description={[c.email, c.phone].filter(Boolean).join(" · ")} className="mb-8" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title="Opportunities" />
            <ul className="mt-2 divide-y divide-line">
              {(opps.data ?? []).map((o) => (
                <li key={o.id}>
                  <Link href={`/app/opportunities/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/50">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{o.title}</span>
                    {o.value_minor ? <span className="text-[13px] tabular text-ink-3">{formatMoney(o.value_minor, o.currency ?? org.currency)}</span> : null}
                    <Badge tone={STAGE_BY_ID[o.stage].tone}>{STAGE_BY_ID[o.stage].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="h-2" />
          </Card>
          <Card>
            <CardHeader title="Activity" />
            <div className="p-5">
              <Timeline events={activity.data ?? []} timezone={org.timezone} />
            </div>
          </Card>
        </div>
        <Card className="h-fit p-5">
          <dl className="grid gap-3 text-[14px]">
            <div>
              <dt className="text-[12px] text-ink-3">Email</dt>
              <dd className="break-all">{c.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ink-3">Phone</dt>
              <dd>{c.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ink-3">Preferred contact</dt>
              <dd className="capitalize">{c.preferred_contact ?? "Not stated"}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ink-3">Added</dt>
              <dd>{formatDateTime(c.created_at, org.timezone)}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <DoNotContact contactId={c.id} value={c.do_not_contact} note={c.restriction_note} />
          </div>
        </Card>
      </div>
    </Page>
  );
}
