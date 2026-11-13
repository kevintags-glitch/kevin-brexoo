"use server";
/**
 * Brex AI server entry point. Authenticates first, enforces the monthly budget, then runs only
 * allowlisted read-only tools scoped to the caller's organisation (RLS applies to every query).
 * It never writes CRM data, sends messages or books anything; drafts come back for a person to use.
 */
import { z } from "zod";
import { STAGES, STAGE_BY_ID, OPEN_STAGES } from "@/features/crm/stages";
import { fitFor, getFitContext, getOpportunity, questionsForCategory } from "@/features/crm/queries";
import { requireOrg } from "@/lib/auth/session";
import { formatMoney, formatRelative, plural } from "@/lib/format";
import { draftFollowUp, siteVisitBrief, summarizeRecord, type Draft, type RecordInput, type Segment } from "./summarize";

export type BrexReply = { segments: Segment[]; draft?: Draft; links?: { label: string; href: string }[]; error?: string; remaining?: number | null };

const TOOLS = ["summarize", "draft", "brief", "overdue", "pipeline", "missing", "recent", "help"] as const;
export type BrexTool = (typeof TOOLS)[number];

async function meter(ctx: Awaited<ReturnType<typeof requireOrg>>) {
  const { data: remaining } = await ctx.supabase.rpc("usage_remaining", { p_org: ctx.org.id, p_kind: "brex_ai" });
  if (remaining !== null && remaining !== undefined && remaining <= 0) return { blocked: true as const, remaining };
  await ctx.supabase.from("usage_events").insert({ organization_id: ctx.org.id, kind: "brex_ai", actor_id: ctx.user.id });
  return { blocked: false as const, remaining: remaining === null || remaining === undefined ? null : remaining - 1 };
}

function toRecordInput(d: Awaited<ReturnType<typeof getOpportunity>> & object): RecordInput {
  const { opp, fit, fc } = d;
  const answers = { ...((opp.project?.details as Record<string, unknown>) ?? {}), ...((opp.enquiry?.answers as Record<string, unknown>) ?? {}) };
  const labelled = questionsForCategory(fc.questions, opp.project?.category_code)
    .filter((q) => answers[q.key] != null && String(answers[q.key]).trim() !== "")
    .map((q) => ({ label: q.label, value: String(answers[q.key]) }));
  return {
    reference: opp.enquiry?.reference,
    contactName: opp.contact?.full_name ?? "The contact",
    email: opp.contact?.email,
    phone: opp.contact?.phone,
    preferredContact: opp.contact?.preferred_contact,
    doNotContact: Boolean(opp.contact?.do_not_contact),
    serviceName: fc.orgServices.find((s) => s.code === opp.project?.category_code)?.name ?? null,
    location: opp.project?.location_text,
    description: opp.project?.description ?? opp.enquiry?.message,
    startTiming: opp.project?.start_timing,
    budget: opp.project?.budget_label,
    answers: labelled,
    stage: opp.stage,
    upcomingAppointment: d.appointments.some((a) => ["scheduled", "confirmed", "rescheduled"].includes(a.status) && new Date(a.starts_at).getTime() > Date.now()),
    receivedAt: opp.enquiry?.received_at,
    source: opp.enquiry?.source,
    fit,
  };
}

/** Free-text questions are routed to one of the allowlisted tools; nothing else runs. */
function route(q: string): BrexTool {
  const s = q.toLowerCase();
  if (/draft|reply|write|email|follow.?up/.test(s)) return "draft";
  if (/brief|site visit|visit|consult/.test(s)) return "brief";
  if (/summar|what is this|tell me about|explain|why.*fit|fit/.test(s)) return "summarize";
  if (/overdue|late|due|today|priorit/.test(s)) return "overdue";
  if (/pipeline|stage|value|forecast|won|lost/.test(s)) return "pipeline";
  if (/missing|incomplete|need.*info|unknown/.test(s)) return "missing";
  if (/new|recent|latest|enquir/.test(s)) return "recent";
  return "help";
}

