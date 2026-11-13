import type { Metadata } from "next";
import { Card, EmptyState } from "@/components/ui";
import { requireOrg } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Audit log" };

const LABEL: Record<string, string> = {
  "organization.created": "Created the organisation",
  "membership.joined": "Joined the team",
  "landing_page.submitted": "Submitted a page version",
  "landing_page.approved": "Approved a page version",
  "landing_page.published": "Published a page",
  "landing_page.paused": "Paused a page",
  "landing_page.resumed": "Resumed a page",
  "opportunity.stage_changed": "Changed an opportunity's stage",
  "appointment.created": "Booked an appointment",
  "contact.do_not_contact": "Changed a do-not-contact flag",
  "enquiries.exported": "Exported enquiries",
  "contacts.exported": "Exported contacts",
};

export default async function AuditPage() {
  const { supabase, org } = await requireOrg();
  const { data } = await supabase.from("audit_events").select("id, action, entity, data, created_at, actor:profiles!audit_events_actor_id_fkey(full_name, email)").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(200);
  return (
    <Card className="overflow-hidden">
      {data?.length ? (
        <ul className="divide-y divide-line">
          {data.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 text-[14px]">
              <span>
                <span className="font-medium">{e.actor?.full_name || e.actor?.email || "System"}</span> <span className="text-ink-2">{(LABEL[e.action] ?? e.action).toLowerCase()}</span>
                {e.action === "opportunity.stage_changed" ? <span className="text-ink-3"> ({String((e.data as { from?: string }).from).replaceAll("_", " ")} → {String((e.data as { to?: string }).to).replaceAll("_", " ")})</span> : null}
              </span>
              <span className="text-[12px] text-ink-3">{formatDateTime(e.created_at, org.timezone)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No audit events yet" description="Sensitive actions such as approvals, publishing and stage changes are recorded here." />
      )}
    </Card>
  );
}
