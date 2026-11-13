import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { Wizard, type WizardData } from "@/components/app/onboarding/Wizard";
import { Badge } from "@/components/ui";
import { ONBOARDING_STATUS_LABEL, STEPS, type StepId } from "@/features/onboarding/steps";
import { requireOrg } from "@/lib/auth/session";
import { allTimezones } from "@/lib/timezones";

export const metadata: Metadata = { title: "Set up" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const sp = await searchParams;
  const { supabase, org, isOwner } = await requireOrg();
  const [ob, services, areas, questions, members] = await Promise.all([
    supabase.from("onboarding").select("*").eq("organization_id", org.id).single(),
    supabase.from("org_services").select("category_code, focus").eq("organization_id", org.id),
    supabase.from("service_areas").select("label, postcode, radius_km").eq("organization_id", org.id).order("created_at"),
    supabase.from("org_questions").select("*").eq("organization_id", org.id).order("sort"),
    supabase.from("memberships").select("user_id, profile:profiles(full_name, email)").eq("organization_id", org.id),
  ]);

  const completed = ob.data?.completed_steps ?? [];
  const firstOpen = STEPS.find((s) => !completed.includes(s.id))?.id ?? "review";
  const step = ([...STEPS.map((s) => s.id), "review"] as string[]).includes(sp.step ?? "") ? (sp.step as StepId | "review") : firstOpen;

  const data: WizardData = {
    orgId: org.id,
    isOwner,
    status: ob.data?.status ?? "not_started",
    reviewNote: ob.data?.review_note ?? null,
    completed,
    org: { name: org.name, website: org.website, phone: org.phone, contact_name: org.contact_name, timezone: org.timezone, settings: (org.settings ?? {}) as WizardData["org"]["settings"] },
    services: (services.data ?? []).map((s) => s.category_code),
    focus: services.data?.[0]?.focus ?? "both",
    areas: (areas.data ?? []).map((a) => ({ label: a.label, postcode: a.postcode ?? "", radius_km: a.radius_km ?? undefined })),
    questions: (questions.data ?? []).map((q) => ({
      key: q.key,
      label: q.label,
      kind: q.kind as WizardData["questions"][number]["kind"],
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      is_public: q.is_public,
      required: q.required,
      active: q.active,
      source: q.source as "template" | "custom",
    })),
    zones: allTimezones(),
    members: (members.data ?? []).map((m) => ({ id: m.user_id, name: m.profile?.full_name || m.profile?.email || "Team member" })),
  };

  return (
    <Page>
      <PageHeader
        eyebrow={<Badge tone={data.status === "active" || data.status === "approved" ? "green" : data.status === "needs_changes" ? "amber" : "blue"}>{ONBOARDING_STATUS_LABEL[data.status]}</Badge>}
        title="Set up your workspace"
        description="Six short steps. Save as you go and come back any time."
        className="mb-8"
      />
      <Wizard key={step} data={data} step={step} />
    </Page>
  );
}
