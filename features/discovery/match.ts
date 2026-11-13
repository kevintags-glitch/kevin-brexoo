import { computeFit, type FitResult } from "@/features/crm/fit";
import { BUDGET_ORDER } from "@/features/crm/fit";

/** Map an estimated value to the budget buckets used by fit (only when the source gave one). */
export function budgetBucket(minor: number | null | undefined): string | null {
  if (minor == null) return null;
  const v = minor / 100;
  if (v < 10_000) return BUDGET_ORDER[0]!;
  if (v < 50_000) return BUDGET_ORDER[1]!;
  if (v < 150_000) return BUDGET_ORDER[2]!;
  if (v < 500_000) return BUDGET_ORDER[3]!;
  return BUDGET_ORDER[4]!;
}

export type MatchInput = {
  orgServices: { code: string; name: string }[];
  serviceAreas: { label: string; postcode?: string | null }[];
  idealMinBudget?: string | null;
};

/** Match % for a discovered record: the explainable fit score over the record's own fields. */
export function matchRecord(
  ctx: MatchInput,
  r: { category_code: string | null; location_text: string | null; postcode: string | null; timeline: string | null; estimated_value_minor: number | null },
): FitResult {
  return computeFit({
    orgServices: ctx.orgServices,
    serviceAreas: ctx.serviceAreas,
    idealMinBudget: ctx.idealMinBudget,
    requiredQuestions: [],
    project: { category_code: r.category_code, location_text: r.location_text, postcode: r.postcode, start_timing: r.timeline, budget_label: budgetBucket(r.estimated_value_minor) },
    answers: {},
  });
}

/** Freshness of the evidence (blueprint §8.2: show observed vs imported dates). */
export function freshness(observedAt: string | null, now = Date.now()): { label: string; tone: "green" | "amber" | "neutral" } {
  if (!observedAt) return { label: "Observed date unknown", tone: "neutral" };
  const days = Math.floor((now - new Date(observedAt).getTime()) / 86_400_000);
  if (days <= 14) return { label: days <= 0 ? "Observed today" : `Observed ${days} day${days === 1 ? "" : "s"} ago`, tone: "green" };
  if (days <= 60) return { label: `Observed ${days} days ago`, tone: "amber" };
  return { label: `Observed ${Math.round(days / 30)} months ago — may be stale`, tone: "neutral" };
}
