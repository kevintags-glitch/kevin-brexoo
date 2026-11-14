/**
 * The Brex AI example on the home page. It runs the product's own logic (fit, buying intent,
 * summary, next best action and draft) over a sample lead, so the website shows exactly what the
 * app would show for that record, not hand-written marketing copy.
 */
import { getTemplate } from "@/config/industry-templates";
import { SAMPLE_BY_KEY, type SampleBusiness } from "@/config/samples";
import { draftFollowUp, nextBestAction, summarizeRecord, type RecordInput } from "@/features/brex-ai/summarize";
import { computeFit } from "@/features/crm/fit";
import { computeIntent } from "@/features/crm/intent";

const HOUR = 3_600_000;

export function brexExample(key: SampleBusiness["key"] = "builders", ref = "B-01", now = Date.now()) {
  const biz = SAMPLE_BY_KEY[key];
  const lead = biz.leads.find((l) => l.ref === ref) ?? biz.leads[0]!;
  const template = getTemplate(lead.service);
  const answers: Record<string, unknown> = { ...lead.answers };
  const location = [lead.suburb, lead.city].filter(Boolean).join(", ");
  const receivedAt = new Date(now - lead.hoursAgo * HOUR).toISOString();

  const fit = computeFit({
    orgServices: biz.services.map((code) => ({ code, name: getTemplate(code)?.name ?? code })),
    serviceAreas: biz.areas.map((a) => ({ label: [a.suburb, a.city].filter(Boolean).join(", "), postcode: a.postcode, county: a.county, city: a.city, suburb: a.suburb })),
    requiredQuestions: (template?.questions ?? []).filter((q) => q.required).map((q) => ({ key: q.key, label: q.label })),
    project: { category_code: lead.service, location_text: location, postcode: lead.postcode, start_timing: lead.timing, budget_label: lead.budget ?? null },
    answers,
  });

  const intent = computeIntent({ answers, startTiming: lead.timing, budgetLabel: lead.budget, message: lead.message, receivedAt, now });

  const labelFor = (k: string) => template?.questions.find((q) => q.key === k)?.label ?? k.replace(/_/g, " ");
  const record: RecordInput = {
    reference: lead.ref,
    contactName: lead.name,
    phone: lead.phone,
    email: null,
    preferredContact: "phone",
    doNotContact: false,
    serviceName: template?.name ?? null,
    location: `${location} ${lead.postcode}`,
    description: lead.message,
    startTiming: lead.timing,
    budget: lead.budget ?? null,
    answers: Object.entries(lead.answers)
      .filter(([k]) => k !== "start_timing" && k !== "budget_range")
      .map(([k, v]) => ({ label: labelFor(k), value: String(v) })),
    stage: lead.stage,
    receivedAt,
    source: lead.source,
    fit,
  };

  return {
    business: biz,
    lead,
    location,
    fit,
    intent,
    summary: summarizeRecord(record).filter((s) => !s.text.startsWith("Next best action")),
    next: nextBestAction(record),
    draft: draftFollowUp(record, { name: biz.name, sender: "Jordan" }).draft,
  };
}
