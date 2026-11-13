import type { Metadata } from "next";
import { Card, CardHeader, Notice } from "@/components/ui";
import { PLAN_BY_CODE } from "@/config/plans";
import { requireOrg } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Plan & usage" };

const LABELS: Record<string, string> = {
  seats: "Team seats",
  published_pages: "Published pages",
  brex_ai_requests_month: "Brex AI requests this month",
  visitor_chat_conversations_month: "Visitor chat conversations / month",
  connected_mailboxes: "Connected mailboxes",
  managed_service_hours_month: "Managed service hours / month",
  exports: "Exports",
};

export default async function PlanPage() {
  const { supabase, org } = await requireOrg();
  const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [ents, seats, pages, brex] = await Promise.all([
    supabase.from("plan_entitlements").select("key, limit_value").eq("plan_code", org.plan_code),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("landing_pages").select("id", { count: "exact", head: true }).eq("organization_id", org.id).eq("status", "published"),
    supabase.from("usage_events").select("quantity").eq("organization_id", org.id).eq("kind", "brex_ai").gte("created_at", month),
  ]);
  const used: Record<string, number | undefined> = {
    seats: seats.count ?? 0,
    published_pages: pages.count ?? 0,
    brex_ai_requests_month: (brex.data ?? []).reduce((s, r) => s + r.quantity, 0),
  };
  const plan = PLAN_BY_CODE[org.plan_code as keyof typeof PLAN_BY_CODE];
  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <p className="text-[13px] text-ink-3">Current plan</p>
        <p className="type-subhead mt-1">{plan?.name ?? org.plan_code}</p>
        {plan ? (
          <p className="text-[14px] text-ink-3">
            {formatMoney(plan.monthlyPriceMinor, plan.currency)} / month · {formatMoney(plan.setupFeeMinor, plan.currency)} setup (illustrative)
          </p>
        ) : null}
        <Notice tone="blue" className="mt-4">
          Billing isn't connected yet. Your plan sets the limits below; payment and invoices will be handled through a secure checkout once pricing is confirmed.
        </Notice>
      </Card>
      <Card>
        <CardHeader title="Limits and usage" description="Entitlements are stored as data, so they can change without code changes." />
        <ul className="mt-3 divide-y divide-line">
          {(ents.data ?? []).map((e) => {
            const u = used[e.key];
            const pct = e.limit_value && u !== undefined ? Math.min(100, (u / e.limit_value) * 100) : null;
            return (
              <li key={e.key} className="grid gap-2 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center">
                <span className="text-[14px]">{LABELS[e.key] ?? e.key}</span>
                <span className="flex items-center gap-3">
                  {pct !== null ? (
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span className={`block h-full rounded-full ${pct >= 90 ? "bg-red-ink" : "bg-blue"}`} style={{ width: `${pct}%` }} />
                    </span>
                  ) : (
                    <span className="flex-1" />
                  )}
                  <span className="w-20 text-right text-[13px] tabular text-ink-2">
                    {u !== undefined ? `${u} / ` : ""}
                    {e.limit_value === null ? "No limit" : e.limit_value === 0 ? "Not included" : e.limit_value}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="h-2" />
      </Card>
    </div>
  );
}
