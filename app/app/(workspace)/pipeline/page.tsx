import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { PipelineBoard, type BoardCard } from "@/components/app/crm/PipelineBoard";
import { NewOpportunity } from "@/components/app/crm/NewOpportunity";
import { fitFor, getFitContext } from "@/features/crm/queries";
import { requireOrg } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const ctx = await requireOrg();
  const { supabase, org } = ctx;
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const [{ data }, fc] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id, title, stage, value_minor, currency, created_at, closed_at, contact:contacts(full_name), project:projects(category_code, location_text, postcode, start_timing, budget_label, details), owner:profiles!opportunities_owner_id_fkey(full_name, email)")
      .eq("organization_id", org.id)
      .or(`closed_at.is.null,closed_at.gte.${since}`)
      .order("stage_changed_at", { ascending: false })
      .limit(400),
    getFitContext(ctx),
  ]);
  const now = Date.now();
  const cards: BoardCard[] = (data ?? []).map((o) => ({
    id: o.id,
    title: fc.orgServices.find((s) => s.code === o.project?.category_code)?.name ?? o.title.split(" — ")[0]!,
    contact: o.contact?.full_name ?? "Unknown",
    location: o.project?.location_text ?? null,
    stage: o.stage,
    value_minor: o.value_minor,
    currency: o.currency ?? org.currency,
    owner: o.owner?.full_name || o.owner?.email || null,
    ageDays: Math.floor((now - new Date(o.created_at).getTime()) / 86_400_000),
    fitLabel: fitFor(fc, o.project, null).label,
  }));
  const openValue = cards.filter((c) => !["won", "lost"].includes(c.stage)).reduce((s, c) => s + (c.value_minor ?? 0), 0);

  return (
    <Page wide>
      <PageHeader
        title="Pipeline"
        description={`${cards.filter((c) => !["won", "lost"].includes(c.stage)).length} open${openValue ? ` · ${formatMoney(openValue, org.currency)} entered value` : ""} · closed in the last 60 days shown`}
        actions={<NewOpportunity services={fc.orgServices} />}
        className="mb-6"
      />
      <PipelineBoard cards={cards} currency={org.currency} />
    </Page>
  );
}
