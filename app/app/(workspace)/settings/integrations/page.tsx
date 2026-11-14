import type { Metadata } from "next";
import { Mail, CalendarDays, CreditCard } from "lucide-react";
import { InboundLeads } from "@/components/app/InboundLeads";
import { MakeIntegration } from "@/components/app/MakeIntegration";
import { Badge, Card } from "@/components/ui";
import { requireOrg } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Integrations" };

const COMING = [
  { icon: Mail, name: "Gmail and Outlook", body: "Send approved follow-ups from your own mailbox." },
  { icon: CalendarDays, name: "Google and Microsoft calendars", body: "Check availability and add bookings to your calendar." },
  { icon: CreditCard, name: "Stripe billing", body: "Self-serve plans, invoices and payment methods." },
];

export default async function IntegrationsPage() {
  const ctx = await requireOrg();
  const { data } = ctx.isOwner
    ? await ctx.supabase.from("integrations").select("url, secret, events, enabled, last_delivery_at, last_status").eq("organization_id", ctx.org.id).eq("kind", "make_webhook").maybeSingle()
    : { data: null };
  const { data: keys } = ctx.isOwner
    ? await ctx.supabase.from("inbound_keys").select("id, label, key_hint, created_at, last_used_at, revoked_at").eq("organization_id", ctx.org.id).order("created_at", { ascending: false }).limit(20)
    : { data: [] };
  return (
    <div className="grid gap-6">
      <InboundLeads
        isOwner={ctx.isOwner}
        keys={(keys ?? []).map((k) => ({
          id: k.id,
          label: k.label,
          key_hint: k.key_hint,
          created: formatDateTime(k.created_at, ctx.org.timezone),
          lastUsed: k.last_used_at ? formatDateTime(k.last_used_at, ctx.org.timezone) : null,
          revoked: Boolean(k.revoked_at),
        }))}
      />
      <MakeIntegration integration={data} isOwner={ctx.isOwner} lastDelivery={data?.last_delivery_at ? formatDateTime(data.last_delivery_at, ctx.org.timezone) : null} />
      <Card className="p-5">
        <p className="text-[15px] font-medium">Coming next</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {COMING.map(({ icon: Icon, name, body }) => (
            <li key={name} className="rounded-xl border border-line p-4">
              <Icon className="size-5 text-ink-3" aria-hidden />
              <p className="mt-3 text-[14px] font-medium">{name}</p>
              <p className="mt-1 text-[13px] text-ink-3">{body}</p>
              <Badge className="mt-3">On the roadmap</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
