import "server-only";
import type { OrgContext } from "@/lib/auth/session";
import { getTemplate } from "@/config/industry-templates";
import { computeConfidence, computeFit } from "./fit";

export async function getMembers(ctx: OrgContext) {
  const { data } = await ctx.supabase
    .from("memberships")
    .select("user_id, role, profile:profiles(full_name, email)")
    .eq("organization_id", ctx.org.id)
    .order("created_at");
  return (data ?? []).map((m) => ({ id: m.user_id, role: m.role, name: m.profile?.full_name || m.profile?.email || "Team member", email: m.profile?.email ?? "" }));
}

export async function getFitContext(ctx: OrgContext) {
  const [services, areas, questions] = await Promise.all([
    ctx.supabase.from("org_services").select("category_code, category:service_categories(name)").eq("organization_id", ctx.org.id),
    ctx.supabase.from("service_areas").select("label, postcode, county, city, suburb").eq("organization_id", ctx.org.id),
    ctx.supabase.from("org_questions").select("key, label, kind, options, required, is_public, active").eq("organization_id", ctx.org.id).order("sort"),
  ]);
  const settings = (ctx.org.settings ?? {}) as { ideal?: { min_budget?: string } };
  return {
    orgServices: (services.data ?? []).map((s) => ({ code: s.category_code, name: s.category?.name ?? s.category_code })),
    serviceAreas: (areas.data ?? []).map((a) => ({ label: a.label, postcode: a.postcode, county: a.county, city: a.city, suburb: a.suburb })),
    questions: (questions.data ?? []).filter((q) => q.active),
    idealMinBudget: settings.ideal?.min_budget || null,
  };
}

export type FitContext = Awaited<ReturnType<typeof getFitContext>>;

/** The questions that apply to one record: its service's template questions plus custom ones. */
export function questionsForCategory<Q extends { key: string }>(questions: Q[], category: string | null | undefined): Q[] {
  if (!category) return questions;
  const own = new Set((getTemplate(category)?.questions ?? []).map((q) => q.key));
  return questions.filter((q) => own.has(q.key) || q.key.startsWith("c_"));
}

export function fitFor(
  fc: FitContext,
  project: { category_code: string | null; location_text: string | null; postcode: string | null; start_timing: string | null; budget_label: string | null; details: unknown } | null,
  answers: unknown,
) {
  const merged = { ...((project?.details as Record<string, unknown>) ?? {}), ...((answers as Record<string, unknown>) ?? {}) };
  // Required questions that apply to this enquiry: its own service's template, plus custom ones.
  const applicable = questionsForCategory(fc.questions, project?.category_code).filter((q) => q.required);
  return computeFit({
    orgServices: fc.orgServices,
    serviceAreas: fc.serviceAreas,
    idealMinBudget: fc.idealMinBudget,
    requiredQuestions: applicable.map((q) => ({ key: q.key, label: q.label })),
    project: project ?? {},
    answers: merged,
  });
}

export async function getOpportunity(ctx: OrgContext, id: string) {
  const { supabase, org } = ctx;
  const { data: opp } = await supabase
    .from("opportunities")
    .select(
      "*, contact:contacts(*), project:projects(*), enquiry:enquiries!opportunities_enquiry_id_organization_id_fkey(*), owner:profiles!opportunities_owner_id_fkey(full_name, email)",
    )
    .eq("id", id)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!opp) return null;

  const [tasks, appointments, notes, activity, quals, fc] = await Promise.all([
    supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(full_name, email)").eq("opportunity_id", id).order("status").order("due_at", { nullsFirst: false }),
    supabase.from("appointments").select("*").eq("opportunity_id", id).order("starts_at", { ascending: false }),
    supabase.from("notes").select("*, author:profiles!notes_author_id_fkey(full_name, email)").eq("opportunity_id", id).order("created_at", { ascending: false }),
    supabase
      .from("activity_events")
      .select("*, actor:profiles!activity_events_actor_id_fkey(full_name, email)")
      .eq("organization_id", org.id)
      .or(`opportunity_id.eq.${id},and(contact_id.eq.${opp.contact_id},opportunity_id.is.null)`)
      .order("created_at", { ascending: false })
      .limit(100),
    opp.enquiry_id
      ? supabase.from("qualification_records").select("*, recorder:profiles!qualification_records_recorded_by_fkey(full_name)").eq("enquiry_id", opp.enquiry_id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    getFitContext(ctx),
  ]);

  const fit = fitFor(fc, opp.project, opp.enquiry?.answers);
  const confidence = computeConfidence({
    source: opp.enquiry?.source ?? opp.contact?.source ?? "manual",
    receivedAt: opp.enquiry?.received_at ?? opp.created_at,
    hasEmail: Boolean(opp.contact?.email),
    hasPhone: Boolean(opp.contact?.phone),
  });

  return { opp, tasks: tasks.data ?? [], appointments: appointments.data ?? [], notes: notes.data ?? [], activity: activity.data ?? [], quals: quals.data ?? [], fit, confidence, fc };
}

export type OpportunityDetail = NonNullable<Awaited<ReturnType<typeof getOpportunity>>>;