export async function askBrex(input: { tool?: BrexTool; question?: string; opportunityId?: string }): Promise<BrexReply> {
  const parsed = z
    .object({ tool: z.enum(TOOLS).optional(), question: z.string().max(500).optional(), opportunityId: z.string().uuid().optional() })
    .safeParse(input);
  if (!parsed.success) return { segments: [], error: "I couldn't read that request." };
  const ctx = await requireOrg();
  const tool = parsed.data.tool ?? route(parsed.data.question ?? "");
  const usage = await meter(ctx);
  if (usage.blocked) return { segments: [], error: "Your plan's Brex AI requests for this month are used up. They reset on the 1st.", remaining: 0 };

  const { supabase, org, profile } = ctx;
  const needsRecord = tool === "summarize" || tool === "draft" || tool === "brief";
  if (needsRecord && !parsed.data.opportunityId) {
    return { segments: [{ text: "Open a record and ask from there, or use the Brex AI panel on any enquiry. Here I can find overdue tasks, summarise the pipeline or list enquiries missing information." }], remaining: usage.remaining };
  }

  if (needsRecord) {
    const detail = await getOpportunity(ctx, parsed.data.opportunityId!);
    if (!detail) return { segments: [], error: "I can't find that record in your organisation." };
    const r = toRecordInput(detail);
    if (tool === "summarize") return { segments: summarizeRecord(r), remaining: usage.remaining };
    if (tool === "brief") return { segments: siteVisitBrief(r), remaining: usage.remaining };
    const d = draftFollowUp(r, { name: org.name, sender: profile?.full_name ?? org.contact_name ?? org.name });
    if (d.refusal) return { segments: [{ text: d.refusal, cite: "Contact restrictions" }], remaining: usage.remaining };
    return {
      segments: [{ text: d.draft!.channel === "phone" ? "No email on file, so here's a short call plan instead." : "Here's a draft. Review and edit it, then send it from your own email." }],
      draft: d.draft,
      remaining: usage.remaining,
    };
  }

  const now = new Date().toISOString();
  if (tool === "overdue") {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, due_at, opportunity_id")
      .eq("organization_id", org.id)
      .eq("status", "open")
      .lt("due_at", now)
      .order("due_at")
      .limit(8);
    if (!data?.length) return { segments: [{ text: "Nothing is overdue. Nice work." , cite: "Tasks" }], remaining: usage.remaining };
    return {
      segments: [
        { text: `${plural(data.length, "task")} overdue, oldest first. Start with the first; enquiries go cold fastest in the first day.`, cite: "Tasks" },
        ...data.map((t) => ({ text: `${t.title} — due ${formatRelative(t.due_at, org.timezone)}`, cite: "Tasks" })),
      ],
      links: data.filter((t) => t.opportunity_id).slice(0, 3).map((t) => ({ label: t.title, href: `/app/opportunities/${t.opportunity_id}` })),
      remaining: usage.remaining,
    };
  }

  if (tool === "pipeline") {
    const { data } = await supabase.from("opportunities").select("stage, value_minor, currency").eq("organization_id", org.id);
    const rows = data ?? [];
    const open = rows.filter((r) => OPEN_STAGES.includes(r.stage));
    const won = rows.filter((r) => r.stage === "won");
    const lost = rows.filter((r) => r.stage === "lost");
    const sum = (xs: typeof rows) => xs.reduce((s, r) => s + (r.value_minor ?? 0), 0);
    const byStage = STAGES.filter((s) => OPEN_STAGES.includes(s.id)).map((s) => ({ s, n: open.filter((o) => o.stage === s.id).length })).filter((x) => x.n);
    const closed = won.length + lost.length;
    return {
      segments: [
        { text: `${plural(open.length, "open opportunity", "open opportunities")}${sum(open) ? `, with ${formatMoney(sum(open), org.currency)} of value entered` : ""}.`, cite: "Pipeline" },
        ...(byStage.length ? [{ text: byStage.map((x) => `${STAGE_BY_ID[x.s.id].label}: ${x.n}`).join(" · "), cite: "Pipeline" }] : []),
        { text: closed ? `Win rate ${Math.round((won.length / closed) * 100)}% (${won.length} won, ${lost.length} lost)${sum(won) ? `, ${formatMoney(sum(won), org.currency)} won` : ""}.` : "No opportunities closed yet, so there's no win rate.", cite: "Pipeline" },
        { text: "Values only include amounts your team has entered.", cite: undefined },
      ],
      remaining: usage.remaining,
    };
  }

  if (tool === "missing" || tool === "recent") {
    const { data } = await supabase
      .from("opportunities")
      .select("id, title, stage, created_at, project:projects(category_code, location_text, postcode, start_timing, budget_label, details), enquiry:enquiries!opportunities_enquiry_id_organization_id_fkey(answers, reference)")
      .eq("organization_id", org.id)
      .in("stage", OPEN_STAGES)
      .order("created_at", { ascending: false })
      .limit(tool === "recent" ? 6 : 30);
    const fc = await getFitContext(ctx);
    const rows = (data ?? []).map((o) => ({ o, fit: fitFor(fc, o.project, o.enquiry?.answers) }));
    const list = tool === "missing" ? rows.filter((x) => x.fit.missing.length).slice(0, 8) : rows;
    if (!list.length) return { segments: [{ text: tool === "missing" ? "Every open record has its required details." : "No open enquiries yet." }], remaining: usage.remaining };
    return {
      segments: [
        { text: tool === "missing" ? `${plural(list.length, "open record")} missing details:` : "Most recent open opportunities:" },
        ...list.map(({ o, fit }) => ({
          text: `${o.title} — ${tool === "missing" ? `missing ${fit.missing.join(", ").toLowerCase()}` : `${fit.label.toLowerCase()}, ${STAGE_BY_ID[o.stage].label.toLowerCase()}, ${formatRelative(o.created_at, org.timezone)}`}`,
          cite: o.enquiry?.reference ? `Enquiry ${o.enquiry.reference}` : "Record",
        })),
      ],
      links: list.slice(0, 4).map(({ o }) => ({ label: o.title, href: `/app/opportunities/${o.id}` })),
      remaining: usage.remaining,
    };
  }

  return {
    segments: [
      { text: "I can help with your own Brexoo data, read-only:" },
      { text: "• On a record: summarise it, explain the fit, draft a follow-up, or prepare a site-visit brief." },
      { text: "• Here: what's overdue, a pipeline summary, recent enquiries, or records missing information." },
      { text: "I can't send messages, book appointments, change records or see other businesses' data." },
    ],
    remaining: usage.remaining,
  };
}
